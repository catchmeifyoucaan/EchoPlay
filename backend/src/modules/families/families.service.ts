import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Mode, Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { CreateKidDto } from './dto/create-kid.dto';

@Injectable()
export class FamiliesService {
  private readonly inviteBaseUrl: string;

  constructor(private readonly prisma: PrismaService, configService: ConfigService) {
    this.inviteBaseUrl = configService.get<string>('FAMILY_INVITE_BASE_URL') ?? 'https://app.echoplay.com/join';
  }

  async createFamily(ownerId: string, dto: CreateFamilyDto) {
    const family = await this.prisma.family.create({
      data: {
        name: dto.name,
        ownerId,
        members: {
          create: [{ userId: ownerId, role: 'PARENT' }]
        }
      },
      include: {
        members: {
          include: { user: true }
        },
        invites: true
      }
    });

    return family;
  }

  async createInviteLink(requesterId: string, familyId: string) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== requesterId) {
      const membership = await this.prisma.familyMember.findFirst({
        where: { familyId, userId: requesterId, role: 'PARENT' }
      });
      if (!membership) {
        throw new UnauthorizedException('Only family owners or parents can create invites');
      }
    }

    const code = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.familyInvite.create({
      data: {
        familyId: family.id,
        code,
        expiresAt
      }
    });

    return {
      inviteCode: invite.code,
      url: `${this.inviteBaseUrl}/${invite.code}`,
      expiresAt: invite.expiresAt
    };
  }

  async createKidAccount(parentId: string, dto: CreateKidDto) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId },
      include: { profiles: true }
    });

    if (!parent) {
      throw new UnauthorizedException('Parent account not found');
    }

    let familyId = dto.familyId;
    if (familyId) {
      const membership = await this.prisma.familyMember.findFirst({
        where: {
          familyId,
          userId: parentId,
          role: 'PARENT'
        }
      });
      if (!membership) {
        throw new UnauthorizedException('Parent must be part of the family to add kids');
      }
    } else {
      const existingFamily = await this.prisma.family.findFirst({ where: { ownerId: parentId } });
      if (existingFamily) {
        familyId = existingFamily.id;
      } else {
        const newFamily = await this.createFamily(parentId, {
          name: `${parent.displayName}'s Family`
        });
        familyId = newFamily.id;
      }
    }

    const kid = await this.prisma.user.create({
      data: {
        displayName: dto.displayName,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        authProvider: 'guardian-managed',
        parentId,
        role: Role.USER,
        profiles: {
          create: [
            {
              mode: Mode.FAMILY,
              interests: [],
              locale: parent.profiles[0]?.locale ?? 'en'
            }
          ]
        }
      },
      include: { profiles: true }
    });

    await this.prisma.familyMember.create({
      data: {
        familyId: familyId!,
        userId: kid.id,
        role: 'CHILD'
      }
    });

    return kid;
  }
}
