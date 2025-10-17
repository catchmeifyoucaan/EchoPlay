import { Module } from '@nestjs/common';

import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { TranscribeController } from './transcribe.controller';

@Module({
  controllers: [CoachController, TranscribeController],
  providers: [CoachService],
  exports: [CoachService]
})
export class CoachModule {}
