import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listReactions(matchId: string) {
    const grouped = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { matchId },
      _count: { _all: true }
    });

    const counts = grouped.reduce<Record<string, number>>((acc, item) => {
      acc[item.type.toLowerCase()] = item._count._all;
      return acc;
    }, {});

    return {
      matchId,
      counts
    };
  }

  async listVotes(matchId: string) {
    const grouped = await this.prisma.vote.groupBy({
      by: ['forUserId'],
      where: { matchId },
      _count: { _all: true }
    });

    const totals = grouped.reduce<Record<string, number>>((acc, item) => {
      acc[item.forUserId] = item._count._all;
      return acc;
    }, {});

    return {
      matchId,
      totals
    };
  }
}
