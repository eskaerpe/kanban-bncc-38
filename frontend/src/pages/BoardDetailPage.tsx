import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock,
  KanbanSquare,
  Layers,
  Loader2,
  Plus,
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
  BoardMember,
  Division,
  getBoardById,
  getDivisions,
  getUsers,
  removeBoardMember,
  updateBoard,
  UserSummary,
} from '../api/board';

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Board | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Modal State for Member Management
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<'BOARD_ADMIN' | 'KOOR_DIVISION' | 'STAFF'>('STAFF');
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | ''>('');
  const [memberActionError, setMemberActionError] = useState<string>('');
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  // Fetch Board details & reference data
  const loadBoardData = async () => {
    if (!boardId || isNaN(boardId)) {
      setError('ID Proker tidak valid.');
      setLoading(false);
      return;
    }

    try {
      const data = await getBoardById(boardId);
      setBoard(data.board);
      setDivisions(data.divisions || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail program kerja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  // Load available users and divisions when opening the Member Modal
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

  // Toggle Proker Status (ACTIVE <-> ARCHIVED)
  const handleToggleStatus = async () => {
    if (!board) return;
    const newStatus = board.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    setIsUpdatingStatus(true);
    try {
      const res = await updateBoard(board.id, { status: newStatus });
      setBoard((prev) => (prev ? { ...prev, status: res.board.status } : null));
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status proker.');
    } fontFinally: {
      setIsUpdatingStatus(false);
    }
  };

  // Add Member submit
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

      // Reset form & Refresh board details
      setSelectedUserId('');
      setSelectedRole('STAFF');
      setSelectedDivisionId('');
      await loadBoardData();
    } catch (err: any) {
      setMemberActionError(err.message || 'Gagal menambahkan anggota.');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (targetUserId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus anggota ini dari proker?')) return;
    setMemberActionError('');
    setRemovingUserId(targetUserId);

    try {
      await removeBoardMember(boardId, targetUserId);
      await loadBoardData();
    } catch (err: any) {
      setMemberActionError(err.message || 'Gagal menghapus anggota.');
    } finally {
      setRemovingUserId(null);
    }
  };

  // Check user permissions for member removal / admin rights
  const currentMember = board?.board_members?.find((m) => m.user_id === user?.id);
  const isBoardAdmin = currentMember?.role === 'BOARD_ADMIN';
  const isGlobalAdmin = user?.global_role === 'GLOBAL_ADMIN';
  const canManageMembers = isBoardAdmin || isGlobalAdmin;

  // Filter out existing board members from "Add Member" dropdown
  const existingUserIds = new Set(board?.board_members?.map((m) => m.user_id) || []);
  const availableUsersToAdd = allUsers.filter((u) => !existingUserIds.has(u.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span>Memuat data Proker...</span>
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
      {/* Detail Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
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
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {board.description || 'Tidak ada deskripsi.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManageMembers && (
              <button
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-sm shadow-md shadow-indigo-950/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Users className="h-4 w-4" />
              <span>Kelola Anggota ({board.board_members?.length || 0})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Kanban Stage 3 Columns Placeholder */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Stage 3 Notice Banner */}
        <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
              <KanbanSquare className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Papan Tugas Kanban
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  STAGE 3 PREVIEW
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Struktur kolom alur kerja telah disiapkan. Fitur manajemen kartu, komentar, dan drag & drop akan diaktifkan pada Stage 3.
              </p>
            </div>
          </div>
        </div>

        {/* Kanban Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 flex-1">
          {/* Column 1: TO DO */}
          <KanbanColumnSkeleton
            title="To Do"
            count={0}
            colorAccent="border-t-indigo-500"
            badgeBg="bg-indigo-500/10 text-indigo-400"
            description="Tugas yang belum dimulai"
          />

          {/* Column 2: IN PROGRESS */}
          <KanbanColumnSkeleton
            title="In Progress"
            count={0}
            colorAccent="border-t-sky-500"
            badgeBg="bg-sky-500/10 text-sky-400"
            description="Tugas sedang dikerjakan"
          />

          {/* Column 3: REVIEW */}
          <KanbanColumnSkeleton
            title="Review"
            count={0}
            colorAccent="border-t-amber-500"
            badgeBg="bg-amber-500/10 text-amber-400"
            description="Tugas menunggu verifikasi"
          />

          {/* Column 4: DONE */}
          <KanbanColumnSkeleton
            title="Done"
            count={0}
            colorAccent="border-t-emerald-500"
            badgeBg="bg-emerald-500/10 text-emerald-400"
            description="Tugas selesai dikerjakan"
          />
        </div>
      </main>

      {/* Modal "Kelola Anggota Board" */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
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

            {/* Error Alert */}
            {memberActionError && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{memberActionError}</span>
              </div>
            )}

            <div className="overflow-y-auto space-y-6 my-4 pr-1">
              {/* Form "Tambah Anggota Baru" */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Tambah Anggota Baru
                </h3>

                <form onSubmit={handleAddMemberSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* User Select */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Pilih Pengguna <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedUserId}
                        disabled={isAddingMember}
                        onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Pilih User --</option>
                        {availableUsersToAdd.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Role Select */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Role Board <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedRole}
                        disabled={isAddingMember}
                        onChange={(e) => setSelectedRole(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="STAFF">STAFF</option>
                        <option value="KOOR_DIVISION">KOOR_DIVISION</option>
                        <option value="BOARD_ADMIN">BOARD_ADMIN</option>
                      </select>
                    </div>

                    {/* Division Select */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Divisi
                      </label>
                      <select
                        value={selectedDivisionId}
                        disabled={isAddingMember}
                        onChange={(e) => setSelectedDivisionId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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

              {/* Members List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Daftar Anggota ({board.board_members?.length || 0})
                </h3>

                {(!board.board_members || board.board_members.length === 0) ? (
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
                            {/* Division Tag */}
                            <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80 font-medium">
                              {m.division?.name || 'Tanpa Divisi'}
                            </span>

                            {/* Role Badge */}
                            <RoleBadge role={m.role} />

                            {/* Remove button (if canManageMembers) */}
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

            {/* Modal Footer */}
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

// Role Badge Component
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

// Kanban Column Skeleton Placeholder
function KanbanColumnSkeleton({
  title,
  count,
  colorAccent,
  badgeBg,
  description,
}: {
  title: string;
  count: number;
  colorAccent: string;
  badgeBg: string;
  description: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col border-t-2 ${colorAccent}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeBg}`}>
            {count}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mb-4">{description}</p>

      {/* Empty Card Container */}
      <div className="flex-1 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-4 flex flex-col items-center justify-center text-center min-h-[220px]">
        <Layers className="h-6 w-6 text-slate-700 mb-2" />
        <span className="text-xs font-medium text-slate-500">Belum ada kartu</span>
        <span className="text-[10px] text-slate-600 mt-1">Kartu tugas diaktifkan pada Stage 3</span>
      </div>
    </div>
  );
}
