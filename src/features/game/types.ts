import type { WordMode } from "@/features/room/types";

export interface LocalPlayer {
  id: string;
  name: string;
  role: "agent" | "infiltrator";
  assignedWord: string;
  voteFor?: string;
}

export interface LocalRound {
  topic: string;
  wordMode: WordMode;
  word: string;
  decoy: string;
  hint: string;
}
