import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { Role } from '@prisma/client';

@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  list(@CurrentUser() _user: AuthUser) {
    return this.tournamentsService.listTournaments();
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTournamentDto) {
    if (user.role !== Role.ADMIN && user.role !== Role.MOD) {
      throw new ForbiddenException('Only admins can create tournaments');
    }
    return this.tournamentsService.createTournament(dto);
  }

  @Get(':id')
  get(@CurrentUser() _user: AuthUser, @Param('id') id: string) {
    return this.tournamentsService.getTournament(id);
  }
}
