import { create } from "zustand";

interface GameState {
  roomCode: string;
  roomId: string | null;
  setRoom: (roomId: string | null, roomCode: string) => void;
  resetRoom: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomCode: "",
  roomId: null,
  setRoom: (roomId, roomCode) => set({ roomId, roomCode }),
  resetRoom: () => set({ roomId: null, roomCode: "" }),
}));
