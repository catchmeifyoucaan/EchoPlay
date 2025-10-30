-- EchoPlay Database Schema (manually converted from Prisma)

-- Create enums
CREATE TYPE "Role" AS ENUM ('USER', 'MOD', 'ADMIN');
CREATE TYPE "Mode" AS ENUM ('SOLO', 'FAMILY', 'COUPLE', 'GLOBAL');
CREATE TYPE "ReactionType" AS ENUM ('HEART', 'THUMBS', 'LAUGH', 'FLAME');
CREATE TYPE "MatchStatus" AS ENUM ('LOBBY', 'LIVE', 'SCORED', 'ENDED');

-- Create tables
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authProvider" TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "phone" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "dob" TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "parentId" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" "Mode" NOT NULL,
    "bio" TEXT,
    "interests" TEXT[],
    "locale" TEXT NOT NULL DEFAULT 'en',
    "civilityElo" INTEGER NOT NULL DEFAULT 1000,
    "debateElo" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "Family" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("familyId") REFERENCES "Family"("id"),
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "FamilyInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("familyId") REFERENCES "Family"("id")
);

CREATE TABLE "DebateMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" "Mode" NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL,
    "roomId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP,
    "endedAt" TIMESTAMP,
    "aiScore" INTEGER,
    "winnerUserId" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" TEXT,
    "joinedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("matchId") REFERENCES "DebateMatch"("id"),
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "DebateRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "speakerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP NOT NULL,
    "endedAt" TIMESTAMP,
    "transcript" JSONB,
    FOREIGN KEY ("matchId") REFERENCES "DebateMatch"("id")
);

CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("matchId") REFERENCES "DebateMatch"("id"),
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "voterId" TEXT,
    "forUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("matchId") REFERENCES "DebateMatch"("id"),
    FOREIGN KEY ("voterId") REFERENCES "User"("id")
);

CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewedAt" TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP NOT NULL,
    "endsAt" TIMESTAMP NOT NULL,
    "bracket" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");
CREATE INDEX "FamilyMember_userId_idx" ON "FamilyMember"("userId");
CREATE INDEX "MatchParticipant_matchId_idx" ON "MatchParticipant"("matchId");
CREATE INDEX "MatchParticipant_userId_idx" ON "MatchParticipant"("userId");
CREATE INDEX "DebateRound_matchId_idx" ON "DebateRound"("matchId");
CREATE INDEX "Reaction_matchId_idx" ON "Reaction"("matchId");
CREATE INDEX "Vote_matchId_idx" ON "Vote"("matchId");
CREATE INDEX "Device_userId_idx" ON "Device"("userId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
