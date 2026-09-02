const BASE_URL = '/api';

export interface ApiFetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const apiFetch = async <T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> => {
  const token = localStorage.getItem('kanban_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
};
