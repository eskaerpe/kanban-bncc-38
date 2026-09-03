import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    name: z.string().min(1, { message: 'Name is required' }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

export const createBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Board name is required' }),
    description: z.string().optional(),
  }),
});

export const updateBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Board name cannot be empty' }).optional(),
    description: z.string().nullable().optional(),
  }),
});

export const addBoardMemberSchema = z.object({
  body: z.object({
    user_id: z.number({ message: 'User ID is required' }),
    role: z.enum(['BOARD_ADMIN', 'KOOR_DIVISION', 'STAFF'], {
      message: 'Invalid board role',
    }),
    division_id: z.number().nullable().optional(),
  }),
});

export const createCardSchema = z.object({
  body: z.object({
    division_id: z.number({ message: 'Division ID is required' }),
    title: z.string().min(1, { message: 'Title is required' }),
    description: z.string().nullable().optional(),
    priority: z.enum(['LOW', 'MID', 'HIGH']).optional(),
    due_date: z.string().nullable().optional(),
  }),
});

export const updateCardSchema = z.object({
  body: z.object({
    title: z.string().min(1, { message: 'Title cannot be empty' }).optional(),
    description: z.string().nullable().optional(),
    priority: z.enum(['LOW', 'MID', 'HIGH']).optional(),
    due_date: z.string().nullable().optional(),
    division_id: z.number().optional(),
  }),
});

export const moveCardSchema = z.object({
  body: z.object({
    status: z.enum(['TO_DO', 'ON_PROGRESS', 'ON_QC', 'REVISION', 'DONE'], {
      message: 'Valid status is required',
    }),
    position: z.number().int().nonnegative().optional(),
    revision_note: z.string().optional(),
  }),
});

export const addAssigneeSchema = z.object({
  body: z.object({
    user_id: z.number({ message: 'User ID is required' }),
  }),
});
