import { Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

interface LeaderboardEntry {
  userId: string;
  score: number;
  matches: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(scope: string, period: string) {
    const snapshot = await this.prisma.leaderboardSnapshot.findFirst({
      where: {
        scope,
        period
      },
      orderBy: { createdAt: 'desc' }
    });

    if (snapshot) {
      return {
        scope,
        period,
        entries: snapshot.payload as LeaderboardEntry[],
        source: 'snapshot'
      };
    }

    const since = this.resolvePeriodStart(period);
    const matches = await this.prisma.debateMatch.findMany({
      where: {
        status: MatchStatus.SCORED,
        ...(since ? { createdAt: { gte: since } } : {})
      },
      include: {
        participants: true
      }
    });

    const scores = new Map<string, LeaderboardEntry>();

    for (const match of matches) {
      const winnerId = match.winnerUserId;
      if (!winnerId) {
        continue;
      }
      const entry = scores.get(winnerId) ?? { userId: winnerId, score: 0, matches: 0 };
      entry.score += 100;
      entry.matches += 1;
      scores.set(winnerId, entry);

      for (const participant of match.participants) {
        if (participant.userId === winnerId) {
          continue;
        }
        const participantEntry = scores.get(participant.userId) ?? {
          userId: participant.userId,
          score: 0,
          matches: 0
        };
        participantEntry.score += 30;
        participantEntry.matches += 1;
        scores.set(participant.userId, participantEntry);
      }
    }

    const entries = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return {
      scope,
      period,
      entries,
      source: 'computed'
    };
  }

  private resolvePeriodStart(period: string) {
    const now = new Date();
    if (period === 'DAILY') {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    if (period === 'WEEKLY') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (period === 'MONTHLY') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return null;
  }
}
