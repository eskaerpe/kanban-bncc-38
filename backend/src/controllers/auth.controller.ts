import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { GlobalRole } from '@prisma/client';
import { JWT_SECRET } from '../config/jwt';

const SALT_ROUNDS = 10;

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  global_role: true,
  token_version: true,
  is_active: true,
  created_at: true,
} as const;

const signUserToken = (user: {
  id: number;
  email: string;
  global_role: GlobalRole;
  token_version: number;
}) => jwt.sign({
  id: user.id,
  email: user.email,
  global_role: user.global_role,
  token_version: user.token_version,
}, JWT_SECRET, { expiresIn: '7d' });

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email is already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        name,
        global_role: GlobalRole.USER,
        user_roles: {
          create: {
            role: { connect: { code: 'STAFF' } },
          },
        },
      },
      select: publicUserSelect,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token: signUserToken(user),
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (!user.is_active) {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }

    res.json({
      message: 'Login successful',
      token: signUserToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        global_role: user.global_role,
        token_version: user.token_version,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: publicUserSelect });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ user });
};
