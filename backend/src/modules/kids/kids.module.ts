import { Module } from '@nestjs/common';

import { FamiliesModule } from '../families/families.module';
import { KidsController } from './kids.controller';

@Module({
  imports: [FamiliesModule],
  controllers: [KidsController]
})
export class KidsModule {}
