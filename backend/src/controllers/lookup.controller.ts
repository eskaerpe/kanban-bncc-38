import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDivisions = async (req: Request, res: Response): Promise<void> => {
  try {
    const divisions = await prisma.division.findMany({ orderBy: { name: 'asc' } });
    res.json({ divisions });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, global_role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
