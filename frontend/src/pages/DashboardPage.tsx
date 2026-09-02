import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  FolderPlus,
  KanbanSquare,
  Loader2,
  LogOut,
  Plus,
  Shield,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Board, createBoard, getBoards } from '../api/board';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Status Filter: 'ACTIVE' | 'ARCHIVED'
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [titleError, setTitleError] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchBoards = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBoards();
      setBoards(data.boards || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar program kerja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleOpenModal = () => {
    setNewTitle('');
    setNewDescription('');
    setTitleError('');
    setCreateError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setTitleError('');

    if (!newTitle.trim()) {
      setTitleError('Nama Proker wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createBoard({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });
      setIsModalOpen(false);
      // Reload board list & navigate to the newly created board
      await fetchBoards();
      if (res.board?.id) {
        navigate(`/boards/${res.board.id}`);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat proker baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBoards = boards.filter((b) => b.status === activeTab);
  const activeCount = boards.filter((b) => b.status === 'ACTIVE').length;
  const archivedCount = boards.filter((b) => b.status === 'ARCHIVED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-950/60 ring-1 ring-white/10">
              <KanbanSquare className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                BNCC Proker Kanban
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                Workspace
              </span>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-inner ring-1 ring-white/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-medium text-slate-200 leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Shield className="h-3 w-3 text-indigo-400" />
                  {user?.global_role === 'GLOBAL_ADMIN' ? 'Global Admin' : 'User Member'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              title="Logout dari akun"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Program Kerja (Proker) Kanban
            </h1>
            <p className="mt-1.5 text-sm text-slate-400 max-w-2xl">
              Kelola dan pantau alur kerja seluruh program kerja BNCC secara terstruktur dengan sistem Kanban board.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-950/50 transition-all hover:shadow-indigo-900/50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="h-4 w-4" />
            <span>+ Buat Proker Baru</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center border-b border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === 'ACTIVE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Active Proker</span>
            <span
              className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'ACTIVE'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === 'ARCHIVED'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>Archived Proker</span>
            <span
              className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'ARCHIVED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {archivedCount}
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-48 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-slate-800 rounded w-2/3" />
                  <div className="h-4 bg-slate-800/60 rounded w-full" />
                  <div className="h-4 bg-slate-800/60 rounded w-4/5" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
                  <div className="h-6 w-20 bg-slate-800 rounded-full" />
                  <div className="h-6 w-16 bg-slate-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBoards.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-4">
              {activeTab === 'ACTIVE' ? (
                <FolderPlus className="h-7 w-7" />
              ) : (
                <Archive className="h-7 w-7" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">
              Tidak ada {activeTab === 'ACTIVE' ? 'Proker Aktif' : 'Proker yang di-Arsip'}
            </h3>
            <p className="mt-1.5 text-sm text-slate-400 max-w-md">
              {activeTab === 'ACTIVE'
                ? 'Belum ada program kerja aktif saat ini. Mulai buat proker baru untuk tim Anda.'
                : 'Belum ada program kerja yang diarsipkan.'}
            </p>
            {activeTab === 'ACTIVE' && (
              <button
                onClick={handleOpenModal}
                className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Proker Baru</span>
              </button>
            )}
          </div>
        ) : (
          /* Proker Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map((board) => {
              const members = board.board_members || [];
              const memberCount = board._count?.board_members ?? members.length;
              const displayMembers = members.slice(0, 3);
              const remainingMembers = Math.max(0, memberCount - displayMembers.length);

              return (
                <div
                  key={board.id}
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-950/20 cursor-pointer"
                >
                  <div>
                    {/* Header: Title & Status Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {board.title}
                      </h3>
                      {board.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Archive className="h-3 w-3" />
                          ARCHIVED
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6">
                      {board.description || 'Tidak ada deskripsi program kerja.'}
                    </p>
                  </div>

                  {/* Card Footer: Members & Navigation hint */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <div className="flex -space-x-2 overflow-hidden">
                        {displayMembers.map((m) => (
                          <div
                            key={m.id}
                            title={m.user?.name || 'Member'}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-950 border border-indigo-500/30 text-xs font-medium text-indigo-200 ring-2 ring-slate-900"
                          >
                            {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        ))}
                        {remainingMembers > 0 && (
                          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300 ring-2 ring-slate-900">
                            +{remainingMembers}
                          </div>
                        )}
                        {displayMembers.length === 0 && (
                          <span className="text-xs text-slate-500 italic">Belum ada anggota</span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Buka Board &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal "+ Buat Proker Baru" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FolderPlus className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-white">Buat Proker Baru</h2>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Error Alert */}
            {createError && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nama Program Kerja <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Welcoming Party 2026"
                  value={newTitle}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (titleError) setTitleError('');
                  }}
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all ${
                    titleError
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/25'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25'
                  }`}
                />
                {titleError && (
                  <p className="mt-1.5 text-xs text-red-400" role="alert">
                    {titleError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Deskripsi Program Kerja
                </label>
                <textarea
                  rows={4}
                  placeholder="Jelaskan tujuan dan ruang lingkup program kerja ini..."
                  value={newDescription}
                  disabled={isSubmitting}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-sm shadow-md shadow-indigo-950/50 transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Buat Proker</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
