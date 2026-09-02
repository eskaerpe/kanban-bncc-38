import { GlobalRole } from '@prisma/client';

export interface JWTPayload {
  id: number;
  email: string;
  global_role: GlobalRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
