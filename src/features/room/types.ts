import type { Timestamp } from "firebase/firestore";

export type Role = "agent" | "infiltrator";
export type RoomStatus = "lobby" | "discussion" | "voting" | "revealed";
export type WordMode = "same" | "different" | "none";
export type RoundResult = "agents" | "infiltrator" | "draw";

export interface RoomDocument {
  code: string;
  hostUid: string;
  status: RoomStatus;
  topic: string;
  wordMode: WordMode;
  playerCount: number;
  result?: RoundResult;
  selectedUid?: string;
  voteCounts?: Record<string, number>;
  roundStartedAt?: Timestamp;
  roundEndsAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PlayerPublic {
  uid: string;
  nickname: string;
  isHost: boolean;
  joinedAt: Timestamp;
  score?: number;
}

export interface PlayerSecret {
  uid: string;
  role: Role;
  assignedWord: string;
  voteForUid?: string;
  updatedAt?: Timestamp;
}

export interface RoomReference {
  roomId: string;
  room: RoomDocument;
}
