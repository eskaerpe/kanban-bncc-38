// Dummy Mock Store for Preview Mode (No Backend Required)

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
  user: { id: number; name: string; email: string };
  division: { id: number; name: string } | null;
}

export interface Board {
  id: number;
  title: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  created_by: number;
  created_at: string;
  creator?: { id: number; name: string; email: string };
  board_members: BoardMember[];
  _count?: { board_members: number; cards: number };
}

export interface CardAssignee {
  card_id: number;
  user_id: number;
  user: { id: number; name: string; email: string };
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
  user?: { id: number; name: string; email: string };
}

export interface CardActivity {
  id: number;
  card_id: number;
  user_id: number;
  action_type: string;
  description: string;
  created_at: string;
  user?: { id: number; name: string; email: string };
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

const mockUsers: UserSummary[] = [
  { id: 1, name: 'Reihan (Preview Admin)', email: 'reihan@bncc.local', global_role: 'GLOBAL_ADMIN' },
  { id: 2, name: 'Budi (Koor Web)', email: 'budi@bncc.local', global_role: 'USER' },
  { id: 3, name: 'Siti (Staff Mobile)', email: 'siti@bncc.local', global_role: 'USER' },
];

const mockDivisions: Division[] = [
  { id: 1, name: 'Web Development' },
  { id: 2, name: 'Mobile Development' },
  { id: 3, name: 'UI/UX Design' },
  { id: 4, name: 'Human Resource' },
];

let mockBoards: Board[] = [
  {
    id: 1,
    title: 'BNCC Launching Proker 2026',
    description: 'Main board proker tahunan BNCC Bandung',
    status: 'ACTIVE',
    created_by: 1,
    created_at: new Date().toISOString(),
    creator: mockUsers[0],
    board_members: [
      { id: 1, board_id: 1, user_id: 1, division_id: 1, role: 'BOARD_ADMIN', user: mockUsers[0], division: mockDivisions[0] },
      { id: 2, board_id: 1, user_id: 2, division_id: 1, role: 'KOOR_DIVISION', user: mockUsers[1], division: mockDivisions[0] },
      { id: 3, board_id: 1, user_id: 3, division_id: 2, role: 'STAFF', user: mockUsers[2], division: mockDivisions[1] },
    ],
    _count: { board_members: 3, cards: 4 }
  },
  {
    id: 2,
    title: 'BNCC Workshop AI & Cloud',
    description: 'Persiapan acara seminar & hands-on workshop',
    status: 'ACTIVE',
    created_by: 1,
    created_at: new Date().toISOString(),
    creator: mockUsers[0],
    board_members: [
      { id: 4, board_id: 2, user_id: 1, division_id: 1, role: 'BOARD_ADMIN', user: mockUsers[0], division: mockDivisions[0] }
    ],
    _count: { board_members: 1, cards: 2 }
  }
];

let mockCards: Card[] = [
  {
    id: 101,
    board_id: 1,
    division_id: 1,
    title: 'Setup Landing Page Prototype',
    description: 'Integrasi Vite + Tailwind CSS untuk tampilan awal',
    status: 'ON_PROGRESS',
    priority: 'HIGH',
    due_date: '2026-09-10',
    position: 1,
    created_at: new Date().toISOString(),
    division: mockDivisions[0],
    assignees: [{ card_id: 101, user_id: 1, user: mockUsers[0] }],
    attachments: [{ id: 1, card_id: 101, title: 'Mockup Figma', url: 'https://figma.com', created_at: new Date().toISOString() }],
    revisions: [],
    activities: [{ id: 1, card_id: 101, user_id: 1, action_type: 'CREATE', description: 'Membuat card prototype', created_at: new Date().toISOString(), user: mockUsers[0] }]
  },
  {
    id: 102,
    board_id: 1,
    division_id: 3,
    title: 'Design Wireframe Board Detail',
    description: 'Komponen modal card dan status tags',
    status: 'DONE',
    priority: 'MID',
    due_date: '2026-09-05',
    position: 1,
    created_at: new Date().toISOString(),
    division: mockDivisions[2],
    assignees: [{ card_id: 102, user_id: 2, user: mockUsers[1] }],
    attachments: [],
    revisions: [],
    activities: []
  },
  {
    id: 103,
    board_id: 1,
    division_id: 2,
    title: 'QC Flow Pembayaran Participant',
    description: 'Review integrasi payment gateway mock',
    status: 'ON_QC',
    priority: 'HIGH',
    due_date: '2026-09-12',
    position: 1,
    created_at: new Date().toISOString(),
    division: mockDivisions[1],
    assignees: [{ card_id: 103, user_id: 3, user: mockUsers[2] }],
    attachments: [],
    revisions: [],
    activities: []
  },
  {
    id: 104,
    board_id: 1,
    division_id: 4,
    title: 'Draft Sponsorship Terms',
    description: 'Hubungi divisi HR & External Relation',
    status: 'TO_DO',
    priority: 'LOW',
    due_date: '2026-09-15',
    position: 1,
    created_at: new Date().toISOString(),
    division: mockDivisions[3],
    assignees: [],
    attachments: [],
    revisions: [],
    activities: []
  }
];

export const getBoards = async (status?: string): Promise<{ boards: Board[] }> => {
  const filtered = status ? mockBoards.filter(b => b.status === status) : mockBoards;
  return { boards: filtered };
};

export const getBoardById = async (id: number): Promise<{ board: Board; divisions: Division[] }> => {
  const board = mockBoards.find(b => b.id === Number(id)) || mockBoards[0];
  return { board, divisions: mockDivisions };
};

export const createBoard = async (data: { title: string; description?: string }): Promise<{ message: string; board: Board }> => {
  const newBoard: Board = {
    id: mockBoards.length + 1,
    title: data.title,
    description: data.description || null,
    status: 'ACTIVE',
    created_by: 1,
    created_at: new Date().toISOString(),
    creator: mockUsers[0],
    board_members: [{ id: Date.now(), board_id: mockBoards.length + 1, user_id: 1, division_id: 1, role: 'BOARD_ADMIN', user: mockUsers[0], division: mockDivisions[0] }],
    _count: { board_members: 1, cards: 0 }
  };
  mockBoards.unshift(newBoard);
  return { message: 'Board created', board: newBoard };
};

export const updateBoard = async (id: number, data: Partial<Board>): Promise<{ message: string; board: Board }> => {
  mockBoards = mockBoards.map(b => b.id === Number(id) ? { ...b, ...data } : b);
  const updated = mockBoards.find(b => b.id === Number(id))!;
  return { message: 'Board updated', board: updated };
};

export const deleteBoard = async (id: number): Promise<{ message: string }> => {
  mockBoards = mockBoards.filter(b => b.id !== Number(id));
  return { message: 'Board deleted' };
};

export const addBoardMember = async (boardId: number, data: any): Promise<{ message: string; member: BoardMember }> => {
  const newMember: BoardMember = {
    id: Date.now(),
    board_id: Number(boardId),
    user_id: data.user_id,
    division_id: data.division_id || null,
    role: data.role || 'STAFF',
    user: mockUsers.find(u => u.id === data.user_id) || mockUsers[0],
    division: mockDivisions.find(d => d.id === data.division_id) || null
  };
  return { message: 'Member added', member: newMember };
};

export const removeBoardMember = async (boardId: number, userId: number): Promise<{ message: string }> => {
  return { message: 'Member removed' };
};

export const getDivisions = async (): Promise<{ divisions: Division[] }> => {
  return { divisions: mockDivisions };
};

export const getUsers = async (): Promise<{ users: UserSummary[] }> => {
  return { users: mockUsers };
};

export const getCards = async (boardId: number): Promise<{ cards: Card[] }> => {
  return { cards: mockCards.filter(c => c.board_id === Number(boardId)) };
};

export const getBoardCards = getCards;

export const createCard = async (boardId: number, data: any): Promise<{ message: string; card: Card }> => {
  const div = mockDivisions.find(d => d.id === Number(data.division_id)) || mockDivisions[0];
  const newCard: Card = {
    id: Date.now(),
    board_id: Number(boardId),
    division_id: Number(data.division_id),
    title: data.title,
    description: data.description || null,
    status: 'TO_DO',
    priority: data.priority || 'MID',
    due_date: data.due_date || null,
    position: mockCards.length + 1,
    created_at: new Date().toISOString(),
    division: div,
    assignees: [],
    attachments: [],
    revisions: [],
    activities: []
  };
  mockCards.push(newCard);
  return { message: 'Card created', card: newCard };
};

export const updateCard = async (id: number, data: any): Promise<{ message: string; card: Card }> => {
  mockCards = mockCards.map(c => c.id === Number(id) ? { ...c, ...data } : c);
  const updated = mockCards.find(c => c.id === Number(id))!;
  return { message: 'Card updated', card: updated };
};

export const moveCard = async (id: number, status: string, position: number): Promise<{ message: string; card: Card }> => {
  mockCards = mockCards.map(c => c.id === Number(id) ? { ...c, status: status as any, position } : c);
  const updated = mockCards.find(c => c.id === Number(id))!;
  return { message: 'Card moved', card: updated };
};

export const deleteCard = async (id: number): Promise<{ message: string }> => {
  mockCards = mockCards.filter(c => c.id !== Number(id));
  return { message: 'Card deleted' };
};

export const addAssignee = async (cardId: number, userId: number): Promise<{ message: string }> => {
  return { message: 'Assignee added' };
};

export const removeAssignee = async (cardId: number, userId: number): Promise<{ message: string }> => {
  return { message: 'Assignee removed' };
};

export const addAttachment = async (cardId: number, data: any): Promise<{ message: string; attachment: CardAttachment }> => {
  const att: CardAttachment = { id: Date.now(), card_id: Number(cardId), title: data.title, url: data.url, created_at: new Date().toISOString() };
  return { message: 'Attachment added', attachment: att };
};

export const deleteAttachment = async (cardId: number, attachmentId: number): Promise<{ message: string }> => {
  return { message: 'Attachment deleted' };
};

export const addRevision = async (cardId: number, note: string): Promise<{ message: string; revision: CardRevision }> => {
  const rev: CardRevision = { id: Date.now(), card_id: Number(cardId), user_id: 1, note, created_at: new Date().toISOString(), user: mockUsers[0] };
  return { message: 'Revision added', revision: rev };
};
