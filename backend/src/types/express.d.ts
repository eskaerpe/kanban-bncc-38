import { GlobalRole } from '@prisma/client';

export interface JWTPayload {
  id: number;
  email: string;
  global_role: GlobalRole;
  token_version?: number;
  roles?: string[];
  divisions?: string[];
  is_super_admin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
