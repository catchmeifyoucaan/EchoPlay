import { Injectable } from '@nestjs/common';
import { Mode, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profiles: true,
        families: {
          include: {
            family: true
          }
        },
        subscriptions: true
      }
    });
  }

  async updateCurrentUser(userId: string, dto: UpdateMeDto) {
    const profileData: Prisma.ProfileUpdateManyMutationInput = {};

    if (dto.interests) {
      profileData.interests = dto.interests;
    }
    if (dto.bio !== undefined) {
      profileData.bio = dto.bio ?? null;
    }
    if (dto.locale) {
      profileData.locale = dto.locale;
    }

    const userUpdateData: Prisma.UserUpdateInput = {};
    if (dto.displayName) {
      userUpdateData.displayName = dto.displayName;
    }
    if (dto.avatarUrl) {
      userUpdateData.avatarUrl = dto.avatarUrl;
    }

    if (Object.keys(profileData).length) {
      userUpdateData.profiles = {
        updateMany: {
          where: {
            mode: Mode.SOLO
          },
          data: profileData
        }
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      include: {
        profiles: true,
        families: {
          include: { family: true }
        },
        subscriptions: true
      }
    });

    return updated;
  }
}
