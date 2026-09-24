import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types/express';

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.is_super_admin) {
    res.status(403).json({ message: 'Forbidden: Super Admin role required' });
    return;
  }
  next();
};

export const requireAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
};

export type AuthenticatedUser = JWTPayload;
