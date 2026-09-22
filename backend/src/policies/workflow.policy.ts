import { CardStatus } from '@prisma/client';

export const REVISION_NOTE_MIN_LENGTH = 5;

/**
 * Business workflow for a card. Reordering within a column is represented by
 * a same-status transition and remains allowed.
 */
const ALLOWED_TRANSITIONS: Record<CardStatus, readonly CardStatus[]> = {
  [CardStatus.TO_DO]: [CardStatus.TO_DO, CardStatus.ON_PROGRESS],
  [CardStatus.ON_PROGRESS]: [CardStatus.ON_PROGRESS, CardStatus.TO_DO, CardStatus.ON_QC],
  [CardStatus.ON_QC]: [CardStatus.ON_QC, CardStatus.REVISION, CardStatus.DONE],
  [CardStatus.REVISION]: [CardStatus.REVISION, CardStatus.ON_PROGRESS],
  [CardStatus.DONE]: [CardStatus.DONE],
};

export const isAllowedCardTransition = (from: CardStatus, to: CardStatus): boolean =>
  ALLOWED_TRANSITIONS[from].includes(to);

export const requiresRevisionNote = (to: CardStatus): boolean => to === CardStatus.REVISION;

export const hasValidRevisionNote = (note: unknown): note is string =>
  typeof note === 'string' && note.trim().length >= REVISION_NOTE_MIN_LENGTH;

export const isQcDecision = (from: CardStatus, to: CardStatus): boolean =>
  from === CardStatus.ON_QC && (to === CardStatus.DONE || to === CardStatus.REVISION);

export const workflowTransitionError = (from: CardStatus, to: CardStatus): string =>
  `Invalid card workflow transition: ${from} -> ${to}`;
