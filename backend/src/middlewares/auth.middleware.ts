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
      select: { id: true, email: true, global_role: true },
    });

    if (!user || user.email !== decoded.email) {
      res.status(401).json({ message: 'Unauthorized: User no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    return;
  }
};
