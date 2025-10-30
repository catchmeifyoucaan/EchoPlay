import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface MatchTimer {
  matchId: string;
  durationSec: number;
  endsAt: Date;
  intervalId: NodeJS.Timeout;
}

interface JoinRoomPayload {
  matchId: string;
  jwt: string;
}

interface StartRoundPayload {
  matchId: string;
  speakerUserId: string;
  durationSec: number;
}

interface SubmitReactionPayload {
  matchId: string;
  type: 'heart' | 'thumbs' | 'laugh' | 'flame';
}

interface SubmitVotePayload {
  matchId: string;
  forUserId: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly activeTimers = new Map<string, MatchTimer>();
  private readonly matchParticipants = new Map<string, Set<string>>(); // matchId -> Set<socketId>
  private readonly socketToUser = new Map<string, string>(); // socketId -> userId
  private readonly reactions = new Map<string, Record<string, number>>(); // matchId -> reaction counts
  private readonly votes = new Map<string, Record<string, number>>(); // matchId -> vote counts

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up user mapping
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.socketToUser.delete(client.id);
    }

    // Remove from all match rooms
    for (const [matchId, participants] of this.matchParticipants.entries()) {
      if (participants.has(client.id)) {
        participants.delete(client.id);
        this.logger.log(`Removed ${client.id} from match ${matchId}`);
      }
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    try {
      const { matchId, jwt } = payload;

      // Verify JWT token
      let userId: string;
      try {
        const decoded = this.jwtService.verify(jwt);
        userId = decoded.id || decoded.sub;
      } catch (error) {
        this.logger.warn(`Invalid JWT for client ${client.id}`);
        client.emit('error', { message: 'Invalid authentication token' });
        return;
      }

      // Join the room
      const roomName = `match:${matchId}`;
      await client.join(roomName);

      // Track participant
      if (!this.matchParticipants.has(matchId)) {
        this.matchParticipants.set(matchId, new Set());
      }
      this.matchParticipants.get(matchId)!.add(client.id);
      this.socketToUser.set(client.id, userId);

      this.logger.log(`Client ${client.id} (user ${userId}) joined ${roomName}`);

      // Send current room state
      const roomState = this.getRoomState(matchId);
      client.emit('room_state', roomState);

      // Notify room of new participant
      this.server.to(roomName).emit('participant_joined', { userId, matchId });
    } catch (error) {
      this.logger.error(`Error in join_room: ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('start_round')
  handleStartRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartRoundPayload,
  ) {
    const { matchId, speakerUserId, durationSec } = payload;
    const roomName = `match:${matchId}`;

    // Stop any existing timer for this match
    this.stopTimer(matchId);

    // Calculate end time
    const endsAt = new Date(Date.now() + durationSec * 1000);

    // Start authoritative server-side timer
    const intervalId = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));

      // Broadcast timer tick
      this.server.to(roomName).emit('timer_tick', { remaining });

      // Stop timer when time is up
      if (remaining <= 0) {
        this.stopTimer(matchId);
        this.server.to(roomName).emit('round_ended', { matchId });
      }
    }, 1000);

    // Store timer
    this.activeTimers.set(matchId, {
      matchId,
      durationSec,
      endsAt,
      intervalId,
    });

    // Get current round number (stub for now)
    const roundNumber = 1; // TODO: Get from database

    this.logger.log(`Round started for match ${matchId}, speaker ${speakerUserId}, duration ${durationSec}s`);

    // Broadcast round started
    this.server.to(roomName).emit('round_started', {
      number: roundNumber,
      speakerUserId,
      endsAt: endsAt.toISOString(),
    });
  }

  @SubscribeMessage('end_round')
  handleEndRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: string },
  ) {
    const { matchId } = payload;
    const roomName = `match:${matchId}`;

    // Stop timer
    this.stopTimer(matchId);

    this.logger.log(`Round ended for match ${matchId}`);

    // Broadcast round ended
    this.server.to(roomName).emit('round_ended', { matchId });
  }

  @SubscribeMessage('submit_reaction')
  handleSubmitReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubmitReactionPayload,
  ) {
    const { matchId, type } = payload;
    const roomName = `match:${matchId}`;

    // Update reaction counts
    if (!this.reactions.has(matchId)) {
      this.reactions.set(matchId, { heart: 0, thumbs: 0, laugh: 0, flame: 0 });
    }
    const counts = this.reactions.get(matchId)!;
    counts[type] = (counts[type] || 0) + 1;

    this.logger.log(`Reaction ${type} submitted for match ${matchId}`);

    // Broadcast updated counts
    this.server.to(roomName).emit('reaction_update', { counts });
  }

  @SubscribeMessage('submit_vote')
  handleSubmitVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubmitVotePayload,
  ) {
    const { matchId, forUserId } = payload;
    const roomName = `match:${matchId}`;

    // Update vote counts
    if (!this.votes.has(matchId)) {
      this.votes.set(matchId, {});
    }
    const totals = this.votes.get(matchId)!;
    totals[forUserId] = (totals[forUserId] || 0) + 1;

    this.logger.log(`Vote submitted for user ${forUserId} in match ${matchId}`);

    // Broadcast updated totals
    this.server.to(roomName).emit('vote_update', { totals });
  }

  @SubscribeMessage('request_ai_score')
  handleRequestAiScore(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: string },
  ) {
    const { matchId } = payload;
    const roomName = `match:${matchId}`;

    this.logger.log(`AI score requested for match ${matchId}`);

    // TODO: Call AI scoring service
    // For now, send stub response
    const aiScore = {
      score: 85,
      winnerUserId: 'stub-winner-id',
      feedbackSummary: 'Good debate! Both participants showed strong arguments.',
      details: [
        { label: 'Clarity', score: 90, notes: 'Clear articulation' },
        { label: 'Logic', score: 80, notes: 'Sound reasoning' },
      ],
    };

    this.server.to(roomName).emit('ai_score', aiScore);
  }

  private stopTimer(matchId: string) {
    const timer = this.activeTimers.get(matchId);
    if (timer) {
      clearInterval(timer.intervalId);
      this.activeTimers.delete(matchId);
      this.logger.log(`Timer stopped for match ${matchId}`);
    }
  }

  private getRoomState(matchId: string) {
    const timer = this.activeTimers.get(matchId);
    const reactions = this.reactions.get(matchId) || { heart: 0, thumbs: 0, laugh: 0, flame: 0 };
    const votes = this.votes.get(matchId) || {};

    return {
      match: { id: matchId, status: 'LIVE' }, // TODO: Get from database
      participants: [], // TODO: Get from database
      round: null, // TODO: Get current round from database
      timer: timer ? {
        remaining: Math.max(0, Math.floor((timer.endsAt.getTime() - Date.now()) / 1000)),
        duration: timer.durationSec,
        endsAt: timer.endsAt.toISOString(),
      } : null,
      reactions,
      votes,
    };
  }

  // Cleanup on module destroy
  onModuleDestroy() {
    // Stop all timers
    for (const [matchId, timer] of this.activeTimers.entries()) {
      clearInterval(timer.intervalId);
    }
    this.activeTimers.clear();
    this.logger.log('All timers stopped');
  }
}
