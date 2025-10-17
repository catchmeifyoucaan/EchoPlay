import { useEffect } from 'react';

import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { useAuthStore } from '../state/authStore';
import { MatchRoomState, ReactionTally, useMatchStore } from '../state/matchStore';

export const useMatchSockets = () => {
  const token = useAuthStore((state) => state.token);
  const matchId = useMatchStore((state) => state.match?.id);
  const socketRoom = useMatchStore((state) => state.socketRoom);
  const applyRoomState = useMatchStore((state) => state.applyRoomState);
  const handleRoundStarted = useMatchStore((state) => state.handleRoundStarted);
  const handleRoundEnded = useMatchStore((state) => state.handleRoundEnded);
  const handleTimerTick = useMatchStore((state) => state.handleTimerTick);
  const handleReactionUpdate = useMatchStore((state) => state.handleReactionUpdate);
  const handleVoteUpdate = useMatchStore((state) => state.handleVoteUpdate);
  const handleAiScore = useMatchStore((state) => state.handleAiScore);

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!socketRoom || !matchId) {
      return;
    }
    const socket = getSocket();
    socket.emit('join_room', { matchId, jwt: token });

    const onRoomState = (payload: MatchRoomState) => {
      applyRoomState(payload);
    };
    const onRoundStarted = (payload: { number: number; speakerUserId: string; endsAt: string }) => {
      handleRoundStarted(payload);
    };
    const onRoundEnded = (payload: { number: number }) => {
      handleRoundEnded(payload);
    };
    const onTimerTick = (payload: { remaining: number }) => {
      handleTimerTick(payload.remaining);
    };
    const onReactionUpdate = (payload: { counts: ReactionTally }) => {
      handleReactionUpdate(payload.counts);
    };
    const onVoteUpdate = (payload: { totals: Record<string, number> }) => {
      handleVoteUpdate(payload.totals);
    };
    const onAiScore = (payload: { score: number; winnerUserId?: string; feedbackSummary?: string; details?: unknown[] }) => {
      handleAiScore({
        score: payload.score,
        winnerUserId: payload.winnerUserId,
        feedbackSummary: payload.feedbackSummary,
        details: payload.details as any
      });
    };

    socket.on('room_state', onRoomState);
    socket.on('round_started', onRoundStarted);
    socket.on('round_ended', onRoundEnded);
    socket.on('timer_tick', onTimerTick);
    socket.on('reaction_update', onReactionUpdate);
    socket.on('vote_update', onVoteUpdate);
    socket.on('ai_score', onAiScore);

    return () => {
      socket.off('room_state', onRoomState);
      socket.off('round_started', onRoundStarted);
      socket.off('round_ended', onRoundEnded);
      socket.off('timer_tick', onTimerTick);
      socket.off('reaction_update', onReactionUpdate);
      socket.off('vote_update', onVoteUpdate);
      socket.off('ai_score', onAiScore);
    };
  }, [socketRoom, matchId, token, applyRoomState, handleRoundStarted, handleRoundEnded, handleTimerTick, handleReactionUpdate, handleVoteUpdate, handleAiScore]);
};
