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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bncc-blue text-white shadow-sm ring-1 ring-bncc-blue/20">
              <KanbanSquare className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="text-base font-bold text-bncc-navy tracking-tight">
                BNCC Proker Kanban
              </span>
              <span className="hidden sm:inline-block ml-2.5 text-xs px-2 py-0.5 rounded bg-bncc-bg text-bncc-blue border border-slate-200 font-semibold">
                Bina Nusantara Computer Club
              </span>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
              <div className="h-9 w-9 rounded-full bg-bncc-navy text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Shield className="h-3 w-3 text-bncc-blue" />
                  {user?.global_role === 'GLOBAL_ADMIN' ? 'Global Admin' : 'Pengurus / Member'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all text-xs font-semibold focus:outline-none"
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-bncc-navy">
              Program Kerja (Proker) Kanban
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl font-medium">
              Kelola dan pantau alur kerja seluruh program kerja BNCC secara terstruktur dengan sistem Kanban board 5 kolom.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bncc-blue hover:bg-bncc-blue-dark text-white font-bold text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-bncc-blue/30"
          >
            <Plus className="h-4 w-4" />
            <span>+ Buat Proker Baru</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'ACTIVE'
                ? 'border-bncc-blue text-bncc-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Active Proker</span>
            <span
              className={`ml-1 px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                activeTab === 'ACTIVE'
                  ? 'bg-bncc-blue/10 text-bncc-blue border border-bncc-blue/20'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'ARCHIVED'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>Archived Proker</span>
            <span
              className={`ml-1 px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                activeTab === 'ARCHIVED'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {archivedCount}
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-48 rounded-lg border border-slate-200 bg-white p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-4/5" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBoards.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-16 px-4 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3">
              {activeTab === 'ACTIVE' ? (
                <FolderPlus className="h-6 w-6 text-bncc-blue" />
              ) : (
                <Archive className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <h3 className="text-base font-bold text-bncc-navy">
              Tidak ada {activeTab === 'ACTIVE' ? 'Proker Aktif' : 'Proker yang di-Arsip'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              {activeTab === 'ACTIVE'
                ? 'Belum ada program kerja aktif saat ini. Mulai buat proker baru untuk tim BNCC Anda.'
                : 'Belum ada program kerja yang diarsipkan.'}
            </p>
            {activeTab === 'ACTIVE' && (
              <button
                onClick={handleOpenModal}
                className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-bncc-blue hover:bg-bncc-blue-dark text-white text-xs font-bold transition-colors"
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
                  className="group relative flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 transition-all duration-200 hover:border-bncc-blue hover:shadow-md cursor-pointer"
                >
                  <div>
                    {/* Header: Title & Status Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <h3 className="text-base font-bold text-bncc-navy group-hover:text-bncc-blue transition-colors line-clamp-1">
                        {board.title}
                      </h3>
                      {board.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 shrink-0 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 shrink-0 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Archive className="h-3 w-3" />
                          ARCHIVED
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">
                      {board.description || 'Tidak ada deskripsi program kerja.'}
                    </p>
                  </div>

                  {/* Card Footer: Members & Navigation hint */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {displayMembers.map((m) => (
                          <div
                            key={m.id}
                            title={m.user?.name || 'Member'}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-bncc-navy border border-slate-200 text-[10px] font-bold text-white ring-2 ring-white"
                          >
                            {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        ))}
                        {remainingMembers > 0 && (
                          <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white">
                            +{remainingMembers}
                          </div>
                        )}
                        {displayMembers.length === 0 && (
                          <span className="text-xs text-slate-400 italic">Belum ada anggota</span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-bold text-bncc-blue group-hover:translate-x-1 transition-transform flex items-center gap-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-blue-50 text-bncc-blue">
                  <FolderPlus className="h-5 w-5" />
                </span>
                <h2 className="text-base font-bold text-bncc-navy">Buat Proker Baru</h2>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Error Alert */}
            {createError && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Program Kerja <span className="text-red-500">*</span>
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
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all ${
                    titleError
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                      : 'border-slate-200 focus:border-bncc-blue focus:ring-2 focus:ring-bncc-blue/20'
                  }`}
                />
                {titleError && (
                  <p className="mt-1 text-xs text-red-500 font-medium" role="alert">
                    {titleError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Program Kerja
                </label>
                <textarea
                  rows={4}
                  placeholder="Jelaskan tujuan dan ruang lingkup program kerja ini..."
                  value={newDescription}
                  disabled={isSubmitting}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-bncc-blue focus:ring-2 focus:ring-bncc-blue/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bncc-blue hover:bg-bncc-blue-dark text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60"
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
