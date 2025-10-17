import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Get(':id/reactions')
  getReactions(@CurrentUser() _user: AuthUser, @Param('id') id: string) {
    return this.reactionsService.listReactions(id);
  }

  @Get(':id/votes')
  getVotes(@CurrentUser() _user: AuthUser, @Param('id') id: string) {
    return this.reactionsService.listVotes(id);
  }
}
