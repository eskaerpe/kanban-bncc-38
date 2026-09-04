import { apiFetch } from './client';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  global_role: string;
}

export interface Division {
  id: number;
  name: string;
}

export interface BoardMember {
  id: number;
  board_id: number;
  user_id: number;
  division_id: number | null;
  role: 'BOARD_ADMIN' | 'KOOR_DIVISION' | 'STAFF';
  user: UserSummary;
  division: Division | null;
}

export interface Board {
  id: number;
  title: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  created_by: number;
  created_at: string;
  creator?: UserSummary;
  board_members: BoardMember[];
  _count?: { board_members: number; cards: number };
}

export const getBoards = async (status?: string): Promise<{ boards: Board[] }> => {
  const query = status ? `?status=${status}` : '';
  return apiFetch(`/boards${query}`);
};

export const getBoardById = async (id: number): Promise<{ board: Board; divisions: Division[] }> => {
  return apiFetch(`/boards/${id}`);
};

export const createBoard = async (data: { title: string; description?: string }): Promise<{ message: string; board: Board }> => {
  return apiFetch('/boards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateBoard = async (id: number, data: Partial<Board>): Promise<{ message: string; board: Board }> => {
  return apiFetch(`/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteBoard = async (id: number): Promise<{ message: string }> => {
  return apiFetch(`/boards/${id}`, {
    method: 'DELETE',
  });
};

export const addBoardMember = async (
  boardId: number,
  data: { user_id: number; division_id?: number; role: 'BOARD_ADMIN' | 'KOOR_DIVISION' | 'STAFF' }
): Promise<{ message: string; member: BoardMember }> => {
  return apiFetch(`/boards/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const removeBoardMember = async (boardId: number, userId: number): Promise<{ message: string }> => {
  return apiFetch(`/boards/${boardId}/members/${userId}`, {
    method: 'DELETE',
  });
};

export const getDivisions = async (): Promise<{ divisions: Division[] }> => {
  return apiFetch('/lookup/divisions');
};

export const getUsers = async (): Promise<{ users: UserSummary[] }> => {
  return apiFetch('/lookup/users');
};
