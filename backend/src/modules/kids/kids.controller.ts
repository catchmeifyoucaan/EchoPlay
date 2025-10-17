import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateKidDto } from '../families/dto/create-kid.dto';
import { FamiliesService } from '../families/families.service';

@Controller('kids')
@UseGuards(JwtAuthGuard)
export class KidsController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  createKid(@CurrentUser() user: AuthUser, @Body() dto: CreateKidDto) {
    return this.familiesService.createKidAccount(user.id, dto);
  }
}
