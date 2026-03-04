'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPusherClient, getChannelName } from '@/lib/pusher-client';
import { Player, RoomState, TableState } from '@/types/game';
import { calculateWPM, calculateAccuracy, compareText } from '@/lib/game-utils';

const ROUND_DURATION = parseInt(process.env.NEXT_PUBLIC_ROUND_DURATION || '60');
const ROUND_INTERVAL = parseInt(process.env.NEXT_PUBLIC_ROUND_INTERVAL || '10');

export function useGame(roomId: string, _playerName?: string) {
  const [playerId] = useState(() => `player-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableState, setTableState] = useState<TableState>({
    sortField: 'wpm',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10,
  });
  const [playerJoined, setPlayerJoined] = useState(false);
  const startTimeRef = useRef<number>(0);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);

  const triggerEvent = useCallback(async (event: string, data: unknown) => {
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, roomId, data }),
      });
    } catch (err) {
      console.error('Failed to trigger event:', err);
    }
  }, [roomId]);

  const joinRoom = useCallback(async (name: string) => {
    const player: Player = {
      id: playerId,
      name: name,
      currentText: '',
      wpm: 0,
      accuracy: 0,
      correctChars: 0,
      totalChars: 0,
      finished: false,
      joinedAt: Date.now(),
    };

    // If roomState not loaded yet, fetch it first
    let currentRoomState = roomState;
    if (!currentRoomState) {
      try {
        const res = await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-room', roomId }),
        });
        const data = await res.json();
        if (data.room) {
          currentRoomState = {
            ...data.room,
            pendingPlayers: data.pendingPlayers || {},
          };
          setRoomState(currentRoomState);
        }
      } catch (err) {
        console.error('Failed to fetch room state before join:', err);
      }
    }

    if (!currentRoomState) return;

    const shouldBePending = currentRoomState.isRoundActive ?? false;

    // Add player to room state
    setRoomState(prev => {
      if (!prev) return prev;
      
      // If round is active, add to pending (will join next round)
      if (prev.isRoundActive) {
        return {
          ...prev,
          pendingPlayers: { ...prev.pendingPlayers, [player.id]: player },
        };
      }
      
      return {
        ...prev,
        players: { ...prev.players, [player.id]: player },
      };
    });

    await triggerEvent('player-join', { player, isPending: shouldBePending });
    setPlayerJoined(true);
  }, [playerId, roomState, roomId, triggerEvent]);

  const updateProgress = useCallback((currentText: string, finished: boolean = false) => {
    if (!roomState) return;
    
    const targetText = roomState.currentSentence;
    const { correctChars, totalChars } = compareText(currentText, targetText);
    const elapsed = finished && startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const wpm = calculateWPM(correctChars, elapsed);
    const accuracy = calculateAccuracy(correctChars, totalChars);

    setRoomState(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (updated.players[playerId]) {
        updated.players[playerId] = {
          ...updated.players[playerId],
          currentText,
          correctChars,
          totalChars,
          finished,
          wpm,
          accuracy,
        };
      }
      return updated;
    });

    triggerEvent('player-update', {
      playerId,
      currentText,
      correctChars,
      totalChars,
      finished,
      wpm,
      accuracy,
    });
  }, [roomState, playerId, triggerEvent]);

  useEffect(() => {
    const pusher = getPusherClient();
    pusherRef.current = pusher;
    const channel = pusher.subscribe(getChannelName(roomId));

    channel.bind('pusher:subscription_succeeded', async () => {
      setIsConnected(true);
      
      try {
        const res = await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-room', roomId }),
        });
        const data = await res.json();
        if (data.room) {
          setRoomState({
            ...data.room,
            pendingPlayers: data.pendingPlayers || {},
          });
          if (data.timeRemaining > 0) {
            setTimeLeft(data.timeRemaining);
          }
        }
      } catch (err) {
        console.error('Failed to fetch room state:', err);
      }
      
      setIsLoading(false);
    });

    channel.bind('pusher:subscription_error', (err: Error) => {
      setError(`Connection error: ${err.message}`);
      setIsLoading(false);
    });

    channel.bind('room-state', (data: RoomState) => {
      setRoomState(data);
    });

    channel.bind('player-join', (data: { player: Player; isPending: boolean }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        
        if (data.isPending) {
          return {
            ...prev,
            pendingPlayers: { ...prev.pendingPlayers, [data.player.id]: data.player },
          };
        }
        
        return {
          ...prev,
          players: { ...prev.players, [data.player.id]: data.player },
        };
      });
    });

    channel.bind('player-leave', (data: { playerId: string }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [data.playerId]: _removed, ...rest } = prev.players;
        return { ...prev, players: rest };
      });
    });

    channel.bind('player-update', (data: { playerId: string; currentText: string; correctChars: number; totalChars: number; finished: boolean; wpm: number; accuracy: number }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        if (!prev.players[data.playerId]) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [data.playerId]: {
              ...prev.players[data.playerId],
              currentText: data.currentText,
              correctChars: data.correctChars,
              totalChars: data.totalChars,
              finished: data.finished,
              wpm: data.wpm,
              accuracy: data.accuracy,
            },
          },
        };
      });
    });

    channel.bind('round-start', (data: { sentence: string; roundNumber: number; roundStartTime: number }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        
        // Start with existing players
        const resetPlayers: Record<string, Player> = {};
        Object.values(prev.players).forEach(player => {
          resetPlayers[player.id] = {
            ...player,
            currentText: '',
            wpm: 0,
            accuracy: 0,
            correctChars: 0,
            totalChars: 0,
            finished: false,
          };
        });
        
        // Move pending players to active
        if (prev.pendingPlayers) {
          Object.values(prev.pendingPlayers).forEach(player => {
            resetPlayers[player.id] = {
              ...player,
              currentText: '',
              wpm: 0,
              accuracy: 0,
              correctChars: 0,
              totalChars: 0,
              finished: false,
            };
          });
        }
        
        return {
          ...prev,
          currentSentence: data.sentence,
          roundNumber: data.roundNumber,
          roundStartTime: data.roundStartTime,
          isRoundActive: true,
          players: resetPlayers,
          pendingPlayers: {},
        };
      });
      setTimeLeft(ROUND_DURATION);
      startTimeRef.current = Date.now();
    });

    channel.bind('round-end', () => {
      setRoomState(prev => {
        if (!prev) return prev;
        return { ...prev, isRoundActive: false };
      });
    });

    return () => {
      pusher.unsubscribe(getChannelName(roomId));
    };
  }, [roomId]);

  const isInBreakRef = useRef(false);
  const isTransitioningRef = useRef(false);

  // Periodic sync with server to keep state fresh
  useEffect(() => {
    if (!isConnected) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-room', roomId }),
        });
        const data = await res.json();
        if (data.room) {
          setRoomState(prev => {
            if (!prev) return data.room;
            // Only update critical fields from server
            return {
              ...prev,
              isRoundActive: data.room.isRoundActive,
              currentSentence: data.room.currentSentence,
              roundNumber: data.room.roundNumber,
              roundStartTime: data.room.roundStartTime,
            };
          });
          if (data.timeRemaining > 0) {
            setTimeLeft(data.timeRemaining);
          }
        }
      } catch (err) {
        console.error('Failed to sync room state:', err);
      }
    }, 5000); // Sync every 5 seconds

    return () => clearInterval(syncInterval);
  }, [isConnected, roomId]);

  // Start first round when player joins - intentionally not tracking all deps
  useEffect(() => {
    if (isConnected && playerJoined && roomState && !roomState.isRoundActive) {
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-round', roomId }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, playerJoined, roomState?.isRoundActive, roomId]);

  useEffect(() => {
    if (!isConnected || !playerJoined) return;

    const timer = setInterval(() => {
      if (isTransitioningRef.current) return;
      
      setTimeLeft(prev => {
        const isRoundActive = roomState?.isRoundActive ?? false;
        
        // If no round active and not in break mode, don't count down
        if (!isRoundActive && !isInBreakRef.current) {
          return prev;
        }
        
        // If round just ended (became inactive), start break
        if (!isRoundActive && prev > 1 && prev < ROUND_DURATION) {
          isInBreakRef.current = true;
          return ROUND_INTERVAL;
        }
        
        if (prev <= 1) {
          if (!isInBreakRef.current) {
            // End the round
            isTransitioningRef.current = true;
            fetch('/api/room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'end-round', roomId }),
            }).finally(() => {
              isTransitioningRef.current = false;
            });
            isInBreakRef.current = true;
            return ROUND_INTERVAL;
          } else {
            // Start new round
            isTransitioningRef.current = true;
            fetch('/api/room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'request-round', roomId }),
            }).finally(() => {
              isTransitioningRef.current = false;
            });
            isInBreakRef.current = false;
            return ROUND_DURATION;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected, playerJoined, roomState?.isRoundActive, roomId]);

  const sortedPlayers = roomState ? Object.values(roomState.players).sort((a, b) => {
    const field = tableState.sortField;
    const direction = tableState.sortDirection;
    
    let comparison = 0;
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'wpm':
        comparison = a.wpm - b.wpm;
        break;
      case 'accuracy':
        comparison = a.accuracy - b.accuracy;
        break;
      case 'progress':
        comparison = a.currentText.length - b.currentText.length;
        break;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  }) : [];

  const paginatedPlayers = sortedPlayers.slice(
    (tableState.page - 1) * tableState.pageSize,
    tableState.page * tableState.pageSize
  );

  return {
    playerId,
    roomState,
    timeLeft,
    isConnected,
    isLoading,
    error,
    tableState,
    sortedPlayers,
    paginatedPlayers,
    joinRoom,
    updateProgress,
    setTableState,
    roundDuration: ROUND_DURATION,
  };
}
