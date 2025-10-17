import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Mode, Prisma, Role } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';

import { PrismaService } from '../prisma/prisma.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { FirebaseAdminService } from './firebase-admin.service';
import { AuthJwtPayload } from './types/auth-jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  async verify(dto: VerifyAuthDto) {
    const decoded = await this.verifyFirebaseToken(dto.firebaseIdToken);
    const user = await this.syncUserRecord(decoded);

    const payload: AuthJwtPayload = {
      sub: user.id,
      role: user.role,
      parentId: user.parentId
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      token: accessToken,
      user
    };
  }

  private async verifyFirebaseToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.firebaseAdmin.getAuthClient().verifyIdToken(idToken, true);
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }

  private async syncUserRecord(decoded: DecodedIdToken) {
    const authProvider = decoded.firebase?.sign_in_provider ?? 'custom';
    const displayName = decoded.name ?? decoded.email ?? 'Echo Player';

    const upsertArgs: Prisma.UserUpsertArgs = {
      where: { id: decoded.uid },
      update: {
        email: decoded.email,
        displayName,
        avatarUrl: decoded.picture ?? undefined,
        authProvider,
        phone: decoded.phone_number ?? undefined
      },
      create: {
        id: decoded.uid,
        email: decoded.email,
        displayName,
        avatarUrl: decoded.picture ?? undefined,
        authProvider,
        phone: decoded.phone_number ?? undefined,
        role: Role.USER,
        profiles: {
          create: [
            {
              mode: Mode.SOLO,
              interests: [],
              bio: null,
              locale: decoded.locale ?? 'en'
            }
          ]
        }
      },
      include: {
        profiles: true
      }
    };

    const user = await this.prisma.user.upsert(upsertArgs);

    if (!user.profiles.length) {
      await this.prisma.profile.create({
        data: {
          userId: user.id,
          mode: Mode.SOLO,
          interests: [],
          locale: decoded.locale ?? 'en'
        }
      });
    }

    return await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        profiles: true
      }
    });
  }
}
