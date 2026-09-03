import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { GlobalRole } from '@prisma/client';
import { logCardActivity } from '../lib/activity';

export const addAttachment = async (req: Request, res: Response): Promise<void> => {
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

    const { title, url } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    if (!url || typeof url !== 'string' || !/^https?:\/\/.+/i.test(url.trim())) {
      res.status(400).json({ message: 'URL must start with http:// or https://' });
      return;
    }

    const attachment = await prisma.cardAttachment.create({
      data: {
        card_id: cardId,
        title: title.trim(),
        url: url.trim(),
      },
    });

    await logCardActivity(cardId, userId, 'ATTACHMENT_ADDED', `Added attachment "${title.trim()}"`);

    res.status(201).json({ message: 'Attachment added successfully', attachment });
  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const attachmentId = parseInt(req.params.id, 10);

    if (isNaN(attachmentId)) {
      res.status(400).json({ message: 'Invalid attachment ID' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const attachment = await prisma.cardAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        card: {
          include: {
            board: {
              include: { board_members: true },
            },
          },
        },
      },
    });

    if (!attachment) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    const isMember = attachment.card.board.board_members.some((m) => m.user_id === userId);
    if (!isMember && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: You are not a member of this board' });
      return;
    }

    await prisma.cardAttachment.delete({ where: { id: attachmentId } });

    await logCardActivity(
      attachment.card_id,
      userId,
      'ATTACHMENT_REMOVED',
      `Removed attachment "${attachment.title}"`
    );

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
