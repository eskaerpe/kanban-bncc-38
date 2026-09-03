import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Filter,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  addBoardMember,
  Board,
  Division,
  getBoardById,
  getDivisions,
  getUsers,
  removeBoardMember,
  updateBoard,
  UserSummary,
} from '../api/board';
import {
  Card,
  CardPriority,
  CardStatus,
  createCard,
  getBoardCards,
  moveCard,
} from '../api/card';
import { CardDetailModal } from '../components/CardDetailModal';
import { CardItem } from '../components/CardItem';
import { KanbanColumn } from '../components/KanbanColumn';

// Standard 5 Kanban Columns configuration
const COLUMNS: { key: CardStatus; title: string; colorAccent: string; badgeBg: string }[] = [
  {
    key: 'TO_DO',
    title: 'TO DO',
    colorAccent: 'border-t-indigo-500',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
  },
  {
    key: 'ON_PROGRESS',
    title: 'On Progress',
    colorAccent: 'border-t-sky-500',
    badgeBg: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  },
  {
    key: 'ON_QC',
    title: 'On QC',
    colorAccent: 'border-t-amber-500',
    badgeBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  {
    key: 'REVISION',
    title: 'Revision',
    colorAccent: 'border-t-rose-500',
    badgeBg: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  },
  {
    key: 'DONE',
    title: 'Done',
    colorAccent: 'border-t-emerald-500',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
];

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = Number(id);
  const { user } = useAuth();

  // Data States
  const [board, setBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Selected Card for Detail Modal
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Filter States
  const [divisionFilter, setDivisionFilter] = useState<string>('ALL'); // 'ALL' | 'MY_DIVISION' | divisionId string
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL'); // 'ALL' | 'HIGH' | 'MID' | 'LOW'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drag and Drop active item
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Modal State for New Card
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState<boolean>(false);
  const [cardTitle, setCardTitle] = useState<string>('');
  const [cardDivisionId, setCardDivisionId] = useState<number | ''>('');
  const [cardPriority, setCardPriority] = useState<CardPriority>('MID');
  const [cardDueDate, setCardDueDate] = useState<string>('');
  const [cardDescription, setCardDescription] = useState<string>('');
  const [newCardError, setNewCardError] = useState<string>('');
  const [isCreatingCard, setIsCreatingCard] = useState<boolean>(false);

  // Modal State for Member Management
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<'BOARD_ADMIN' | 'KOOR_DIVISION' | 'STAFF'>('STAFF');
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | ''>('');
  const [memberActionError, setMemberActionError] = useState<string>('');
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  // DnD Sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load Board & Cards Data
  const loadData = async () => {
    if (!boardId || isNaN(boardId)) {
      setError('ID Proker tidak valid.');
      setLoading(false);
      return;
    }

    try {
      const [boardRes, cardsRes] = await Promise.all([
        getBoardById(boardId),
        getBoardCards(boardId),
      ]);
      setBoard(boardRes.board);
      setDivisions(boardRes.divisions || []);
      setCards(cardsRes.cards || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail proker & kartu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [boardId]);

  // Current user's division in this board (for "Divisi Saya" filter)
  const myMemberInfo = useMemo(() => {
    return board?.board_members?.find((m) => m.user_id === user?.id);
  }, [board, user]);

  const myDivisionId = myMemberInfo?.division_id;

  // Filtered Cards calculation
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      // 1. Division Filter
      if (divisionFilter === 'MY_DIVISION') {
        if (!myDivisionId) return false;
        if (c.division_id !== myDivisionId) return false;
      } else if (divisionFilter !== 'ALL') {
        const targetDivId = Number(divisionFilter);
        if (c.division_id !== targetDivId) return false;
      }

      // 2. Priority Filter
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) {
        return false;
      }

      // 3. Search Title Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesDesc = c.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [cards, divisionFilter, priorityFilter, searchQuery, myDivisionId]);

  // Group cards by status column
  const cardsByColumn = useMemo(() => {
    const map: Record<CardStatus, Card[]> = {
      TO_DO: [],
      ON_PROGRESS: [],
      ON_QC: [],
      REVISION: [],
      DONE: [],
    };

    filteredCards.forEach((card) => {
      if (map[card.status]) {
        map[card.status].push(card);
      } else {
        map.TO_DO.push(card);
      }
    });

    // Sort cards within each column by position
    Object.keys(map).forEach((key) => {
      map[key as CardStatus].sort((a, b) => a.position - b.position);
    });

    return map;
  }, [filteredCards]);

  // Handle Card Update from Modal
  const handleCardUpdated = (updatedCard: Card) => {
    setSelectedCard(updatedCard);
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  // Handle Drag & Drop Events
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find((c) => c.id === Number(active.id));
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = Number(active.id);
    const targetCardId = Number(over.id);

    const draggedCard = cards.find((c) => c.id === activeCardId);
    if (!draggedCard) return;

    let targetStatus: CardStatus = draggedCard.status;
    let targetIndex = 0;

    // Check if dropped over a column container or another card
    const overData = over.data.current;
    if (overData?.type === 'Column') {
      targetStatus = overData.status;
      const cardsInTargetColumn = cards.filter((c) => c.status === targetStatus);
      targetIndex = cardsInTargetColumn.length;
    } else {
      const overCard = cards.find((c) => c.id === targetCardId);
      if (overCard) {
        targetStatus = overCard.status;
        const cardsInTargetColumn = cards.filter((c) => c.status === targetStatus);
        targetIndex = cardsInTargetColumn.findIndex((c) => c.id === targetCardId);
      }
    }

    if (draggedCard.status === targetStatus && draggedCard.position === targetIndex) {
      return;
    }

    // Optimistic State Update
    const previousCards = [...cards];
    setCards((prevCards) => {
      return prevCards.map((c) => {
        if (c.id === activeCardId) {
          return { ...c, status: targetStatus, position: targetIndex };
        }
        return c;
      });
    });

    try {
      await moveCard(activeCardId, targetStatus, targetIndex);
    } catch (err: any) {
      setCards(previousCards);
      alert(err.message || 'Gagal memindahkan kartu.');
    }
  };

  // Open New Card Modal
  const handleOpenNewCardModal = (defaultStatus: CardStatus = 'TO_DO') => {
    setCardTitle('');
    setCardDivisionId(myDivisionId || (divisions[0]?.id ?? ''));
    setCardPriority('MID');
    setCardDueDate('');
    setCardDescription('');
    setNewCardError('');
    setIsNewCardModalOpen(true);
  };

  // Create Card Submit
  const handleCreateCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewCardError('');

    if (!cardTitle.trim()) {
      setNewCardError('Judul kartu wajib diisi.');
      return;
    }
    if (!cardDivisionId) {
      setNewCardError('Pilih divisi untuk kartu ini.');
      return;
    }

    setIsCreatingCard(true);
    try {
      const res = await createCard(boardId, {
        title: cardTitle.trim(),
        division_id: Number(cardDivisionId),
        priority: cardPriority,
        due_date: cardDueDate || null,
        description: cardDescription.trim() || null,
      });

      setCards((prev) => [...prev, res.card]);
      setIsNewCardModalOpen(false);
    } catch (err: any) {
      setNewCardError(err.message || 'Gagal membuat kartu baru.');
    } finally {
      setIsCreatingCard(false);
    }
  };

  // Member management handlers
  const handleOpenMemberModal = async () => {
    setMemberActionError('');
    setIsMemberModalOpen(true);

    try {
      const [usersRes, divsRes] = await Promise.all([getUsers(), getDivisions()]);
      setAllUsers(usersRes.users || []);
      if (divsRes.divisions) setDivisions(divsRes.divisions);
    } catch (err: any) {
      setMemberActionError('Gagal memuat daftar pengguna/divisi.');
    }
  };

  const handleToggleStatus = async () => {
    if (!board) return;
    const newStatus = board.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    setIsUpdatingStatus(true);
    try {
      const res = await updateBoard(board.id, { status: newStatus });
      setBoard((prev) => (prev ? { ...prev, status: res.board.status } : null));
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status proker.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberActionError('');

    if (!selectedUserId) {
      setMemberActionError('Pilih pengguna yang akan ditambahkan.');
      return;
    }

    setIsAddingMember(true);
    try {
      await addBoardMember(boardId, {
        user_id: Number(selectedUserId),
        role: selectedRole,
        division_id: selectedDivisionId !== '' ? Number(selectedDivisionId) : undefined,
      });

      setSelectedUserId('');
      setSelectedRole('STAFF');
      setSelectedDivisionId('');
      await loadData();
    } catch (err: any) {
      setMemberActionError(err.message || 'Gagal menambahkan anggota.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus anggota ini dari proker?')) return;
    setMemberActionError('');
    setRemovingUserId(targetUserId);

    try {
      await removeBoardMember(boardId, targetUserId);
      await loadData();
    } catch (err: any) {
      setMemberActionError(err.message || 'Gagal menghapus anggota.');
    } finally {
      setRemovingUserId(null);
    }
  };

  const isBoardAdmin = myMemberInfo?.role === 'BOARD_ADMIN';
  const isGlobalAdmin = user?.global_role === 'GLOBAL_ADMIN';
  const canManageMembers = isBoardAdmin || isGlobalAdmin;

  const existingUserIds = new Set(board?.board_members?.map((m) => m.user_id) || []);
  const availableUsersToAdd = allUsers.filter((u) => !existingUserIds.has(u.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span>Memuat Board Kanban...</span>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 max-w-md">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-red-300 mb-4">{error || 'Board tidak ditemukan.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              to="/"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {board.title}
                </h1>
                {board.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Archive className="h-3 w-3" />
                    ARCHIVED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {board.description || 'Tidak ada deskripsi.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManageMembers && (
              <button
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
                title="Ubah status proker"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
                <span>{board.status === 'ACTIVE' ? 'Arsipkan' : 'Aktifkan'}</span>
              </button>
            )}

            <button
              onClick={handleOpenMemberModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-all"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Kelola Anggota ({board.board_members?.length || 0})</span>
            </button>

            <button
              onClick={() => handleOpenNewCardModal('TO_DO')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-950/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Tambah Card Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Top Filter Bar Section */}
      <section className="border-b border-slate-800/80 bg-slate-950/40 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="h-3.5 w-3.5 text-indigo-400" />
              Divisi:
            </span>

            <button
              onClick={() => setDivisionFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                divisionFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Semua Divisi
            </button>

            {myDivisionId && (
              <button
                onClick={() => setDivisionFilter('MY_DIVISION')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  divisionFilter === 'MY_DIVISION'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Divisi Saya ({myMemberInfo?.division?.name || 'Divisi'})
              </button>
            )}

            <select
              value={
                divisionFilter !== 'ALL' && divisionFilter !== 'MY_DIVISION'
                  ? divisionFilter
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) setDivisionFilter(e.target.value);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 outline-none focus:border-indigo-500"
            >
              <option value="">-- Pilih Divisi --</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id.toString()}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Priority:</span>
              {(['ALL', 'HIGH', 'MID', 'LOW'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    priorityFilter === p
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="relative flex-1 md:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari kartu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Kanban Workspace with 5 Columns & DnD Context */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key}
                status={col.key}
                title={col.title}
                cards={cardsByColumn[col.key]}
                colorAccent={col.colorAccent}
                badgeBg={col.badgeBg}
                onAddCardClick={() => handleOpenNewCardModal(col.key)}
                onCardClick={(card) => setSelectedCard(card)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? <CardItem card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          boardMembers={board?.board_members || []}
          divisions={divisions}
          onClose={() => setSelectedCard(null)}
          onCardUpdated={handleCardUpdated}
        />
      )}

      {/* Modal "+ Tambah Card Baru" */}
      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Plus className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-white">Tambah Card Baru</h2>
              </div>
              <button
                onClick={() => setIsNewCardModalOpen(false)}
                disabled={isCreatingCard}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {newCardError && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{newCardError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCardSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Judul Card <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Desain Banner Welcoming Party"
                  value={cardTitle}
                  disabled={isCreatingCard}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Divisi Penanggung Jawab <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={cardDivisionId}
                    disabled={isCreatingCard}
                    onChange={(e) =>
                      setCardDivisionId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Pilih Divisi --</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Prioritas
                  </label>
                  <select
                    value={cardPriority}
                    disabled={isCreatingCard}
                    onChange={(e) => setCardPriority(e.target.value as CardPriority)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MID">MID</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tenggat Waktu (Due Date)
                </label>
                <input
                  type="date"
                  value={cardDueDate}
                  disabled={isCreatingCard}
                  onChange={(e) => setCardDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Deskripsi Card
                </label>
                <textarea
                  rows={3}
                  placeholder="Rincian tugas atau kebutuhan..."
                  value={cardDescription}
                  disabled={isCreatingCard}
                  onChange={(e) => setCardDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCardModalOpen(false)}
                  disabled={isCreatingCard}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCard}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-sm shadow-md shadow-indigo-950/50 transition-all disabled:opacity-60"
                >
                  {isCreatingCard ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Buat Card</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal "Kelola Anggota Board" */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">Kelola Anggota Board</h2>
                  <p className="text-xs text-slate-400">{board.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {memberActionError && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{memberActionError}</span>
              </div>
            )}

            <div className="overflow-y-auto space-y-6 my-4 pr-1">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Tambah Anggota Baru
                </h3>

                <form onSubmit={handleAddMemberSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Pilih Pengguna <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedUserId}
                        disabled={isAddingMember}
                        onChange={(e) =>
                          setSelectedUserId(e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Pilih User --</option>
                        {availableUsersToAdd.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Role Board <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedRole}
                        disabled={isAddingMember}
                        onChange={(e) => setSelectedRole(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="STAFF">STAFF</option>
                        <option value="KOOR_DIVISION">KOOR_DIVISION</option>
                        <option value="BOARD_ADMIN">BOARD_ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Divisi
                      </label>
                      <select
                        value={selectedDivisionId}
                        disabled={isAddingMember}
                        onChange={(e) =>
                          setSelectedDivisionId(
                            e.target.value ? Number(e.target.value) : ''
                          )
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Tanpa Divisi --</option>
                        {divisions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isAddingMember}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                    >
                      {isAddingMember ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Menambahkan...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Tambah Anggota</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Daftar Anggota ({board.board_members?.length || 0})
                </h3>

                {!board.board_members || board.board_members.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    Belum ada anggota di board ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {board.board_members.map((m) => {
                      const isSelf = m.user_id === user?.id;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300 border border-indigo-500/20">
                              {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {m.user?.name || 'User'}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 block">
                                {m.user?.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80 font-medium">
                              {m.division?.name || 'Tanpa Divisi'}
                            </span>
                            <RoleBadge role={m.role} />
                            {canManageMembers && (
                              <button
                                onClick={() => handleRemoveMember(m.user_id)}
                                disabled={removingUserId === m.user_id}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                title="Hapus dari board"
                              >
                                {removingUserId === m.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'BOARD_ADMIN':
      return (
        <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
          <Shield className="h-3 w-3" />
          BOARD_ADMIN
        </span>
      );
    case 'KOOR_DIVISION':
      return (
        <span className="text-xs px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
          KOOR_DIVISION
        </span>
      );
    case 'STAFF':
    default:
      return (
        <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-medium">
          STAFF
        </span>
      );
  }
}
