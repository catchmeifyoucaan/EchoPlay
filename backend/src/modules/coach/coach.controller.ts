import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CoachService } from './coach.service';
import { CoachFeedbackDto } from './dto/coach-feedback.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

@Controller('coach')
@UseGuards(JwtAuthGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post('feedback')
  createFeedback(@CurrentUser() _user: AuthUser, @Body() dto: CoachFeedbackDto) {
    return this.coachService.getFeedback(dto);
  }
}
