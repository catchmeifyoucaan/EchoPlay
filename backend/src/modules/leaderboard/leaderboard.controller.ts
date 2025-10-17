import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard(
    @CurrentUser() _user: AuthUser,
    @Query('scope') scope = 'GLOBAL',
    @Query('period') period = 'WEEKLY'
  ) {
    return this.leaderboardService.getLeaderboard(scope, period);
  }
}
