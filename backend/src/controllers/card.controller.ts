import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { BoardRole, CardPriority, CardStatus, GlobalRole } from '@prisma/client';
import { logCardActivity } from '../lib/activity';

export const createCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const boardId = parseInt(req.params.boardId, 10);

    if (isNaN(boardId)) {
      res.status(400).json({ message: 'Invalid board ID' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { board_members: true },
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    const isMember = board.board_members.some((m) => m.user_id === userId);
    if (!isMember && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: You are not a member of this board' });
      return;
    }

    const { division_id, title, description, priority, due_date } = req.body;

    if (!division_id || !title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Division ID and Title are required' });
      return;
    }

    const division = await prisma.division.findUnique({ where: { id: Number(division_id) } });
    if (!division) {
      res.status(404).json({ message: 'Division not found' });
      return;
    }

    const maxPosCard = await prisma.card.findFirst({
      where: { board_id: boardId, status: CardStatus.TO_DO },
      orderBy: { position: 'desc' },
    });
    const position = maxPosCard ? maxPosCard.position + 1 : 0;

    const card = await prisma.card.create({
      data: {
        board_id: boardId,
        division_id: Number(division_id),
        title: title.trim(),
        description: description ? description.trim() : null,
        status: CardStatus.TO_DO,
        priority: priority && ['LOW', 'MID', 'HIGH'].includes(priority) ? (priority as CardPriority) : CardPriority.MID,
        due_date: due_date ? new Date(due_date) : null,
        position,
      },
      include: {
        division: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        attachments: true,
        revisions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    await logCardActivity(card.id, userId, 'CARD_CREATED', `Created card "${card.title}"`);

    res.status(201).json({ message: 'Card created successfully', card });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBoardCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const boardId = parseInt(req.params.boardId, 10);

    if (isNaN(boardId)) {
      res.status(400).json({ message: 'Invalid board ID' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { board_members: true },
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    const isMember = board.board_members.some((m) => m.user_id === userId);
    if (!isMember && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: You are not a member of this board' });
      return;
    }

    const cards = await prisma.card.findMany({
      where: { board_id: boardId },
      include: {
        division: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        attachments: true,
        revisions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });

    res.json({ cards });
  } catch (error) {
    console.error('Get board cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCard = async (req: Request, res: Response): Promise<void> => {
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

    const member = card.board.board_members.find((m) => m.user_id === userId);
    const isMember = !!member;
    if (!isMember && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: You are not a member of this board' });
      return;
    }

    const { title, description, priority, due_date, division_id, status, revision_note } = req.body;

    // Check status change & QC Gatekeeper rules if status is being updated via PUT
    if (status && status !== card.status) {
      const isBoardAdmin = member?.role === BoardRole.BOARD_ADMIN;
      const isKoorOfCardDivision = member?.role === BoardRole.KOOR_DIVISION && member?.division_id === card.division_id;
      const isAuthorizedQC = isBoardAdmin || isKoorOfCardDivision || globalRole === GlobalRole.GLOBAL_ADMIN;

      if (card.status === CardStatus.ON_QC && (status === CardStatus.DONE || status === CardStatus.REVISION)) {
        if (!isAuthorizedQC) {
          res.status(403).json({ message: 'Hanya Koor Divisi atau Admin yang berhak menyetujui/merevisi QC' });
          return;
        }
      }

      if (status === CardStatus.REVISION) {
        if (!revision_note || typeof revision_note !== 'string' || revision_note.trim().length < 5) {
          res.status(400).json({ message: 'Catatan revisi wajib diisi (minimal 5 karakter)' });
          return;
        }

        await prisma.cardRevision.create({
          data: {
            card_id: cardId,
            user_id: userId,
            note: revision_note.trim(),
          },
        });

        await logCardActivity(cardId, userId, 'REVISION_ADDED', `Requested revision: "${revision_note.trim()}"`);
      }

      await logCardActivity(cardId, userId, 'STATUS_CHANGED', `Moved card status from ${card.status} to ${status}`);
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (priority !== undefined && ['LOW', 'MID', 'HIGH'].includes(priority)) {
      dataToUpdate.priority = priority as CardPriority;
    }
    if (due_date !== undefined) {
      dataToUpdate.due_date = due_date ? new Date(due_date) : null;
    }
    if (division_id !== undefined) {
      dataToUpdate.division_id = Number(division_id);
    }
    if (status !== undefined && ['TO_DO', 'ON_PROGRESS', 'ON_QC', 'REVISION', 'DONE'].includes(status)) {
      dataToUpdate.status = status as CardStatus;
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: dataToUpdate,
      include: {
        division: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        attachments: true,
        revisions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    res.json({ message: 'Card updated successfully', card: updatedCard });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const moveCard = async (req: Request, res: Response): Promise<void> => {
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

    const member = card.board.board_members.find((m) => m.user_id === userId);
    const isMember = !!member;
    if (!isMember && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: You are not a member of this board' });
      return;
    }

    const { status, position, revision_note } = req.body;

    if (!status || !['TO_DO', 'ON_PROGRESS', 'ON_QC', 'REVISION', 'DONE'].includes(status)) {
      res.status(400).json({ message: 'Valid status is required' });
      return;
    }

    const targetStatus = status as CardStatus;
    const targetPosition = typeof position === 'number' && position >= 0 ? position : 0;

    // Check QC Gatekeeper rules when moving card from ON_QC to DONE or REVISION
    if (card.status === CardStatus.ON_QC && (targetStatus === CardStatus.DONE || targetStatus === CardStatus.REVISION)) {
      const isBoardAdmin = member?.role === BoardRole.BOARD_ADMIN;
      const isKoorOfCardDivision = member?.role === BoardRole.KOOR_DIVISION && member?.division_id === card.division_id;
      const isAuthorizedQC = isBoardAdmin || isKoorOfCardDivision || globalRole === GlobalRole.GLOBAL_ADMIN;

      if (!isAuthorizedQC) {
        res.status(403).json({ message: 'Hanya Koor Divisi atau Admin yang berhak menyetujui/merevisi QC' });
        return;
      }
    }

    // Mandatory revision note when rejecting to REVISION
    if (targetStatus === CardStatus.REVISION) {
      if (!revision_note || typeof revision_note !== 'string' || revision_note.trim().length < 5) {
        res.status(400).json({ message: 'Catatan revisi wajib diisi (minimal 5 karakter)' });
        return;
      }

      await prisma.cardRevision.create({
        data: {
          card_id: cardId,
          user_id: userId,
          note: revision_note.trim(),
        },
      });

      await logCardActivity(cardId, userId, 'REVISION_ADDED', `Requested revision: "${revision_note.trim()}"`);
    }

    if (card.status !== targetStatus) {
      await logCardActivity(cardId, userId, 'STATUS_CHANGED', `Moved card status from ${card.status} to ${targetStatus}`);
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        status: targetStatus,
        position: targetPosition,
      },
      include: {
        division: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        attachments: true,
        revisions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    res.json({ message: 'Card position updated successfully', card: updatedCard });
  } catch (error) {
    console.error('Move card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCard = async (req: Request, res: Response): Promise<void> => {
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

    const member = card.board.board_members.find((m) => m.user_id === userId);
    const isBoardAdmin = member?.role === BoardRole.BOARD_ADMIN;
    const isKoorDivisionOfCard = member?.role === BoardRole.KOOR_DIVISION && member?.division_id === card.division_id;

    if (!isBoardAdmin && !isKoorDivisionOfCard && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: Only Board Admin, Division Koor, or Global Admin can delete this card' });
      return;
    }

    await prisma.card.delete({ where: { id: cardId } });

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addAssignee = async (req: Request, res: Response): Promise<void> => {
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

    const { user_id } = req.body;
    if (!user_id) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const targetUserId = Number(user_id);
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404).json({ message: 'Target user not found' });
      return;
    }

    const isTargetMember = card.board.board_members.some((m) => m.user_id === targetUserId);
    if (!isTargetMember) {
      res.status(400).json({ message: 'Target user is not a member of this board' });
      return;
    }

    const existingAssignee = await prisma.cardAssignee.findUnique({
      where: {
        card_id_user_id: {
          card_id: cardId,
          user_id: targetUserId,
        },
      },
    });

    if (!existingAssignee) {
      await prisma.cardAssignee.create({
        data: {
          card_id: cardId,
          user_id: targetUserId,
        },
      });

      await logCardActivity(
        cardId,
        userId,
        'ASSIGNEE_ADDED',
        `Assigned ${targetUser?.name || 'user'} to this card`
      );
    }

    const updatedCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        division: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        attachments: true,
        revisions: true,
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    res.json({ message: 'Assignee added successfully', card: updatedCard });
  } catch (error) {
    console.error('Add assignee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeAssignee = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const cardId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);

    if (isNaN(cardId) || isNaN(targetUserId)) {
      res.status(400).json({ message: 'Invalid parameters' });
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

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

    await prisma.cardAssignee.deleteMany({
      where: {
        card_id: cardId,
        user_id: targetUserId,
      },
    });

    await logCardActivity(
      cardId,
      userId,
      'ASSIGNEE_REMOVED',
      `Removed ${targetUser?.name || 'user'} from this card`
    );

    const updatedCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        division: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        attachments: true,
        revisions: true,
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    res.json({ message: 'Assignee removed successfully', card: updatedCard });
  } catch (error) {
    console.error('Remove assignee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
