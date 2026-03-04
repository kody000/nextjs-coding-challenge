export interface Player {
  id: string;
  name: string;
  currentText: string;
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  finished: boolean;
  joinedAt: number;
}

export interface RoomState {
  roomId: string;
  currentSentence: string;
  roundStartTime: number;
  roundNumber: number;
  isRoundActive: boolean;
  players: Record<string, Player>;
  pendingPlayers: Record<string, Player>;
}

export interface GameEvent {
  type: 'player-join' | 'player-leave' | 'player-update' | 'round-start' | 'round-end' | 'room-state';
  payload: unknown;
  timestamp: number;
}

export interface JoinPayload {
  playerId: string;
  playerName: string;
  roomId: string;
}

export interface PlayerUpdatePayload {
  playerId: string;
  roomId: string;
  currentText: string;
  correctChars: number;
  totalChars: number;
  finished: boolean;
}

export interface RoundStartPayload {
  roomId: string;
  sentence: string;
  roundNumber: number;
  roundStartTime: number;
}

export type SortField = 'name' | 'wpm' | 'accuracy' | 'progress';
export type SortDirection = 'asc' | 'desc';

export interface TableState {
  sortField: SortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}
