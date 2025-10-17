import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CoachService } from './coach.service';
import { TranscribeDto } from './dto/transcribe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

@Controller('transcribe')
@UseGuards(JwtAuthGuard)
export class TranscribeController {
  constructor(private readonly coachService: CoachService) {}

  @Post()
  transcribe(@CurrentUser() _user: AuthUser, @Body() dto: TranscribeDto) {
    return this.coachService.transcribe(dto);
  }
}
