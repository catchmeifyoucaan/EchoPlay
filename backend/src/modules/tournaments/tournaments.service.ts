import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTournaments() {
    return this.prisma.tournament.findMany({
      orderBy: { startsAt: 'asc' }
    });
  }

  async createTournament(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        name: dto.name,
        description: dto.description,
        startsAt: new Date(dto.startAt),
        endsAt: new Date(dto.endAt),
        bracket: dto.bracket ?? null
      }
    });
  }

  async getTournament(id: string) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    return tournament;
  }
}
