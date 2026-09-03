import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Calendar, Tag } from 'lucide-react';
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
      'bg-bncc-blue text-white',
      'bg-bncc-navy text-white',
      'bg-slate-700 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-purple-600 text-white',
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
      className={`group relative flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:border-bncc-blue hover:shadow-md ${
        isDragging
          ? 'ring-2 ring-bncc-blue shadow-xl z-50 cursor-grabbing'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Top Badges Row: Division Tag & Priority */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Division Tag Badge */}
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Tag className="h-3 w-3 text-bncc-blue" />
          <span className="line-clamp-1">{card.division?.name || 'Tanpa Divisi'}</span>
        </span>

        {/* Priority Badge */}
        <PriorityBadge priority={card.priority} />
      </div>

      {/* Card Title */}
      <h4 className="text-xs font-bold text-slate-900 group-hover:text-bncc-blue transition-colors leading-snug">
        {card.title}
      </h4>

      {/* Description Snippet (Optional) */}
      {card.description && (
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Bottom Meta Row: Due Date & Assignees */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-0.5">
        {/* Due Date or Overdue Badge */}
        {card.due_date ? (
          isOverdue ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200"
              title={`Jatuh tempo pada ${card.due_date}`}
            >
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span>Terlambat: {formattedDueDate}</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500"
              title={`Jatuh tempo: ${card.due_date}`}
            >
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>{formattedDueDate}</span>
            </span>
          )
        ) : (
          <span className="text-[11px] text-slate-400 italic">Tanpa tenggat</span>
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
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-white border border-slate-200 ${getAvatarBg(
                    name
                  )}`}
                >
                  {initial}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Unassigned</span>
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
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          HIGH
        </span>
      );
    case 'MID':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          MID
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          LOW
        </span>
      );
  }
}
