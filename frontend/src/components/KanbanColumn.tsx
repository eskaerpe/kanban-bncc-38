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
      className={`flex flex-col rounded-lg border bg-slate-100/70 p-3.5 transition-colors duration-200 border-t-4 ${colorAccent} ${
        isOver
          ? 'border-bncc-blue bg-blue-50/60 ring-2 ring-bncc-blue/20'
          : 'border-slate-200'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${badgeBg}`}>
            {cards.length}
          </span>
        </div>

        {onAddCardClick && (
          <button
            onClick={onAddCardClick}
            className="p-1 rounded text-slate-400 hover:text-bncc-blue hover:bg-slate-200/80 transition-colors"
            title="Tambah kartu di kolom ini"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Column Cards Container */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2.5 min-h-[150px]">
          {cards.length === 0 ? (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/50 p-4 text-center">
              <span className="text-xs text-slate-400 font-medium">Kosong</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Tarik kartu ke sini</span>
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
