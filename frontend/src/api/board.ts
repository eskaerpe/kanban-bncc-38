import { apiFetch } from './client';

export interface BoardMember {
  id: number;
  board_id: number;
  user_id: number;
  division_id: number | null;
  role: 'BOARD_ADMIN' | 'KOOR_DIVISION' | 'STAFF';
  user: {
    id: number;
    name: string;
    email: string;
  };
  division: {
    id: number;
    name: string;
  } | null;
}

export interface Board {
  id: number;
  title: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  created_by: number;
  created_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  board_members: BoardMember[];
  _count?: {
    board_members: number;
    cards: number;
  };
}

export interface Division {
  id: number;
  name: string;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  global_role: string;
}

export const getBoards = async (status?: string): Promise<{ boards: Board[] }> => {
  const query = status ? `?status=${status}` : '';
  return apiFetch<{ boards: Board[] }>(`/boards${query}`);
};

export const getBoardById = async (id: number): Promise<{ board: Board; divisions: Division[] }> => {
  return apiFetch<{ board: Board; divisions: Division[] }>(`/boards/${id}`);
};

export const createBoard = async (data: { title: string; description?: string }): Promise<{ message: string; board: Board }> => {
  return apiFetch<{ message: string; board: Board }>('/boards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateBoard = async (id: number, data: Partial<Board>): Promise<{ message: string; board: Board }> => {
  return apiFetch<{ message: string; board: Board }>(`/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteBoard = async (id: number, mode?: 'soft' | 'hard'): Promise<{ message: string }> => {
  const query = mode === 'hard' ? '?mode=hard' : '';
  return apiFetch<{ message: string }>(`/boards/${id}${query}`, {
    method: 'DELETE',
  });
};

export const addBoardMember = async (
  boardId: number,
  data: { user_id: number; role: string; division_id?: number | null }
): Promise<{ message: string; member: BoardMember }> => {
  return apiFetch<{ message: string; member: BoardMember }>(`/boards/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const removeBoardMember = async (boardId: number, userId: number): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>(`/boards/${boardId}/members/${userId}`, {
    method: 'DELETE',
  });
};

export const getDivisions = async (): Promise<{ divisions: Division[] }> => {
  return apiFetch<{ divisions: Division[] }>('/divisions');
};

export const getUsers = async (): Promise<{ users: UserSummary[] }> => {
  return apiFetch<{ users: UserSummary[] }>('/users');
};
