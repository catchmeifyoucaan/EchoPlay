import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  verify(@Body() dto: VerifyAuthDto) {
    return this.authService.verify(dto);
  }
}
