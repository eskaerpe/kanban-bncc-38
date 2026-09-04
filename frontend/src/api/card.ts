import { apiFetch } from './client';
import { UserSummary, Division } from './board';

export interface CardAssignee {
  card_id: number;
  user_id: number;
  user: UserSummary;
}

export interface CardAttachment {
  id: number;
  card_id: number;
  title: string;
  url: string;
  created_at: string;
}

export interface CardRevision {
  id: number;
  card_id: number;
  user_id: number;
  note: string;
  created_at: string;
  user?: UserSummary;
}

export interface CardActivity {
  id: number;
  card_id: number;
  user_id: number;
  action_type: string;
  description: string;
  created_at: string;
  user?: UserSummary;
}

export interface Card {
  id: number;
  board_id: number;
  division_id: number;
  title: string;
  description: string | null;
  status: 'TO_DO' | 'ON_PROGRESS' | 'ON_QC' | 'REVISION' | 'DONE';
  priority: 'LOW' | 'MID' | 'HIGH';
  due_date: string | null;
  position: number;
  created_at: string;
  division: Division;
  assignees: CardAssignee[];
  attachments?: CardAttachment[];
  revisions?: CardRevision[];
  activities?: CardActivity[];
}

export const getCards = async (boardId: number): Promise<{ cards: Card[] }> => {
  return apiFetch(`/boards/${boardId}/cards`);
};

export const getBoardCards = getCards;

export const createCard = async (
  boardId: number,
  data: { division_id: number; title: string; description?: string; priority?: string; due_date?: string }
): Promise<{ message: string; card: Card }> => {
  return apiFetch(`/boards/${boardId}/cards`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCard = async (id: number, data: Partial<Card>): Promise<{ message: string; card: Card }> => {
  return apiFetch(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const moveCard = async (
  id: number,
  status: 'TO_DO' | 'ON_PROGRESS' | 'ON_QC' | 'REVISION' | 'DONE',
  position: number
): Promise<{ message: string; card: Card }> => {
  return apiFetch(`/cards/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ status, position }),
  });
};

export const deleteCard = async (id: number): Promise<{ message: string }> => {
  return apiFetch(`/cards/${id}`, {
    method: 'DELETE',
  });
};

export const addAssignee = async (cardId: number, userId: number): Promise<{ message: string }> => {
  return apiFetch(`/cards/${cardId}/assignees`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
};

export const removeAssignee = async (cardId: number, userId: number): Promise<{ message: string }> => {
  return apiFetch(`/cards/${cardId}/assignees/${userId}`, {
    method: 'DELETE',
  });
};

export const addAttachment = async (
  cardId: number,
  data: { title: string; url: string }
): Promise<{ message: string; attachment: CardAttachment }> => {
  return apiFetch(`/cards/${cardId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteAttachment = async (cardId: number, attachmentId: number): Promise<{ message: string }> => {
  return apiFetch(`/cards/${cardId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
};

export const addRevision = async (
  cardId: number,
  note: string
): Promise<{ message: string; revision: CardRevision }> => {
  return apiFetch(`/cards/${cardId}/revisions`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};
