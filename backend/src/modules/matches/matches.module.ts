import { Module } from '@nestjs/common';

import { CoachModule } from '../coach/coach.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { LivekitService } from './livekit.service';

@Module({
  imports: [PrismaModule, CoachModule],
  controllers: [MatchesController],
  providers: [MatchesService, LivekitService],
  exports: [MatchesService]
})
export class MatchesModule {}
