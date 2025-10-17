import { Profile, Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  role: Role;
  email?: string;
  displayName: string;
  parentId?: string;
  profiles: Profile[];
}
