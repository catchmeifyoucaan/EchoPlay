import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MatchStatus, Mode } from '@prisma/client';

import { CoachService } from '../coach/coach.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { StartMatchDto } from './dto/start-match.dto';
import { LivekitService } from './livekit.service';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly livekitService: LivekitService,
    private readonly coachService: CoachService
  ) {}

  async createMatch(hostUserId: string, dto: CreateMatchDto) {
    const room = await this.livekitService.createRoom(dto.mode);

    const match = await this.prisma.debateMatch.create({
      data: {
        mode: dto.mode,
        topic: dto.topic ?? this.defaultTopicForMode(dto.mode),
        status: MatchStatus.LOBBY,
        hostUserId,
        roomId: room.name,
        participants: {
          create: {
            userId: hostUserId,
            side: 'HOST'
          }
        }
      },
      include: {
        participants: true
      }
    });

    const token = this.livekitService.createJoinToken(room.name, hostUserId, {
      matchId: match.id,
      role: 'HOST'
    });

    return {
      match,
      livekit: {
        roomName: room.name,
        token
      },
      socket: {
        room: `match:${match.id}`
      }
    };
  }

  async joinMatch(matchId: string, userId: string) {
    const match = await this.prisma.debateMatch.findUnique({
      where: { id: matchId },
      include: { participants: true }
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    let participant = match.participants.find((p) => p.userId === userId);
    if (!participant) {
      participant = await this.prisma.matchParticipant.create({
        data: {
          matchId,
          userId,
          side: match.mode === Mode.COUPLE ? (match.participants.length % 2 === 0 ? 'A' : 'B') : null
        }
      });
    }

    const token = this.livekitService.createJoinToken(match.roomId, userId, {
      matchId: match.id,
      role: participant.side ?? 'PARTICIPANT'
    });

    return {
      matchId: match.id,
      livekit: {
        roomName: match.roomId,
        token
      },
      socket: {
        room: `match:${match.id}`
      }
    };
  }

  async startMatch(matchId: string, userId: string, dto: StartMatchDto) {
    const match = await this.prisma.debateMatch.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId !== userId) {
      throw new UnauthorizedException('Only the host can start the match');
    }

    if (match.status !== MatchStatus.LOBBY) {
      throw new UnauthorizedException('Match already started');
    }

    const now = new Date();
    const updatedMatch = await this.prisma.debateMatch.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.LIVE,
        startedAt: now
      },
      include: {
        participants: true
      }
    });

    const speakerId = dto.speakerUserId ?? userId;
    const durationSec = dto.durationSec ?? 120;

    const round = await this.prisma.debateRound.create({
      data: {
        matchId,
        number: 1,
        speakerId,
        startedAt: now,
        endedAt: new Date(now.getTime() + durationSec * 1000)
      }
    });

    return {
      match: updatedMatch,
      round,
      timer: {
        durationSec,
        endsAt: round.endedAt
      }
    };
  }

  async scoreMatch(matchId: string, requesterId: string) {
    const match = await this.prisma.debateMatch.findUnique({
      where: { id: matchId },
      include: {
        rounds: true,
        votes: true,
        participants: true
      }
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId !== requesterId) {
      const participant = match.participants.find((p) => p.userId === requesterId);
      if (!participant) {
        throw new UnauthorizedException('Only match participants can request scoring');
      }
    }

    if (match.status === MatchStatus.SCORED) {
      return {
        match,
        evaluation: {
          score: match.aiScore ?? 0,
          winnerUserId: match.winnerUserId,
          summary: 'Match already scored',
          details: []
        }
      };
    }

    const evaluation = await this.coachService.evaluateMatch({
      matchId: match.id,
      rounds: match.rounds,
      votes: match.votes,
      participants: match.participants
    });

    const updatedMatch = await this.prisma.debateMatch.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.SCORED,
        aiScore: evaluation.score,
        winnerUserId: evaluation.winnerUserId,
        endedAt: new Date()
      },
      include: {
        rounds: true,
        votes: true,
        participants: true
      }
    });

    return {
      match: updatedMatch,
      evaluation
    };
  }

  async getMatch(matchId: string) {
    return this.prisma.debateMatch.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        rounds: true,
        reactions: true,
        votes: true,
        participants: true
      }
    });
  }

  private defaultTopicForMode(mode: Mode) {
    const defaults: Record<Mode, string> = {
      [Mode.SOLO]: 'What new skill should everyone learn in 2024?',
      [Mode.FAMILY]: 'How should families balance screen time and play?',
      [Mode.COUPLE]: 'What makes a perfect unplugged date night?',
      [Mode.GLOBAL]: 'Should AI moderators shape online debates?'
    };

    return defaults[mode];
  }
}
