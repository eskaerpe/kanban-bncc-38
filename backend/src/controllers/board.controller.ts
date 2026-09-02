import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { BoardRole, BoardStatus, GlobalRole } from '@prisma/client';

export const createBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const board = await prisma.board.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        created_by: userId,
        board_members: {
          create: {
            user_id: userId,
            role: BoardRole.BOARD_ADMIN,
          },
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        board_members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            division: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Board created successfully',
      board,
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBoards = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { status } = req.query;
    const filterStatus = status === 'ARCHIVED' ? BoardStatus.ARCHIVED : status === 'ACTIVE' ? BoardStatus.ACTIVE : undefined;

    let whereClause: any = {};
    if (filterStatus) {
      whereClause.status = filterStatus;
    }

    if (globalRole !== GlobalRole.GLOBAL_ADMIN) {
      whereClause.board_members = {
        some: {
          user_id: userId,
        },
      };
    }

    const boards = await prisma.board.findMany({
      where: whereClause,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        board_members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            division: true,
          },
        },
        _count: {
          select: { board_members: true, cards: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ boards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBoardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const boardId = parseInt(req.params.id, 10);

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
      include: {
        creator: { select: { id: true, name: true, email: true } },
        board_members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            division: true,
          },
        },
      },
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

    const divisions = await prisma.division.findMany({ orderBy: { name: 'asc' } });

    res.json({ board, divisions });
  } catch (error) {
    console.error('Get board by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const boardId = parseInt(req.params.id, 10);

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

    const member = board.board_members.find((m) => m.user_id === userId);
    const isBoardAdmin = member?.role === BoardRole.BOARD_ADMIN;

    if (!isBoardAdmin && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: Only Board Admin or Global Admin can update board settings' });
      return;
    }

    const { title, description, status } = req.body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (status !== undefined && ['ACTIVE', 'ARCHIVED'].includes(status)) {
      dataToUpdate.status = status as BoardStatus;
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: dataToUpdate,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        board_members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            division: true,
          },
        },
      },
    });

    res.json({
      message: 'Board updated successfully',
      board: updatedBoard,
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const boardId = parseInt(req.params.id, 10);

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

    const member = board.board_members.find((m) => m.user_id === userId);
    const isBoardAdmin = member?.role === BoardRole.BOARD_ADMIN;

    if (!isBoardAdmin && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: Only Board Admin or Global Admin can delete board' });
      return;
    }

    const mode = req.query.mode;
    if (mode === 'hard') {
      await prisma.board.delete({ where: { id: boardId } });
      res.json({ message: 'Board permanently deleted' });
    } else {
      const archivedBoard = await prisma.board.update({
        where: { id: boardId },
        data: { status: BoardStatus.ARCHIVED },
      });
      res.json({ message: 'Board archived successfully', board: archivedBoard });
    }
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addBoardMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const boardId = parseInt(req.params.id, 10);

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

    const currentMember = board.board_members.find((m) => m.user_id === userId);
    const isBoardAdmin = currentMember?.role === BoardRole.BOARD_ADMIN;

    if (!isBoardAdmin && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: Only Board Admin or Global Admin can manage members' });
      return;
    }

    const { user_id, role, division_id } = req.body;

    if (!user_id || !role || !['BOARD_ADMIN', 'KOOR_DIVISION', 'STAFF'].includes(role)) {
      res.status(400).json({ message: 'User ID and valid role (BOARD_ADMIN, KOOR_DIVISION, STAFF) are required' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: Number(user_id) } });
    if (!targetUser) {
      res.status(404).json({ message: 'Target user not found' });
      return;
    }

    const existingMember = await prisma.boardMember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: Number(user_id),
        },
      },
    });

    if (existingMember) {
      const updatedMember = await prisma.boardMember.update({
        where: { id: existingMember.id },
        data: {
          role: role as BoardRole,
          division_id: division_id ? Number(division_id) : null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          division: true,
        },
      });
      res.json({ message: 'Member role/division updated', member: updatedMember });
      return;
    }

    const newMember = await prisma.boardMember.create({
      data: {
        board_id: boardId,
        user_id: Number(user_id),
        role: role as BoardRole,
        division_id: division_id ? Number(division_id) : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        division: true,
      },
    });

    res.status(201).json({ message: 'Member added successfully', member: newMember });
  } catch (error) {
    console.error('Add board member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeBoardMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const globalRole = req.user?.global_role;
    const boardId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);

    if (isNaN(boardId) || isNaN(targetUserId)) {
      res.status(400).json({ message: 'Invalid parameters' });
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

    const currentMember = board.board_members.find((m) => m.user_id === userId);
    const isBoardAdmin = currentMember?.role === BoardRole.BOARD_ADMIN;

    if (!isBoardAdmin && globalRole !== GlobalRole.GLOBAL_ADMIN) {
      res.status(403).json({ message: 'Forbidden: Only Board Admin or Global Admin can remove members' });
      return;
    }

    const targetMember = board.board_members.find((m) => m.user_id === targetUserId);
    if (!targetMember) {
      res.status(404).json({ message: 'Member not found in this board' });
      return;
    }

    await prisma.boardMember.delete({
      where: { id: targetMember.id },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove board member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
