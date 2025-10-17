import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DebateRound, MatchParticipant, MatchStatus, Mode, ReactionType } from '@prisma/client';

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
    const match = await this.prisma.debateMatch.findUnique({
      where: { id: matchId },
      include: { participants: true }
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId !== userId) {
      throw new UnauthorizedException('Only the host can start the match');
    }

    if (match.status !== MatchStatus.LOBBY) {
      throw new UnauthorizedException('Match already started');
    }

    const speakerId = dto.speakerUserId ?? userId;
    this.ensureParticipant(match.participants, speakerId);

    const durationSec = Math.max(dto.durationSec ?? 120, 30);
    const now = new Date();

    await this.prisma.debateMatch.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.LIVE,
        startedAt: now
      }
    });

    const round = await this.createRound(matchId, speakerId, 1, now);
    const hydratedMatch = await this.getMatch(matchId);

    return {
      match: hydratedMatch,
      round,
      timer: {
        durationSec,
        endsAt: new Date(now.getTime() + durationSec * 1000)
      }
    };
  }

  async startRound(matchId: string, userId: string, dto: StartMatchDto) {
    const match = await this.prisma.debateMatch.findUnique({
      where: { id: matchId },
      include: {
        participants: true,
        rounds: { orderBy: { number: 'asc' } }
      }
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId !== userId) {
      throw new UnauthorizedException('Only the host can start rounds');
    }

    if (match.status !== MatchStatus.LIVE) {
      throw new UnauthorizedException('Match must be live to start a round');
    }

    const speakerId = dto.speakerUserId ?? userId;
    this.ensureParticipant(match.participants, speakerId);

    const durationSec = Math.max(dto.durationSec ?? 120, 30);
    const roundNumber = (match.rounds?.length ?? 0) + 1;
    const now = new Date();

    const round = await this.createRound(matchId, speakerId, roundNumber, now);

    return {
      round,
      timer: {
        durationSec,
        endsAt: new Date(now.getTime() + durationSec * 1000)
      }
    };
  }

  async endRound(matchId: string, userId: string) {
    const match = await this.prisma.debateMatch.findUnique({
      where: { id: matchId },
      include: {
        participants: true,
        rounds: { orderBy: { number: 'desc' }, take: 1 }
      }
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const activeRound = match.rounds[0];
    if (!activeRound) {
      throw new NotFoundException('No active round to end');
    }

    if (match.hostUserId !== userId && activeRound.speakerId !== userId) {
      throw new UnauthorizedException('Only the host or active speaker can end the round');
    }

    if (activeRound.endedAt) {
      return activeRound;
    }

    return this.prisma.debateRound.update({
      where: { id: activeRound.id },
      data: { endedAt: new Date() }
    });
  }

  async recordReaction(matchId: string, userId: string | null, type: ReactionType) {
    await this.prisma.reaction.create({
      data: {
        matchId,
        userId: userId ?? undefined,
        type
      }
    });

    return this.getReactionCounts(matchId);
  }

  async recordVote(matchId: string, voterId: string | null, forUserId: string) {
    const participant = await this.prisma.matchParticipant.findFirst({
      where: { matchId, userId: forUserId }
    });

    if (!participant) {
      throw new NotFoundException('Cannot vote for a user outside the match');
    }

    if (voterId) {
      const existingVote = await this.prisma.vote.findFirst({
        where: { matchId, voterId }
      });

      if (existingVote) {
        await this.prisma.vote.update({
          where: { id: existingVote.id },
          data: { forUserId, createdAt: new Date() }
        });
      } else {
        await this.prisma.vote.create({
          data: {
            matchId,
            voterId,
            forUserId
          }
        });
      }
    } else {
      await this.prisma.vote.create({
        data: {
          matchId,
          forUserId
        }
      });
    }

    return this.getVoteTotals(matchId);
  }

  async getReactionCounts(matchId: string) {
    const grouped = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { matchId },
      _count: { _all: true }
    });

    const baseline: Record<string, number> = {
      heart: 0,
      thumbs: 0,
      laugh: 0,
      flame: 0
    };

    for (const item of grouped) {
      baseline[item.type.toLowerCase() as keyof typeof baseline] = item._count._all;
    }

    return baseline;
  }

  async getVoteTotals(matchId: string) {
    const grouped = await this.prisma.vote.groupBy({
      by: ['forUserId'],
      where: { matchId },
      _count: { _all: true }
    });

    const totals: Record<string, number> = {};
    for (const item of grouped) {
      totals[item.forUserId] = item._count._all;
    }

    return totals;
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
        rounds: { orderBy: { number: 'asc' } },
        reactions: true,
        votes: true,
        participants: true
      }
    });
  }

  private ensureParticipant(participants: MatchParticipant[], userId: string) {
    const participant = participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new UnauthorizedException('Selected user is not part of this match');
    }
  }

  private createRound(matchId: string, speakerId: string, number: number, startedAt: Date) {
    return this.prisma.debateRound.create({
      data: {
        matchId,
        number,
        speakerId,
        startedAt
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
