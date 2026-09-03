import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  History,
  Info,
  Layers,
  Link2,
  Loader2,
  MessageSquare,
  Plus,
  Shield,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BoardMember, Division } from '../api/board';
import {
  addAssignee,
  addAttachment,
  Card,
  CardPriority,
  CardStatus,
  deleteAttachment,
  removeAssignee,
  updateCard,
} from '../api/card';

interface CardDetailModalProps {
  card: Card;
  boardMembers: BoardMember[];
  divisions: Division[];
  onClose: () => void;
  onCardUpdated: (updatedCard: Card) => void;
}

export function CardDetailModal({
  card,
  boardMembers,
  divisions,
  onClose,
  onCardUpdated,
}: CardDetailModalProps) {
  const { user } = useAuth();

  // Editable fields state
  const [title, setTitle] = useState(card.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState(card.description || '');
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [status, setStatus] = useState<CardStatus>(card.status);
  const [priority, setPriority] = useState<CardPriority>(card.priority);
  const [divisionId, setDivisionId] = useState<number>(card.division_id);
  const [dueDate, setDueDate] = useState<string>(
    card.due_date ? card.due_date.split('T')[0] : ''
  );

  // QC & Revision note state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionError, setRevisionError] = useState('');
  const [isSubmittingQC, setIsSubmittingQC] = useState(false);

  // Attachments form state
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);

  // Assignee selection state
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // General error banner
  const [actionError, setActionError] = useState('');

  // Active Tab: 'DESCRIPTION' | 'ATTACHMENTS' | 'REVISIONS' | 'ACTIVITIES'
  const [activeTab, setActiveTab] = useState<
    'DESCRIPTION' | 'ATTACHMENTS' | 'REVISIONS' | 'ACTIVITIES'
  >('DESCRIPTION');

  // Sync props to state if card prop updates
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || '');
    setStatus(card.status);
    setPriority(card.priority);
    setDivisionId(card.division_id);
    setDueDate(card.due_date ? card.due_date.split('T')[0] : '');
  }, [card]);

  // Current user role evaluation
  const myMemberInfo = boardMembers.find((m) => m.user_id === user?.id);
  const isBoardAdmin = myMemberInfo?.role === 'BOARD_ADMIN';
  const isKoorOfCardDivision =
    myMemberInfo?.role === 'KOOR_DIVISION' && myMemberInfo?.division_id === card.division_id;
  const isGlobalAdmin = user?.global_role === 'GLOBAL_ADMIN';
  const isAuthorizedQC = isBoardAdmin || isKoorOfCardDivision || isGlobalAdmin;

  // Title Save handler
  const handleSaveTitle = async () => {
    if (!title.trim() || title === card.title) {
      setTitle(card.title);
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await updateCard(card.id, { title: title.trim() });
      onCardUpdated(res.card);
      setIsEditingTitle(false);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan judul.');
      setTitle(card.title);
    }
  };

  // Property updates
  const handleUpdateProperty = async (fields: Partial<Card>) => {
    setActionError('');
    try {
      const res = await updateCard(card.id, fields);
      onCardUpdated(res.card);
    } catch (err: any) {
      setActionError(err.message || 'Gagal memperbarui properti.');
      setStatus(card.status);
      setPriority(card.priority);
      setDivisionId(card.division_id);
      setDueDate(card.due_date ? card.due_date.split('T')[0] : '');
    }
  };

  // Status select change
  const handleStatusSelectChange = (newStatus: CardStatus) => {
    if (newStatus === 'REVISION') {
      setShowRevisionForm(true);
      return;
    }
    setStatus(newStatus);
    handleUpdateProperty({ status: newStatus });
  };

  // Description Save handler
  const handleSaveDescription = async () => {
    setIsSavingDesc(true);
    setActionError('');
    try {
      const res = await updateCard(card.id, { description: description.trim() || null });
      onCardUpdated(res.card);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan deskripsi.');
    } finally {
      setIsSavingDesc(false);
    }
  };

  // QC Approve -> DONE
  const handleApproveQC = async () => {
    setIsSubmittingQC(true);
    setActionError('');
    try {
      const res = await updateCard(card.id, { status: 'DONE' });
      onCardUpdated(res.card);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyetujui QC.');
    } finally {
      setIsSubmittingQC(false);
    }
  };

  // QC Request Revision -> REVISION
  const handleRequestRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevisionError('');

    if (!revisionNote.trim() || revisionNote.trim().length < 5) {
      setRevisionError('Catatan revisi wajib diisi (minimal 5 karakter).');
      return;
    }

    setIsSubmittingQC(true);
    setActionError('');
    try {
      const res = await updateCard(card.id, {
        status: 'REVISION',
        revision_note: revisionNote.trim(),
      });
      onCardUpdated(res.card);
      setShowRevisionForm(false);
      setRevisionNote('');
    } catch (err: any) {
      setRevisionError(err.message || 'Gagal mengirim revisi.');
    } finally {
      setIsSubmittingQC(false);
    }
  };

  // Assignee Add & Remove
  const handleAddAssignee = async (userIdToAdd: number) => {
    setIsAssigning(true);
    setActionError('');
    try {
      const res = await addAssignee(card.id, userIdToAdd);
      onCardUpdated(res.card);
      setSelectedAssigneeUserId('');
    } catch (err: any) {
      setActionError(err.message || 'Gagal menambahkan assignee.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignee = async (userIdToRemove: number) => {
    setActionError('');
    try {
      const res = await removeAssignee(card.id, userIdToRemove);
      onCardUpdated(res.card);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menghapus assignee.');
    }
  };

  // Attachment Add & Delete
  const handleAddAttachmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttachmentError('');

    if (!attachmentTitle.trim()) {
      setAttachmentError('Judul link attachment wajib diisi.');
      return;
    }

    let urlToSave = attachmentUrl.trim();
    if (!urlToSave) {
      setAttachmentError('URL link attachment wajib diisi.');
      return;
    }

    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = `https://${urlToSave}`;
    }

    const urlPattern = /^(https?:\/\/)?([\w.-]+)+[\w\-_~:/?#[\]@!$&'()*+,;=.]+$/;
    if (!urlPattern.test(urlToSave)) {
      setAttachmentError('Format URL tidak valid (harus berupa link valid).');
      return;
    }

    setIsAddingAttachment(true);
    try {
      const res = await addAttachment(card.id, {
        title: attachmentTitle.trim(),
        url: urlToSave,
      });

      const updatedAttachments = [...(card.attachments || []), res.attachment];
      onCardUpdated({ ...card, attachments: updatedAttachments });

      setAttachmentTitle('');
      setAttachmentUrl('');
    } catch (err: any) {
      setAttachmentError(err.message || 'Gagal menambahkan attachment.');
    } finally {
      setIsAddingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      const updatedAttachments = (card.attachments || []).filter((a) => a.id !== attachmentId);
      onCardUpdated({ ...card, attachments: updatedAttachments });
    } catch (err: any) {
      setActionError(err.message || 'Gagal menghapus attachment.');
    }
  };

  const assignedUserIds = new Set(card.assignees?.map((a) => a.user_id) || []);
  const availableAssignees = boardMembers.filter((m) => !assignedUserIds.has(m.user_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-bncc-blue">
              <Layers className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-slate-600">
              Detail Card #{card.id}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Error Banner */}
          {actionError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{actionError}</span>
            </div>
          )}

          {/* QC Approval Gatekeeper Banner (Only when status === 'ON_QC') */}
          {card.status === 'ON_QC' && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Gatekeeper Quality Control (ON QC)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      Kartu ini sedang menunggu persetujuan QC dari Koor Divisi atau DPI Event.
                    </p>
                  </div>
                </div>

                {/* QC Action Buttons or Info Badge */}
                {isAuthorizedQC ? (
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={handleApproveQC}
                      disabled={isSubmittingQC}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-60"
                    >
                      {isSubmittingQC ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>✓ Approve & Mark Done</span>
                    </button>

                    <button
                      onClick={() => setShowRevisionForm((prev) => !prev)}
                      disabled={isSubmittingQC}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>✕ Minta Revisi</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold self-start sm:self-center">
                    <Info className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Menunggu Review Koor Divisi / DPI Event</span>
                  </div>
                )}
              </div>

              {/* Revision Form Section */}
              {showRevisionForm && isAuthorizedQC && (
                <form
                  onSubmit={handleRequestRevisionSubmit}
                  className="mt-4 pt-4 border-t border-purple-200 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-red-700 mb-1">
                      Catatan Revisi <span className="text-red-500">* (min 5 karakter)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan bagian mana yang perlu diperbaiki oleh pelaksana..."
                      value={revisionNote}
                      disabled={isSubmittingQC}
                      onChange={(e) => {
                        setRevisionNote(e.target.value);
                        if (revisionError) setRevisionError('');
                      }}
                      className="w-full rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-red-500"
                    />
                    {revisionError && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{revisionError}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(false)}
                      disabled={isSubmittingQC}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingQC}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors disabled:opacity-60"
                    >
                      {isSubmittingQC && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Kirim Revisi & Pindahkan ke Revision
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Editable Title */}
          <div>
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitle(card.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="w-full text-xl font-extrabold text-bncc-navy bg-white border border-bncc-blue rounded-lg px-3 py-1.5 outline-none"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-extrabold text-bncc-navy hover:bg-slate-100 p-1.5 -ml-1.5 rounded-lg transition-colors cursor-pointer tracking-tight"
                title="Klik untuk mengubah judul"
              >
                {card.title}
              </h1>
            )}
          </div>

          {/* Notion-Style Vertical Property List */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
            {/* Status Property */}
            <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-bncc-blue" />
                Status
              </span>
              <div className="col-span-2 sm:col-span-3">
                <select
                  value={status}
                  onChange={(e) => handleStatusSelectChange(e.target.value as CardStatus)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-bold outline-none focus:border-bncc-blue"
                >
                  <option value="TO_DO">TO DO</option>
                  <option value="ON_PROGRESS">On Progress</option>
                  <option value="ON_QC">On QC</option>
                  <option value="REVISION">Revision</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>

            {/* Division Property */}
            <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 text-xs border-t border-slate-200/80 pt-3">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Tag className="h-4 w-4 text-bncc-blue" />
                Divisi Tag
              </span>
              <div className="col-span-2 sm:col-span-3">
                <select
                  value={divisionId}
                  onChange={(e) => {
                    const newDivId = Number(e.target.value);
                    setDivisionId(newDivId);
                    handleUpdateProperty({ division_id: newDivId });
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-bncc-blue font-bold outline-none focus:border-bncc-blue"
                >
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Property */}
            <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 text-xs border-t border-slate-200/80 pt-3">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-bncc-blue" />
                Priority
              </span>
              <div className="col-span-2 sm:col-span-3">
                <select
                  value={priority}
                  onChange={(e) => {
                    const newPrio = e.target.value as CardPriority;
                    setPriority(newPrio);
                    handleUpdateProperty({ priority: newPrio });
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-bold outline-none focus:border-bncc-blue"
                >
                  <option value="LOW">LOW</option>
                  <option value="MID">MID</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            {/* Due Date Property */}
            <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 text-xs border-t border-slate-200/80 pt-3">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-bncc-blue" />
                Due Date
              </span>
              <div className="col-span-2 sm:col-span-3">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setDueDate(newDate);
                    handleUpdateProperty({ due_date: newDate || null });
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-semibold outline-none focus:border-bncc-blue"
                />
              </div>
            </div>

            {/* Assignees Manager */}
            <div className="grid grid-cols-3 sm:grid-cols-4 items-start gap-2 text-xs border-t border-slate-200/80 pt-3">
              <span className="text-slate-500 font-bold flex items-center gap-2 pt-1">
                <Users className="h-4 w-4 text-bncc-blue" />
                Assignees
              </span>
              <div className="col-span-2 sm:col-span-3 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  {card.assignees && card.assignees.length > 0 ? (
                    card.assignees.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-slate-800 border border-slate-200 text-xs font-bold shadow-sm"
                      >
                        <span className="h-5 w-5 rounded-full bg-bncc-navy flex items-center justify-center font-bold text-[10px] text-white">
                          {a.user?.name ? a.user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                        <span>{a.user?.name || 'User'}</span>
                        <button
                          onClick={() => handleRemoveAssignee(a.user_id)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                          title="Hapus assignee"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic py-1">Belum ada assignee</span>
                  )}
                </div>

                {availableAssignees.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={selectedAssigneeUserId}
                      disabled={isAssigning}
                      onChange={(e) =>
                        setSelectedAssigneeUserId(
                          e.target.value ? Number(e.target.value) : ''
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-bncc-blue"
                    >
                      <option value="">+ Tambah Assignee...</option>
                      {availableAssignees.map((m) => (
                        <option key={m.id} value={m.user_id}>
                          {m.user?.name} ({m.user?.email})
                        </option>
                      ))}
                    </select>
                    {selectedAssigneeUserId && (
                      <button
                        type="button"
                        onClick={() => handleAddAssignee(Number(selectedAssigneeUserId))}
                        disabled={isAssigning}
                        className="px-2.5 py-1 rounded-lg bg-bncc-blue hover:bg-bncc-blue-dark text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {isAssigning ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tambah'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Created At Timestamp */}
            <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 text-xs border-t border-slate-200/80 pt-3">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Dibuat Pada
              </span>
              <span className="col-span-2 sm:col-span-3 text-slate-500 font-semibold">
                {new Date(card.created_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
            <button
              onClick={() => setActiveTab('DESCRIPTION')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'DESCRIPTION'
                  ? 'border-bncc-blue text-bncc-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Deskripsi</span>
            </button>

            <button
              onClick={() => setActiveTab('ATTACHMENTS')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'ATTACHMENTS'
                  ? 'border-bncc-blue text-bncc-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Attachments ({card.attachments?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('REVISIONS')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'REVISIONS'
                  ? 'border-bncc-blue text-bncc-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Catatan Revisi ({card.revisions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('ACTIVITIES')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'ACTIVITIES'
                  ? 'border-bncc-blue text-bncc-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Activity Log ({card.activities?.length || 0})</span>
            </button>
          </div>

          {/* Tab Content Section */}
          <div className="pt-2">
            {/* TAB 1: DESCRIPTION */}
            {activeTab === 'DESCRIPTION' && (
              <div className="space-y-3">
                <textarea
                  rows={5}
                  placeholder="Tambahkan deskripsi lengkap untuk kartu ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-bncc-blue focus:ring-2 focus:ring-bncc-blue/20"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveDescription}
                    disabled={isSavingDesc}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-bncc-blue hover:bg-bncc-blue-dark text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isSavingDesc && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Simpan Deskripsi</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ATTACHMENTS */}
            {activeTab === 'ATTACHMENTS' && (
              <div className="space-y-4">
                {/* Form "+ Tambah Link URL" */}
                <form
                  onSubmit={handleAddAttachmentSubmit}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-bncc-blue flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Link Attachment Baru
                  </h4>

                  {attachmentError && (
                    <p className="text-xs text-red-600 font-medium">{attachmentError}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Judul Link (misal: Figma Specs / Doc)"
                      value={attachmentTitle}
                      disabled={isAddingAttachment}
                      onChange={(e) => setAttachmentTitle(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-bncc-blue"
                    />

                    <input
                      type="text"
                      placeholder="URL (https://...)"
                      value={attachmentUrl}
                      disabled={isAddingAttachment}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-bncc-blue"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingAttachment}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-bncc-blue hover:bg-bncc-blue-dark text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {isAddingAttachment ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      <span>Tambah Link</span>
                    </button>
                  </div>
                </form>

                {/* Attachments List */}
                {!card.attachments || card.attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Belum ada attachment link pada kartu ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {card.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="p-2 rounded-lg bg-blue-50 text-bncc-blue shrink-0">
                            <Link2 className="h-4 w-4" />
                          </span>
                          <div className="overflow-hidden">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-slate-900 hover:text-bncc-blue flex items-center gap-1.5 truncate"
                            >
                              <span>{att.title}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                            </a>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {att.url}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          title="Hapus link attachment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CATATAN REVISI */}
            {activeTab === 'REVISIONS' && (
              <div className="space-y-3">
                {!card.revisions || card.revisions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Belum ada riwayat catatan revisi.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {card.revisions.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                            <span className="font-bold text-red-900">
                              {rev.user?.name || 'Reviewer'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            {new Date(rev.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed pl-8 font-medium">
                          "{rev.note}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ACTIVITY LOG */}
            {activeTab === 'ACTIVITIES' && (
              <div className="space-y-3">
                {!card.activities || card.activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Belum ada riwayat aktivitas log.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {card.activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white"
                      >
                        <div className="h-7 w-7 rounded-full bg-bncc-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {act.user?.name ? act.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">
                              {act.user?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {new Date(act.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5 font-medium">{act.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
