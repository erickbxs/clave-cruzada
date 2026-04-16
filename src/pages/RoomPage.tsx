import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuth } from "@/services/firebase/auth";
import {
  getRoomByCode,
  subscribePlayerSecret,
  subscribePlayers,
  subscribeRoom,
  startGame,
  startVoting,
  submitVote,
  finalizeVoting,
  leaveRoom,
} from "@/features/room/services/roomService";
import { Button } from "@/shared/components/ui/Button";
import { Spinner } from "@/shared/components/ui/Spinner";
import type { PlayerPublic, PlayerSecret, RoomDocument } from "@/features/room/types";

export default function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDocument | null>(null);
  const [players, setPlayers] = useState<PlayerPublic[]>([]);
  const [secret, setSecret] = useState<PlayerSecret | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"start" | "vote-start" | "vote-submit" | "vote-finish" | null>(null);

  const currentUid = getAuth().currentUser?.uid;
  const isHost = room?.hostUid === currentUid;
  const stage = room?.status ?? "lobby";

  useEffect(() => {
    if (!roomCode) {
      setError("Código de sala inválido.");
      setLoading(false);
      return;
    }

    let unsubscribeRoom = () => {};
    let unsubscribePlayers = () => {};
    let unsubscribeSecret = () => {};

    getRoomByCode(roomCode)
      .then(({ roomId, room }) => {
        setRoomId(roomId);
        setRoom(room);
        unsubscribeRoom = subscribeRoom(roomId, (snapshot) => {
          const data = snapshot.data();
          if (!data) {
            setError("Sala removida ou não encontrada.");
            return;
          }
          setRoom(data as RoomDocument);
        });
        unsubscribePlayers = subscribePlayers(roomId, (items) => setPlayers(items));
        if (currentUid) {
          unsubscribeSecret = subscribePlayerSecret(roomId, currentUid, (item) => setSecret(item));
        }
      })
      .catch((baseError) => {
        console.error(baseError);
        setError(
          baseError instanceof Error
            ? baseError.message
            : "Não foi possível encontrar a sala."
        );
      })
      .finally(() => setLoading(false));

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
      unsubscribeSecret();
    };
  }, [currentUid, roomCode]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => Number(b.isHost) - Number(a.isHost)),
    [players]
  );

  function handleLeave() {
    if (!roomId) {
      navigate("/");
      return;
    }

    leaveRoom(roomId)
      .catch((err) => console.error(err))
      .finally(() => navigate("/"));
  }

  async function handleStartGame() {
    if (!roomId) return;
    setActionError(null);
    setActionLoading("start");
    try {
      await startGame(roomId);
    } catch (startError) {
      console.error(startError);
      setActionError("Não foi possível iniciar o jogo. Verifique se há jogadores suficientes.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStartVoting() {
    if (!roomId) return;
    setActionError(null);
    setActionLoading("vote-start");
    try {
      await startVoting(roomId);
    } catch (voteError) {
      console.error(voteError);
      setActionError("Falha ao iniciar a votação.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFinishVoting() {
    if (!roomId) return;
    setActionError(null);
    setActionLoading("vote-finish");
    try {
      await finalizeVoting(roomId);
    } catch (finishError) {
      console.error(finishError);
      setActionError("Falha ao revelar o resultado.");
    } finally {
      setActionLoading(null);
    }
  }

  function renderLobby() {
    return (
      <section className="space-y-8">
        <div className="glass-card rounded-[36px] border border-white/70 bg-white/90 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-violet-600">Sala</p>
              <h2 className="text-3xl font-semibold text-slate-900">{room?.code}</h2>
              <p className="mt-2 text-slate-600">Códigos simples para partidas rápidas.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                {players.length} / 8 jogadores
              </span>
              <Button onClick={handleLeave} variant="secondary">
                Sair da sala
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Jogadores</h3>
              <div className="grid gap-3">
                {sortedPlayers.map((player) => (
                  <div key={player.uid} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{player.nickname}</p>
                      <p className="text-sm text-slate-500">
                        {player.uid === currentUid
                          ? `Você${player.isHost ? " • Host" : ""}`
                          : player.isHost
                          ? "Host"
                          : "Participante"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-700">Instruções</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>1. Aguarde pelo menos 3 jogadores.</li>
                <li>2. O host inicia o jogo.</li>
                <li>3. Os papéis são distribuídos de forma segura.</li>
              </ul>
              {isHost ? (
                <Button onClick={handleStartGame} disabled={players.length < 3 || actionLoading !== null}>
                  {players.length < 3 ? "Aguardando mais jogadores" : "Iniciar partida"}
                </Button>
              ) : (
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  Aguarde o host iniciar a partida.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card space-y-6 rounded-[32px] border border-white/70 bg-white/95 p-8">
            <div className="rounded-[28px] border border-violet-100 bg-violet-50/70 p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Dicas rápidas</p>
              <p className="mt-3 text-sm text-slate-600">
                Compartilhe o código com os amigos. Mantenha o jogo curto e leve. O modo online é ideal
                para partidas com 3 a 6 pessoas.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <p>
                Se quiser testar sem rede, use a tela de modo local na página inicial.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderDiscussion() {
    return (
      <section className="space-y-8">
        <div className="glass-card rounded-[36px] border border-white/70 bg-white/90 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-violet-600">Tema</p>
              <h2 className="text-3xl font-semibold text-slate-900">{room?.topic}</h2>
              <p className="mt-2 text-sm text-slate-600">Discutam a palavra e tentem encontrar o infiltrado.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Fase de discussão
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="glass-card rounded-[32px] border border-white/70 bg-white/95 p-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Sua palavra</h3>
              <p className="text-sm text-slate-600">
                {secret ? (
                  <span className="font-medium text-slate-900">{secret.assignedWord || "Palavra vaga"}</span>
                ) : (
                  "Aguarde a sincronização do jogo."
                )}
              </p>
              <p className="text-sm text-slate-500">
                {secret?.role === "infiltrator"
                  ? "Você é o infiltrado. Evite ser descoberto."
                  : "Você tem a palavra do grupo. Ajude a identificar o infiltrado."}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-[32px] border border-white/70 bg-white/95 p-8 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Status</h3>
              <p className="text-sm text-slate-600">
                Total de jogadores: <span className="font-semibold text-slate-900">{players.length}</span>
              </p>
              {isHost ? (
                <Button onClick={handleStartVoting} disabled={actionLoading !== null}>
                  Ir para votação
                </Button>
              ) : (
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  Aguarde o host iniciar a votação.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderVoting() {
    return (
      <section className="space-y-8">
        <div className="glass-card rounded-[36px] border border-white/70 bg-white/90 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-violet-600">Votação</p>
              <h2 className="text-3xl font-semibold text-slate-900">Escolha quem parece suspeito</h2>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              {secret?.voteForUid ? "Voto registrado" : "Aguardando voto"}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {sortedPlayers.map((player) => (
            <div key={player.uid} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{player.nickname}</p>
                <p className="text-sm text-slate-500">{player.isHost ? "Host" : "Jogador"}</p>
              </div>
              <Button
                variant={secret?.voteForUid === player.uid ? "primary" : "secondary"}
                onClick={async () => {
                  if (!roomId) return;
                  setActionError(null);
                  setActionLoading("vote-submit");
                  try {
                    await submitVote(roomId, player.uid);
                  } catch (voteError) {
                    console.error(voteError);
                    setActionError(
                      voteError instanceof Error
                        ? voteError.message
                        : "Falha ao registrar o voto. Tente novamente."
                    );
                  } finally {
                    setActionLoading(null);
                  }
                }}
                disabled={actionLoading !== null}
              >
                Votar
              </Button>
            </div>
          ))}
        </div>

        {isHost ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-100 p-5">
            <p className="text-sm text-slate-600">
              Use o botão abaixo para revelar o resultado depois que todos votarem.
            </p>
            <Button onClick={handleFinishVoting} disabled={actionLoading !== null}>
              Revelar resultado
            </Button>
          </div>
        ) : null}
      </section>
    );
  }

  function renderRevealed() {
    const resultLabel = room?.result === "agents" ? "Agentes venceram" : room?.result === "infiltrator" ? "Infiltrado venceu" : "Empate";
    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.22em] text-violet-600">Resultado</p>
            <h2 className="text-3xl font-semibold text-slate-900">{resultLabel}</h2>
            <p className="text-sm text-slate-600">
              {room?.selectedUid
                ? `O jogador selecionado foi ${players.find((item) => item.uid === room.selectedUid)?.nickname ?? "indefinido"}.`
                : "O tempo acabou sem escolha clara."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-slate-900">Tema</h3>
            <p className="text-sm text-slate-600">{room?.topic}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Modo</p>
              <p className="text-lg font-semibold text-slate-900">{room?.wordMode}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Total de jogadores</p>
              <p className="text-lg font-semibold text-slate-900">{players.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-100 p-5 text-sm text-slate-700">
          Para jogar novamente, peça ao host para reiniciar a sala ou volte à página inicial para criar uma nova.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Spinner label="Sincronizando sala..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
          <h2 className="text-2xl font-semibold">Erro</h2>
          <p className="mt-3">{error}</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Voltar para o início</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        {actionError ? (
          <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}
        {stage === "lobby" && renderLobby()}
        {stage === "discussion" && renderDiscussion()}
        {stage === "voting" && renderVoting()}
        {stage === "revealed" && renderRevealed()}
      </div>
    </main>
  );
}
