import { RoomState, Player } from '@/types/game';
import { sentences } from '@/lib/sentences';

const rooms = new Map<string, RoomState>();

function getRandomSentence(): string {
  const index = Math.floor(Math.random() * sentences.length);
  return sentences[index];
}

export function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      currentSentence: getRandomSentence(),
      roundStartTime: 0,
      roundNumber: 0,
      isRoundActive: false,
      players: {},
      pendingPlayers: {},
    });
  }
  return rooms.get(roomId)!;
}

export function getRoom(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

export function updateRoom(roomId: string, updates: Partial<RoomState>) {
  const room = getOrCreateRoom(roomId);
  Object.assign(room, updates);
  return room;
}

export function addPlayerToRoom(roomId: string, player: Player) {
  const room = getOrCreateRoom(roomId);
  room.players[player.id] = player;
  return room;
}

export function removePlayerFromRoom(roomId: string, playerId: string) {
  const room = getRoom(roomId);
  if (room) {
    delete room.players[playerId];
  }
  return room;
}

export function updatePlayerInRoom(roomId: string, playerId: string, updates: Partial<Player>) {
  const room = getRoom(roomId);
  if (room && room.players[playerId]) {
    Object.assign(room.players[playerId], updates);
  }
  return room;
}

export function startNewRound(roomId: string) {
  const room = getOrCreateRoom(roomId);
  room.currentSentence = getRandomSentence();
  room.roundStartTime = Date.now();
  room.roundNumber += 1;
  room.isRoundActive = true;
  
  // Move pending players to active players
  Object.values(room.pendingPlayers).forEach(player => {
    room.players[player.id] = {
      ...player,
      currentText: '',
      wpm: 0,
      accuracy: 0,
      correctChars: 0,
      totalChars: 0,
      finished: false,
    };
  });
  room.pendingPlayers = {};
  
  // Reset active players
  Object.values(room.players).forEach(player => {
    player.currentText = '';
    player.wpm = 0;
    player.accuracy = 0;
    player.correctChars = 0;
    player.totalChars = 0;
    player.finished = false;
  });
  
  return room;
}

export function endRound(roomId: string) {
  const room = getRoom(roomId);
  if (room) {
    room.isRoundActive = false;
  }
  return room;
}
