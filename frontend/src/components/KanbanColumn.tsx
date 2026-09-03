import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Card, CardStatus } from '../api/card';
import { CardItem } from './CardItem';

interface KanbanColumnProps {
  status: CardStatus;
  title: string;
  cards: Card[];
  colorAccent: string;
  badgeBg: string;
  onAddCardClick?: () => void;
  onCardClick?: (card: Card) => void;
}

export function KanbanColumn({
  status,
  title,
  cards,
  colorAccent,
  badgeBg,
  onAddCardClick,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'Column', status },
  });

  const cardIds = React.useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-slate-900/40 p-4 transition-colors duration-200 border-t-2 ${colorAccent} ${
        isOver
          ? 'border-indigo-500/80 bg-indigo-950/20 ring-1 ring-indigo-500/30'
          : 'border-slate-800/90'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${badgeBg}`}>
            {cards.length}
          </span>
        </div>

        {onAddCardClick && (
          <button
            onClick={onAddCardClick}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tambah kartu di kolom ini"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Column Cards Container */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[150px]">
          {cards.length === 0 ? (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 p-4 text-center">
              <span className="text-xs text-slate-500 font-medium">Kosong</span>
              <span className="text-[10px] text-slate-600 mt-0.5">Tarik kartu ke sini</span>
            </div>
          ) : (
            cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onClick={() => onCardClick?.(card)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
