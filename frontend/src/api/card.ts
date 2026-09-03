import { apiFetch } from './client';
import { Division } from './board';

export type CardStatus = 'TO_DO' | 'ON_PROGRESS' | 'ON_QC' | 'REVISION' | 'DONE';
export type CardPriority = 'LOW' | 'MID' | 'HIGH';

export interface CardAssignee {
  id: number;
  card_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Card {
  id: number;
  board_id: number;
  division_id: number;
  title: string;
  description: string | null;
  status: CardStatus;
  priority: CardPriority;
  position: number;
  due_date: string | null;
  created_by: number;
  created_at: string;
  division?: Division;
  assignees?: CardAssignee[];
  attachments?: any[];
  revisions?: any[];
  activities?: any[];
}

export const getBoardCards = async (boardId: number): Promise<{ cards: Card[] }> => {
  return apiFetch<{ cards: Card[] }>(`/boards/${boardId}/cards`);
};

export const createCard = async (
  boardId: number,
  data: {
    title: string;
    division_id: number;
    priority?: CardPriority;
    due_date?: string | null;
    description?: string | null;
  }
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/boards/${boardId}/cards`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const moveCard = async (
  cardId: number,
  status: CardStatus,
  position?: number
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/cards/${cardId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ status, position }),
  });
};

export const updateCard = async (
  cardId: number,
  data: Partial<Card>
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/cards/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCard = async (cardId: number): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>(`/cards/${cardId}`, {
    method: 'DELETE',
  });
};
