import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirestoreInstance } from "@/services/firebase/firestore";
import { getAuth } from "@/services/firebase/auth";
import { generateRoundTheme } from "@/services/ai/aiService";
import type {
  PlayerPublic,
  PlayerSecret,
  RoomDocument,
  RoomReference,
} from "@/features/room/types";

const db = getFirestoreInstance();

function createRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getRoomCollection() {
  return collection(db, "rooms");
}

function getRoomDoc(roomId: string) {
  return doc(db, "rooms", roomId);
}

function getPlayersCollection(roomId: string) {
  return collection(db, "rooms", roomId, "players");
}

function getPlayerSecretsCollection(roomId: string) {
  return collection(db, "rooms", roomId, "playerSecrets");
}

function buildPublicPlayer(uid: string, nickname: string, isHost: boolean): PlayerPublic {
  return {
    uid,
    nickname,
    isHost,
    joinedAt: serverTimestamp() as unknown as PlayerPublic["joinedAt"],
    score: 0,
  };
}

export async function getRoomByCode(code: string): Promise<RoomReference> {
  const q = query(getRoomCollection(), where("code", "==", code), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Sala não encontrada.");
  }

  const roomDoc = snapshot.docs[0];
  return {
    roomId: roomDoc.id,
    room: roomDoc.data() as RoomDocument,
  };
}

export async function createRoom(nickname: string) {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const roomId = crypto.randomUUID();
  const code = createRoomCode();

  await setDoc(getRoomDoc(roomId), {
    code,
    hostUid: user.uid,
    status: "lobby",
    topic: "",
    wordMode: "same",
    playerCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(getPlayersCollection(roomId), user.uid), buildPublicPlayer(user.uid, nickname, true));

  return { roomId, code };
}

export async function joinRoom(code: string, nickname: string) {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const roomReference = await getRoomByCode(code);
  const roomId = roomReference.roomId;
  const roomDoc = await getDoc(getRoomDoc(roomId));

  if (!roomDoc.exists()) {
    throw new Error("Sala não encontrada.");
  }

  const room = roomDoc.data() as RoomDocument;
  if (room.status !== "lobby") {
    throw new Error("A partida já começou. Não é possível entrar agora.");
  }

  const playerRef = doc(getPlayersCollection(roomId), user.uid);
  const existingPlayer = await getDoc(playerRef);

  await setDoc(playerRef, buildPublicPlayer(user.uid, nickname, false), { merge: true });
  if (existingPlayer.exists()) {
    return { roomId };
  }

  return { roomId };
}

export function subscribeRoom(roomId: string, callback: (snapshot: any) => void) {
  return onSnapshot(getRoomDoc(roomId), callback as any);
}

export function subscribePlayers(roomId: string, callback: (items: PlayerPublic[]) => void) {
  return onSnapshot(getPlayersCollection(roomId), (snapshot) => {
    const playerItems = snapshot.docs.map((item) => item.data() as PlayerPublic);
    callback(playerItems);
  });
}

export function subscribePlayerSecret(roomId: string, uid: string, callback: (secret: PlayerSecret | null) => void) {
  return onSnapshot(doc(getPlayerSecretsCollection(roomId), uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as PlayerSecret) : null);
  });
}

export async function startGame(roomId: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const theme = await generateRoundTheme();
  const roomRef = getRoomDoc(roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists()) {
      throw new Error("Sala não encontrada.");
    }

    const room = roomSnapshot.data() as RoomDocument;
    if (room.hostUid !== user.uid) {
      throw new Error("Apenas o host pode iniciar a partida.");
    }

    const playersSnapshot = await getDocs(getPlayersCollection(roomId));
    if (playersSnapshot.size < 3) {
      throw new Error("São necessários pelo menos 3 jogadores para começar.");
    }

    const players = playersSnapshot.docs.map((item) => item.data() as PlayerPublic);
    const infiltratorIndex = Math.floor(Math.random() * players.length);

    players.forEach((player, index) => {
      const role = index === infiltratorIndex ? "infiltrator" : "agent";
      const assignedWord =
        role === "agent"
          ? theme.word
          : theme.mode === "none"
          ? "Palavra vaga"
          : theme.decoy;

      transaction.set(doc(getPlayerSecretsCollection(roomId), player.uid), {
        uid: player.uid,
        role,
        assignedWord,
        updatedAt: serverTimestamp(),
      });
    });

    transaction.update(roomRef, {
      status: "discussion",
      topic: theme.topic,
      wordMode: theme.mode,
      updatedAt: serverTimestamp(),
      roundStartedAt: serverTimestamp(),
    });
  });
}

export async function startVoting(roomId: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const roomRef = getRoomDoc(roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists()) {
      throw new Error("Sala não encontrada.");
    }

    const room = roomSnapshot.data() as RoomDocument;
    if (room.hostUid !== user.uid) {
      throw new Error("Apenas o host pode iniciar a votação.");
    }

    if (room.status !== "discussion") {
      throw new Error("A votação só pode começar após a discussão.");
    }

    transaction.update(roomRef, {
      status: "voting",
      updatedAt: serverTimestamp(),
    });
  });
}

export async function submitVote(roomId: string, voteForUid: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const secretRef = doc(getPlayerSecretsCollection(roomId), user.uid);
  const targetSecretRef = doc(getPlayerSecretsCollection(roomId), voteForUid);
  const secretSnapshot = await getDoc(secretRef);
  const targetSecretSnapshot = await getDoc(targetSecretRef);
  if (!secretSnapshot.exists()) {
    throw new Error("Dados de jogador não encontrados.");
  }
  if (!targetSecretSnapshot.exists()) {
    throw new Error("Jogador alvo não encontrado.");
  }
  if (voteForUid === user.uid) {
    throw new Error("Você não pode votar em si mesmo.");
  }

  await setDoc(
    secretRef,
    {
      ...secretSnapshot.data(),
      voteForUid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function finalizeVoting(roomId: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const roomRef = getRoomDoc(roomId);
  const secretCollection = getPlayerSecretsCollection(roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists()) {
      throw new Error("Sala não encontrada.");
    }

    const room = roomSnapshot.data() as RoomDocument;
    if (room.hostUid !== user.uid) {
      throw new Error("Apenas o host pode revelar o resultado.");
    }

    if (room.status !== "voting") {
      throw new Error("A votação ainda não começou.");
    }

    const secretsSnapshot = await getDocs(secretCollection);
    const votes = secretsSnapshot.docs.reduce<Record<string, number>>((acc, item) => {
      const secret = item.data() as PlayerSecret;
      if (secret.voteForUid) {
        acc[secret.voteForUid] = (acc[secret.voteForUid] ?? 0) + 1;
      }
      return acc;
    }, {});

    const voteEntries = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const highestVoteCount = voteEntries[0]?.[1] ?? 0;
    const tiedTop = voteEntries.filter(([, count]) => count === highestVoteCount);
    const selectedUid = tiedTop.length === 1 ? tiedTop[0][0] : null;

    const infiltrator = secretsSnapshot.docs.find((snapshot) => (snapshot.data() as PlayerSecret).role === "infiltrator");
    const result = selectedUid && infiltrator?.id === selectedUid ? "agents" : selectedUid ? "infiltrator" : "draw";

    transaction.update(roomRef, {
      status: "revealed",
      selectedUid: selectedUid ?? null,
      result,
      voteCounts: votes,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function leaveRoom(roomId: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  await Promise.all([
    deleteDoc(doc(getPlayersCollection(roomId), user.uid)).catch(() => undefined),
    deleteDoc(doc(getPlayerSecretsCollection(roomId), user.uid)).catch(() => undefined),
  ]);
}
