import { Module } from '@nestjs/common';

import { CoachModule } from '../coach/coach.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { LivekitService } from './livekit.service';
import { MatchesGateway } from './matches.gateway';

@Module({
  imports: [PrismaModule, CoachModule, AuthModule],
  controllers: [MatchesController],
  providers: [MatchesService, LivekitService, MatchesGateway],
  exports: [MatchesService]
})
export class MatchesModule {}
