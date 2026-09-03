import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Calendar, Clock, Tag } from 'lucide-react';
import { Card, CardPriority } from '../api/card';

interface CardItemProps {
  card: Card;
  onClick?: () => void;
}

export function CardItem({ card, onClick }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { card },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Due Date calculation & overdue check
  const isOverdue = React.useMemo(() => {
    if (!card.due_date || card.status === 'DONE') return false;
    const due = new Date(card.due_date);
    const today = new Date();
    // Compare dates (ignore exact time)
    due.setHours(23, 59, 59, 999);
    return due.getTime() < today.getTime();
  }, [card.due_date, card.status]);

  const formattedDueDate = React.useMemo(() => {
    if (!card.due_date) return null;
    try {
      const d = new Date(card.due_date);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return card.due_date;
    }
  }, [card.due_date]);

  // Color generator for assignee avatar fallback
  const getAvatarBg = (name: string) => {
    const bgColors = [
      'bg-indigo-600 border-indigo-400',
      'bg-violet-600 border-violet-400',
      'bg-sky-600 border-sky-400',
      'bg-emerald-600 border-emerald-400',
      'bg-amber-600 border-amber-400',
      'bg-rose-600 border-rose-400',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % bgColors.length;
    return bgColors[index];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative flex flex-col gap-3 rounded-xl border border-slate-800/90 bg-slate-900/80 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-md ${
        isDragging
          ? 'ring-2 ring-indigo-500 shadow-2xl z-50 cursor-grabbing'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Top Badges Row: Division Tag & Priority */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Division Tag Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
          <Tag className="h-3 w-3 text-indigo-400" />
          <span className="line-clamp-1">{card.division?.name || 'Tanpa Divisi'}</span>
        </span>

        {/* Priority Badge */}
        <PriorityBadge priority={card.priority} />
      </div>

      {/* Card Title */}
      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors leading-snug">
        {card.title}
      </h4>

      {/* Description Snippet (Optional) */}
      {card.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Bottom Meta Row: Due Date & Assignees */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/70 mt-1">
        {/* Due Date or Overdue Badge */}
        {card.due_date ? (
          isOverdue ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse"
              title={`Jatuh tempo pada ${card.due_date}`}
            >
              <AlertCircle className="h-3 w-3" />
              <span>Terlambat: {formattedDueDate}</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"
              title={`Jatuh tempo: ${card.due_date}`}
            >
              <Calendar className="h-3 w-3 text-slate-500" />
              <span>{formattedDueDate}</span>
            </span>
          )
        ) : (
          <span className="text-[11px] text-slate-600 italic">Tanpa tenggat</span>
        )}

        {/* Multi-Assignee Avatars */}
        {card.assignees && card.assignees.length > 0 ? (
          <div className="flex -space-x-1.5 overflow-hidden">
            {card.assignees.map((a) => {
              const name = a.user?.name || 'User';
              const initial = name.charAt(0).toUpperCase();
              return (
                <div
                  key={a.id}
                  title={name}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-slate-900 border ${getAvatarBg(
                    name
                  )}`}
                >
                  {initial}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[11px] text-slate-600">Unassigned</span>
        )}
      </div>
    </div>
  );
}

// Priority Badge Helper Component
function PriorityBadge({ priority }: { priority: CardPriority }) {
  switch (priority) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          HIGH
        </span>
      );
    case 'MID':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          MID
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          LOW
        </span>
      );
  }
}
