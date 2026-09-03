import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { GlobalRole } from '@prisma/client';

export const getCardActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const cardId = parseInt(req.params.id, 10);

    if (isNaN(cardId)) {
      res.status(400).json({ message: 'Invalid card ID' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: { board_members: true },
        },
      },
    });

    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    const isMember = card.board.board_members.some((m) => m.user_id === userId);
    if (!isMember && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: You are not a member of this board' });
      return;
    }

    const activities = await prisma.cardActivity.findMany({
      where: { card_id: cardId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ activities });
  } catch (error) {
    console.error('Get card activities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
