import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateMatchDto } from './dto/create-match.dto';
import { StartMatchDto } from './dto/start-match.dto';
import { MatchesService } from './matches.service';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  createMatch(@CurrentUser() user: AuthUser, @Body() dto: CreateMatchDto) {
    return this.matchesService.createMatch(user.id, dto);
  }

  @Post(':id/join')
  joinMatch(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.matchesService.joinMatch(id, user.id);
  }

  @Post(':id/start')
  startMatch(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: StartMatchDto) {
    return this.matchesService.startMatch(id, user.id, dto);
  }

  @Post(':id/score')
  scoreMatch(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.matchesService.scoreMatch(id, user.id);
  }

  @Get(':id')
  getMatch(@Param('id') id: string) {
    return this.matchesService.getMatch(id);
  }
}
