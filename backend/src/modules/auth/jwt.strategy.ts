import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './types/auth-user.interface';
import { AuthJwtPayload } from './types/auth-jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')
    });
  }

  async validate(payload: AuthJwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profiles: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }

    return {
      id: user.id,
      role: user.role,
      email: user.email ?? undefined,
      displayName: user.displayName,
      parentId: user.parentId ?? undefined,
      profiles: user.profiles
    };
  }
}
