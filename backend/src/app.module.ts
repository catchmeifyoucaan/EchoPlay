import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { CoachModule } from './modules/coach/coach.module';
import { FamiliesModule } from './modules/families/families.module';
import { HealthModule } from './modules/health/health.module';
import { KidsModule } from './modules/kids/kids.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    FamiliesModule,
    KidsModule,
    MatchesModule,
    CoachModule,
    ModerationModule,
    LeaderboardModule,
    TournamentsModule,
    ReactionsModule,
    RealtimeModule
  ]
})
export class AppModule {}
