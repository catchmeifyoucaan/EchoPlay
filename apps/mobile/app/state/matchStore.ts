import create from 'zustand';

import { apiClient } from '../lib/api';
import { analytics } from '../lib/analytics';
import { getSocket } from '../lib/socket';
import { useAuthStore } from './authStore';

export type ReactionKind = 'heart' | 'thumbs' | 'laugh' | 'flame';
export type Mode = 'SOLO' | 'FAMILY' | 'COUPLE' | 'GLOBAL';
export type MatchStatus = 'LOBBY' | 'LIVE' | 'SCORED' | 'ENDED';

export type MatchParticipant = {
  id: string;
  matchId: string;
  userId: string;
  side?: string | null;
  joinedAt?: string | null;
};

export type DebateRound = {
  id: string;
  matchId: string;
  number: number;
  speakerId: string;
  startedAt: string;
  endedAt?: string | null;
};

export type Match = {
  id: string;
  mode: Mode;
  topic: string;
  status: MatchStatus;
  hostUserId: string;
  roomId: string;
  startedAt?: string | null;
  endedAt?: string | null;
  aiScore?: number | null;
  winnerUserId?: string | null;
  participants?: MatchParticipant[];
  rounds?: DebateRound[];
};

export type TimerState = {
  durationSec: number;
  remainingSec: number;
  endsAt?: string;
};

export type ReactionTally = Record<ReactionKind, number>;

export type VoteTotals = Record<string, number>;

export type AiScoreSummary = {
  score: number;
  winnerUserId?: string | null;
  feedbackSummary?: string;
  details?: Array<{
    label: string;
    score: number;
    notes?: string;
  }>;
};

type CreateMatchPayload = {
  mode: Mode;
  topic?: string;
};

type StartRoundPayload = {
  speakerUserId: string;
  durationSec: number;
};

export type MatchRoomState = {
  match: Match;
  participants: MatchParticipant[];
  round: DebateRound | null;
  timer?: { remaining: number; duration: number; endsAt?: string };
  reactions?: ReactionTally;
  votes?: VoteTotals;
};

type MatchStoreState = {
  match: Match | null;
  participants: MatchParticipant[];
  currentRound: DebateRound | null;
  timer: TimerState | null;
  reactions: ReactionTally;
  votes: VoteTotals;
  role: 'HOST' | 'PARTICIPANT' | 'VIEWER' | null;
  livekit: { roomName: string; token: string } | null;
  status: 'idle' | 'loading' | 'ready';
  aiScore: AiScoreSummary | null;
  socketRoom: string | null;
  createMatch: (payload: CreateMatchPayload) => Promise<Match>;
  joinMatch: (matchId: string) => Promise<void>;
  startMatch: (matchId: string, payload: Partial<StartRoundPayload>) => Promise<void>;
  startRound: (payload: StartRoundPayload) => void;
  endRound: () => void;
  submitReaction: (type: ReactionKind) => void;
  submitVote: (forUserId: string) => void;
  requestAiScore: () => Promise<void>;
  resetMatch: () => void;
  applyRoomState: (payload: MatchRoomState) => void;
  handleRoundStarted: (payload: { round: DebateRound; timer?: { duration: number; remaining: number; endsAt?: string } }) => void;
  handleTimerTick: (remaining: number) => void;
  handleReactionUpdate: (counts: ReactionTally) => void;
  handleVoteUpdate: (totals: VoteTotals) => void;
  handleAiScore: (payload: AiScoreSummary) => void;
  handleRoundEnded: (payload: { roundId: string; number: number }) => void;
};

const emptyReactions: ReactionTally = {
  heart: 0,
  thumbs: 0,
  laugh: 0,
  flame: 0
};

const initialState: Omit<
  MatchStoreState,
  | 'createMatch'
  | 'joinMatch'
  | 'startMatch'
  | 'startRound'
  | 'endRound'
  | 'submitReaction'
  | 'submitVote'
  | 'requestAiScore'
  | 'resetMatch'
  | 'applyRoomState'
  | 'handleRoundStarted'
  | 'handleTimerTick'
  | 'handleReactionUpdate'
  | 'handleVoteUpdate'
  | 'handleAiScore'
  | 'handleRoundEnded'
> = {
  match: null,
  participants: [],
  currentRound: null,
  timer: null,
  reactions: { ...emptyReactions },
  votes: {},
  role: null,
  livekit: null,
  status: 'idle',
  aiScore: null,
  socketRoom: null
};

export const useMatchStore = create<MatchStoreState>((set, get) => ({
  ...initialState,
  createMatch: async (payload: CreateMatchPayload) => {
    set({ status: 'loading' });
    const result = await apiClient.post<{
      match: Match;
      livekit: { roomName: string; token: string };
      socket: { room: string };
    }>('/v1/matches', payload);
    analytics.capture('match_created', { mode: payload.mode });
    const { match } = result;
    set({
      match,
      participants: match.participants ?? [],
      currentRound: (match.rounds && match.rounds.length ? match.rounds[match.rounds.length - 1] : null),
      livekit: result.livekit,
      status: 'ready',
      role: 'HOST',
      socketRoom: result.socket.room,
      reactions: { ...emptyReactions },
      votes: {},
      aiScore: null
    });
    return match;
  },
  joinMatch: async (matchId: string) => {
    set({ status: 'loading' });
    const result = await apiClient.post<{
      matchId: string;
      livekit: { roomName: string; token: string };
      socket: { room: string };
    }>(`/v1/matches/${matchId}/join`);
    const match = await apiClient.get<Match & {
      participants: MatchParticipant[];
      rounds: DebateRound[];
      reactions: { type: ReactionKind }[];
      votes: { forUserId: string }[];
    }>(`/v1/matches/${matchId}`);
    analytics.capture('match_joined', { matchId });
    const reactionCounts = match.reactions
      ? match.reactions.reduce<ReactionTally>((acc, item) => {
          acc[item.type] = (acc[item.type] ?? 0) + 1;
          return acc;
        }, { ...emptyReactions })
      : { ...emptyReactions };
    const voteTotals = match.votes
      ? match.votes.reduce<VoteTotals>((acc, vote) => {
          acc[vote.forUserId] = (acc[vote.forUserId] ?? 0) + 1;
          return acc;
        }, {} as VoteTotals)
      : {};
    const currentUserId = useAuthStore.getState().user?.id ?? null;
    const role =
      currentUserId && currentUserId === match.hostUserId
        ? 'HOST'
        : currentUserId && match.participants.some((p) => p.userId === currentUserId)
        ? 'PARTICIPANT'
        : 'VIEWER';
    set({
      match,
      participants: match.participants,
      currentRound: match.rounds && match.rounds.length ? match.rounds[match.rounds.length - 1] : null,
      livekit: result.livekit,
      status: 'ready',
      role,
      socketRoom: result.socket.room,
      reactions: reactionCounts,
      votes: voteTotals,
      aiScore:
        typeof match.aiScore === 'number'
          ? {
              score: match.aiScore,
              winnerUserId: match.winnerUserId
            }
          : null
    });
  },
  startMatch: async (matchId: string, payload: Partial<StartRoundPayload>) => {
    const socket = getSocket();
    set({ status: 'loading' });

    await new Promise<void>((resolve, reject) => {
      socket
        .timeout(5000)
        .emit('start_debate', { matchId, ...payload }, (response?: { ok?: boolean; error?: string }) => {
          if (!response || !response.ok) {
            reject(new Error(response?.error ?? 'Unable to start match'));
          } else {
            resolve();
          }
        });
    });

    analytics.capture('match_started', { matchId });
    set((state) => ({
      status: 'ready',
      match: state.match ? { ...state.match, status: 'LIVE' } : state.match
    }));
  },
  startRound: ({ speakerUserId, durationSec }) => {
    const { match } = get();
    if (!match) {
      return;
    }
    const socket = getSocket();
    socket.emit('start_round', { matchId: match.id, speakerUserId, durationSec });
    analytics.capture('round_started', { matchId: match.id, speakerUserId });
  },
  endRound: () => {
    const { match } = get();
    if (!match) {
      return;
    }
    const socket = getSocket();
    socket.emit('end_round', { matchId: match.id });
    analytics.capture('round_ended', { matchId: match.id });
  },
  submitReaction: (type: ReactionKind) => {
    const { match } = get();
    if (!match) {
      return;
    }
    const socket = getSocket();
    socket.emit('submit_reaction', { matchId: match.id, type });
    analytics.capture('reaction_sent', { matchId: match.id, type });
  },
  submitVote: (forUserId: string) => {
    const { match } = get();
    if (!match) {
      return;
    }
    const socket = getSocket();
    socket.emit('submit_vote', { matchId: match.id, forUserId });
    analytics.capture('vote_submitted', { matchId: match.id, forUserId });
  },
  requestAiScore: async () => {
    const { match } = get();
    if (!match) {
      return;
    }
    const socket = getSocket();
    await new Promise<void>((resolve, reject) => {
      socket
        .timeout(5000)
        .emit('request_ai_score', { matchId: match.id }, (response?: { ok?: boolean; error?: string }) => {
          if (!response || !response.ok) {
            reject(new Error(response?.error ?? 'Unable to score match'));
          } else {
            resolve();
          }
        });
    });
    analytics.capture('ai_score_requested', { matchId: match.id });
  },
  resetMatch: () => {
    set({
      ...initialState,
      reactions: { ...emptyReactions },
      votes: {},
      timer: null,
      aiScore: null
    });
  },
  applyRoomState: (payload: MatchRoomState) => {
    set((state) => ({
      match: payload.match,
      participants: payload.participants,
      currentRound: payload.round,
      timer: payload.timer
        ? {
            durationSec: payload.timer.duration,
            remainingSec: Math.max(0, payload.timer.remaining),
            endsAt:
              payload.timer.endsAt ??
              (payload.round?.startedAt
                ? new Date(new Date(payload.round.startedAt).getTime() + payload.timer.duration * 1000).toISOString()
                : undefined)
          }
        : null,
      reactions: { ...emptyReactions, ...(payload.reactions ?? {}) },
      votes: { ...(payload.votes ?? {}) },
      status: 'ready',
      aiScore:
        typeof payload.match.aiScore === 'number'
          ? {
              score: payload.match.aiScore,
              winnerUserId: payload.match.winnerUserId
            }
          : state.aiScore
    }));
  },
  handleRoundStarted: ({ round, timer }) => {
    set((state) => {
      const startDate = round.startedAt ? new Date(round.startedAt) : new Date();
      const computedEndsAt = timer
        ? timer.endsAt ?? new Date(startDate.getTime() + timer.duration * 1000).toISOString()
        : null;

      const updatedMatch = state.match
        ? {
            ...state.match,
            status: 'LIVE',
            rounds: state.match.rounds
              ? [...state.match.rounds.filter((existing) => existing.id !== round.id), round].sort(
                  (a, b) => a.number - b.number
                )
              : [round]
          }
        : state.match;

      return {
        match: updatedMatch,
        currentRound: round,
        timer: timer
          ? {
              durationSec: timer.duration,
              remainingSec: timer.remaining,
              endsAt: computedEndsAt ?? state.timer?.endsAt
            }
          : state.timer
      };
    });
  },
  handleTimerTick: (remaining) => {
    set((state) => ({
      timer: state.timer
        ? {
            ...state.timer,
            remainingSec: Math.max(0, remaining)
          }
        : null
    }));
  },
  handleReactionUpdate: (counts) => {
    set({ reactions: { ...emptyReactions, ...counts } });
  },
  handleVoteUpdate: (totals) => {
    set({ votes: { ...totals } });
  },
  handleAiScore: (payload) => {
    set({ aiScore: payload });
  },
  handleRoundEnded: ({ roundId }) => {
    const endedAt = new Date().toISOString();
    set((state) => ({
      currentRound:
        state.currentRound && state.currentRound.id === roundId
          ? { ...state.currentRound, endedAt }
          : state.currentRound,
      match: state.match
        ? {
            ...state.match,
            rounds: state.match.rounds
              ? state.match.rounds.map((round) =>
                  round.id === roundId ? { ...round, endedAt } : round
                )
              : state.match.rounds
          }
        : state.match,
      timer: null
    }));
  }
}));
