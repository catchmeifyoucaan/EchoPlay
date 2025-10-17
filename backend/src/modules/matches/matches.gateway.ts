import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { ReactionType } from '@prisma/client';
import { Server, Socket } from 'socket.io';

import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/types/auth-user.interface';
import { MatchesService } from './matches.service';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user?: AuthUser;
  };
}

interface JoinRoomPayload {
  matchId: string;
  jwt?: string;
}

interface StartDebatePayload extends JoinRoomPayload {
  speakerUserId?: string;
  durationSec?: number;
}

interface RoundEventPayload {
  matchId: string;
  speakerUserId?: string;
  durationSec?: number;
  jwt?: string;
}

interface SubmitReactionPayload {
  matchId: string;
  type: keyof typeof ReactionType | string;
  jwt?: string;
}

interface SubmitVotePayload {
  matchId: string;
  forUserId: string;
  jwt?: string;
}

interface EndRoundPayload {
  matchId: string;
  jwt?: string;
}

interface RequestScorePayload {
  matchId: string;
  jwt?: string;
}

@WebSocketGateway({ namespace: '/realtime', cors: { origin: '*' } })
export class MatchesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(MatchesGateway.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly timerTargets = new Map<string, { endsAt: Date; durationSec: number }>();

  constructor(private readonly authService: AuthService, private readonly matchesService: MatchesService) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      client.data.user = await this.authService.validateAccessToken(token);
    } catch (error) {
      this.logger.warn(`Socket connection rejected: ${error instanceof Error ? error.message : error}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.data.user) {
      return;
    }
    this.logger.debug(`Socket disconnected for user ${client.data.user.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: JoinRoomPayload) {
    try {
      const user = await this.ensureUser(client, payload.jwt);
      await client.join(this.roomName(payload.matchId));
      this.logger.debug(`User ${user.id} joined match ${payload.matchId}`);
      await this.broadcastRoomState(payload.matchId);
      return { ok: true };
    } catch (error) {
      this.logger.warn(`join_room failed: ${this.safeError(error)}`);
      return { ok: false, error: this.safeError(error) };
    }
  }

  @SubscribeMessage('start_debate')
  async handleStartDebate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: StartDebatePayload
  ) {
    try {
      const user = await this.ensureUser(client, payload.jwt);
      const result = await this.matchesService.startMatch(payload.matchId, user.id, {
        speakerUserId: payload.speakerUserId ?? user.id,
        durationSec: payload.durationSec
      });

      this.startTimer(payload.matchId, result.round.startedAt, result.timer.durationSec);
      this.emitRoundStarted(payload.matchId, result.round);
      await this.broadcastRoomState(payload.matchId);

      return { ok: true };
    } catch (error) {
      const message = this.safeError(error);

      if (message === 'Match already started') {
        try {
          const match = await this.matchesService.getMatch(payload.matchId);
          const latestRound = match.rounds[match.rounds.length - 1];

          if (match.status === 'LIVE' && latestRound) {
            const fallbackDuration = payload.durationSec ?? 120;
            this.startTimer(payload.matchId, latestRound.startedAt, fallbackDuration);
            this.emitRoundStarted(payload.matchId, latestRound);
            await this.broadcastRoomState(payload.matchId);
            return { ok: true };
          }
        } catch (innerError) {
          this.logger.warn(`start_debate recovery failed: ${this.safeError(innerError)}`);
        }
      }

      this.logger.warn(`start_debate failed: ${message}`);
      return { ok: false, error: message };
    }
  }

  @SubscribeMessage('start_round')
  async handleStartRound(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: RoundEventPayload) {
    try {
      const user = await this.ensureUser(client, payload.jwt);
      const result = await this.matchesService.startRound(payload.matchId, user.id, {
        speakerUserId: payload.speakerUserId ?? user.id,
        durationSec: payload.durationSec
      });
      this.startTimer(payload.matchId, result.round.startedAt, result.timer.durationSec);
      this.emitRoundStarted(payload.matchId, result.round);
      await this.broadcastRoomState(payload.matchId);

      return { ok: true };
    } catch (error) {
      this.logger.warn(`start_round failed: ${this.safeError(error)}`);
      return { ok: false, error: this.safeError(error) };
    }
  }

  @SubscribeMessage('end_round')
  async handleEndRound(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: EndRoundPayload) {
    try {
      const user = await this.ensureUser(client, payload.jwt);
      const round = await this.matchesService.endRound(payload.matchId, user.id);
      this.stopTimer(payload.matchId);
      this.server.to(this.roomName(payload.matchId)).emit('round_ended', {
        roundId: round.id,
        number: round.number
      });
      await this.broadcastRoomState(payload.matchId);

      return { ok: true };
    } catch (error) {
      this.logger.warn(`end_round failed: ${this.safeError(error)}`);
      return { ok: false, error: this.safeError(error) };
    }
  }

  @SubscribeMessage('submit_reaction')
  async handleSubmitReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SubmitReactionPayload
  ) {
    try {
      const user = await this.ensureUser(client, payload.jwt);
      const typeKey = payload.type.toUpperCase() as keyof typeof ReactionType;
      const reactionType = ReactionType[typeKey] ?? ReactionType.HEART;
      const counts = await this.matchesService.recordReaction(payload.matchId, user.id, reactionType);
      this.server.to(this.roomName(payload.matchId)).emit('reaction_update', { counts });
      return { ok: true };
    } catch (error) {
      this.logger.warn(`submit_reaction failed: ${this.safeError(error)}`);
      return { ok: false, error: this.safeError(error) };
    }
  }

  @SubscribeMessage('submit_vote')
  async handleSubmitVote(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: SubmitVotePayload) {
    try {
      const user = await this.ensureUser(client, payload.jwt);
      const totals = await this.matchesService.recordVote(payload.matchId, user.id, payload.forUserId);
      this.server.to(this.roomName(payload.matchId)).emit('vote_update', { totals });
      return { ok: true };
    } catch (error) {
      this.logger.warn(`submit_vote failed: ${this.safeError(error)}`);
      return { ok: false, error: this.safeError(error) };
    }
  }

  @SubscribeMessage('request_ai_score')
  async handleRequestScore(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RequestScorePayload
  ) {
    try {
      const user = await this.ensureUser(client, payload.jwt);
      const result = await this.matchesService.scoreMatch(payload.matchId, user.id);
      this.stopTimer(payload.matchId);
      this.server.to(this.roomName(payload.matchId)).emit('ai_score', {
        score: result.evaluation.score,
        winnerUserId: result.evaluation.winnerUserId,
        feedbackSummary: result.evaluation.summary,
        details: result.evaluation.details
      });
      this.server.to(this.roomName(payload.matchId)).emit('match_ended', {
        aiScore: result.evaluation.score,
        winnerUserId: result.evaluation.winnerUserId
      });
      await this.broadcastRoomState(payload.matchId);
      return { ok: true };
    } catch (error) {
      this.logger.warn(`request_ai_score failed: ${this.safeError(error)}`);
      return { ok: false, error: this.safeError(error) };
    }
  }

  private async broadcastRoomState(matchId: string) {
    const match = await this.matchesService.getMatch(matchId);
    const latestRound = match.rounds.length ? match.rounds[match.rounds.length - 1] : null;
    const timer = this.getTimerPayload(matchId);
    const reactions = await this.matchesService.getReactionCounts(matchId);
    const votes = await this.matchesService.getVoteTotals(matchId);

    this.server.to(this.roomName(matchId)).emit('room_state', {
      match,
      participants: match.participants,
      round: latestRound,
      timer,
      reactions,
      votes
    });
  }

  private emitRoundStarted(matchId: string, round: { id: string; number: number; speakerId: string; startedAt: Date; endedAt: Date | null }) {
    const timer = this.getTimerPayload(matchId);
    this.server.to(this.roomName(matchId)).emit('round_started', {
      round: {
        ...round,
        startedAt: round.startedAt instanceof Date ? round.startedAt.toISOString() : round.startedAt,
        endedAt: round.endedAt instanceof Date ? round.endedAt?.toISOString() ?? null : round.endedAt
      },
      timer
    });
  }

  private startTimer(matchId: string, startedAt: Date, durationSec: number) {
    this.stopTimer(matchId);
    const startTime = startedAt instanceof Date ? startedAt : new Date(startedAt);
    const endsAt = new Date(startTime.getTime() + durationSec * 1000);
    this.timerTargets.set(matchId, { endsAt, durationSec });

    const tick = () => {
      const payload = this.getTimerPayload(matchId);
      if (!payload) {
        return;
      }
      this.server.to(this.roomName(matchId)).emit('timer_tick', { remaining: payload.remaining });
      if (payload.remaining <= 0) {
        this.stopTimer(matchId);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    this.timers.set(matchId, interval);
  }

  private stopTimer(matchId: string) {
    const timer = this.timers.get(matchId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(matchId);
    }
    this.timerTargets.delete(matchId);
  }

  private getTimerPayload(matchId: string) {
    const target = this.timerTargets.get(matchId);
    if (!target) {
      return null;
    }

    const remaining = Math.max(0, Math.ceil((target.endsAt.getTime() - Date.now()) / 1000));
    return {
      duration: target.durationSec,
      remaining,
      endsAt: target.endsAt.toISOString()
    };
  }

  private roomName(matchId: string) {
    return `match:${matchId}`;
  }

  private extractToken(client: AuthenticatedSocket) {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token) {
      return auth.token as string;
    }
    const header = client.handshake.headers['authorization'];
    if (typeof header === 'string') {
      return header.replace('Bearer ', '');
    }
    return undefined;
  }

  private async ensureUser(client: AuthenticatedSocket, jwt?: string) {
    if (client.data.user) {
      return client.data.user;
    }

    if (!jwt) {
      throw new Error('Authentication required');
    }

    const user = await this.authService.validateAccessToken(jwt);
    client.data.user = user;
    return user;
  }

  private safeError(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
