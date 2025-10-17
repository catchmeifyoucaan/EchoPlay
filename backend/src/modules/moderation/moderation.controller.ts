import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { ModerateTextDto } from './dto/moderate-text.dto';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

@Controller('moderate')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('text')
  moderateText(@CurrentUser() _user: AuthUser, @Body() dto: ModerateTextDto) {
    return this.moderationService.moderateText(dto);
  }
}
