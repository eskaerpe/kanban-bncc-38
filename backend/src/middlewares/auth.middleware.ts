import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/express';
import { JWT_SECRET } from '../config/jwt';
import { prisma } from '../lib/prisma';

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        global_role: true,
        token_version: true,
        is_active: true,
        user_roles: {
          include: {
            role: true,
          },
        },
        user_divisions: {
          include: {
            division: true,
          },
        },
      },
    });

    if (!user || user.email !== decoded.email) {
      res.status(401).json({ message: 'Unauthorized: User no longer exists' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ message: 'Akun dinonaktifkan. Silakan hubungi Super Admin.' });
      return;
    }

    // Token revocation check: if token version does not match DB, invalidate session immediately
    if (decoded.token_version !== undefined && decoded.token_version !== user.token_version) {
      res.status(401).json({ message: 'Sesi telah kedaluwarsa atau izin telah diubah. Silakan login kembali.' });
      return;
    }

    const roles = user.user_roles.map((ur) => ur.role.code);
    const divisions = user.user_divisions.map((ud) => ud.division.code || ud.division.name);
    const isSuperAdmin = user.global_role === 'GLOBAL_ADMIN' || roles.includes('SUPER_ADMIN');

    req.user = {
      id: user.id,
      email: user.email,
      global_role: user.global_role,
      token_version: user.token_version,
      roles,
      divisions,
      is_super_admin: isSuperAdmin,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    return;
  }
};

/**
 * Middleware to require Super Admin privileges
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.is_super_admin) {
    res.status(403).json({ message: 'Forbidden: Hanya Super Admin yang diizinkan mengakses resource ini' });
    return;
  }
  next();
};
