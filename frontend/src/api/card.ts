import { apiFetch } from './client';
import { Division } from './board';

export interface CardAssignee {
  card_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
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
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CardActivity {
  id: number;
  card_id: number;
  user_id: number;
  action_type: string;
  description: string;
  created_at: string;
  user?: {
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
  return apiFetch<{ cards: Card[] }>(`/boards/${boardId}/cards`);
};

export const getBoardCards = getCards;

export const createCard = async (
  boardId: number,
  data: {
    division_id: number;
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/boards/${boardId}/cards`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCard = async (
  id: number,
  data: Partial<Card> & { revision_note?: string }
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const moveCard = async (
  id: number,
  status: string,
  position: number,
  revision_note?: string
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/cards/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ status, position, revision_note }),
  });
};

export const deleteCard = async (id: number): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>(`/cards/${id}`, {
    method: 'DELETE',
  });
};

export const addAssignee = async (
  cardId: number,
  userId: number
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/cards/${cardId}/assignees`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
};

export const removeAssignee = async (
  cardId: number,
  userId: number
): Promise<{ message: string; card: Card }> => {
  return apiFetch<{ message: string; card: Card }>(`/cards/${cardId}/assignees/${userId}`, {
    method: 'DELETE',
  });
};

export const addAttachment = async (
  cardId: number,
  data: { title: string; url: string }
): Promise<{ message: string; attachment: CardAttachment }> => {
  return apiFetch<{ message: string; attachment: CardAttachment }>(`/cards/${cardId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteAttachment = async (
  attachmentId: number
): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>(`/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
};

export const getCardActivities = async (
  cardId: number
): Promise<{ activities: CardActivity[] }> => {
  return apiFetch<{ activities: CardActivity[] }>(`/cards/${cardId}/activities`);
};
