import { BoardMember, BoardRole, Card, GlobalRole } from '@prisma/client';

type MemberLike = Pick<BoardMember, 'role' | 'division_id'> | null | undefined;

export const isGlobalAdmin = (globalRole: GlobalRole | undefined): boolean =>
  globalRole === GlobalRole.GLOBAL_ADMIN;

export const isBoardAdmin = (member: MemberLike): boolean =>
  member?.role === BoardRole.BOARD_ADMIN;

export const isKoorOfDivision = (member: MemberLike, divisionId: number): boolean =>
  member?.role === BoardRole.KOOR_DIVISION && member.division_id === divisionId;

export const canManageBoard = (member: MemberLike, globalRole: GlobalRole | undefined): boolean =>
  isGlobalAdmin(globalRole) || isBoardAdmin(member);

export const canApproveQc = (
  member: MemberLike,
  globalRole: GlobalRole | undefined,
  card: Pick<Card, 'division_id'>,
): boolean =>
  isGlobalAdmin(globalRole) || isBoardAdmin(member) || isKoorOfDivision(member, card.division_id);

export const canAccessBoard = (
  member: MemberLike,
  globalRole: GlobalRole | undefined,
): boolean => isGlobalAdmin(globalRole) || !!member;
