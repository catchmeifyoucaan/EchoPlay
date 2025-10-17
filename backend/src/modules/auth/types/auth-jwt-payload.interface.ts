import { Role } from '@prisma/client';

export interface AuthJwtPayload {
  sub: string;
  role: Role;
  parentId?: string | null;
  iat?: number;
  exp?: number;
}
