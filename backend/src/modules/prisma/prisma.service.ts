import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

// Stub implementation until Prisma Client can be generated
// This allows the server to start and test non-DB endpoints
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Stub all Prisma model accessors
  user: any;
  profile: any;
  family: any;
  familyMember: any;
  familyInvite: any;
  debateMatch: any;
  matchParticipant: any;
  debateRound: any;
  reaction: any;
  vote: any;
  leaderboardSnapshot: any;
  device: any;
  subscription: any;
  tournament: any;

  constructor() {
    this.logger.warn('⚠️  Using STUB PrismaService - database operations will not work!');
    this.logger.warn('⚠️  To fix: resolve Prisma Client generation and restart server');

    // Create stub model objects
    const createStub = (modelName: string) => ({
      findMany: async () => { this.logger.warn(`STUB: ${modelName}.findMany called`); return []; },
      findUnique: async () => { this.logger.warn(`STUB: ${modelName}.findUnique called`); return null; },
      findFirst: async () => { this.logger.warn(`STUB: ${modelName}.findFirst called`); return null; },
      create: async (data: any) => { this.logger.warn(`STUB: ${modelName}.create called`); return { id: 'stub-id', ...data.data }; },
      update: async (data: any) => { this.logger.warn(`STUB: ${modelName}.update called`); return { id: 'stub-id', ...data.data }; },
      delete: async () => { this.logger.warn(`STUB: ${modelName}.delete called`); return { id: 'stub-id' }; },
      upsert: async (data: any) => { this.logger.warn(`STUB: ${modelName}.upsert called`); return { id: 'stub-id', ...data.create }; },
      count: async () => { this.logger.warn(`STUB: ${modelName}.count called`); return 0; },
    });

    this.user = createStub('User');
    this.profile = createStub('Profile');
    this.family = createStub('Family');
    this.familyMember = createStub('FamilyMember');
    this.familyInvite = createStub('FamilyInvite');
    this.debateMatch = createStub('DebateMatch');
    this.matchParticipant = createStub('MatchParticipant');
    this.debateRound = createStub('DebateRound');
    this.reaction = createStub('Reaction');
    this.vote = createStub('Vote');
    this.leaderboardSnapshot = createStub('LeaderboardSnapshot');
    this.device = createStub('Device');
    this.subscription = createStub('Subscription');
    this.tournament = createStub('Tournament');
  }

  async onModuleInit() {
    this.logger.log('✓ PrismaService initialized (STUB mode)');
  }

  async enableShutdownHooks(app: INestApplication) {
    // Stub - no-op
  }

  async onModuleDestroy() {
    this.logger.log('PrismaService destroyed');
  }
}
