import { BoardMember, BoardRole, Card, GlobalRole } from '@prisma/client';

export type MemberLike = Pick<BoardMember, 'role' | 'division_id'> | null | undefined;

export interface UserContextLike {
  id?: number;
  global_role?: GlobalRole;
  roles?: string[];
  divisions?: string[];
  is_super_admin?: boolean;
}

export type CardLikeForQc = Pick<Card, 'division_id'> & {
  assignees?: Array<{ user_id: number }>;
};

/**
 * Checks whether user has Super Admin authority (either via legacy GLOBAL_ADMIN or multi-role SUPER_ADMIN)
 */
export const isSuperAdmin = (
  userOrRole: UserContextLike | GlobalRole | undefined
): boolean => {
  if (!userOrRole) return false;
  if (typeof userOrRole === 'string') {
    return userOrRole === GlobalRole.GLOBAL_ADMIN;
  }
  return !!(
    userOrRole.is_super_admin ||
    userOrRole.global_role === GlobalRole.GLOBAL_ADMIN ||
    userOrRole.roles?.includes('SUPER_ADMIN')
  );
};

export const isGlobalAdmin = (globalRole: GlobalRole | undefined): boolean =>
  globalRole === GlobalRole.GLOBAL_ADMIN;

export const isBoardAdmin = (member: MemberLike): boolean =>
  member?.role === BoardRole.BOARD_ADMIN;

export const isKoorOfDivision = (member: MemberLike, divisionId: number): boolean =>
  member?.role === BoardRole.KOOR_DIVISION && member.division_id === divisionId;

export const canManageBoard = (
  member: MemberLike,
  userOrRole: UserContextLike | GlobalRole | undefined
): boolean => isSuperAdmin(userOrRole) || isBoardAdmin(member);

/**
 * Gatekeeper for QC Decision (ON_QC -> DONE or ON_QC -> REVISION).
 * Enforces Anti Self-Approval: Assignee cannot approve/reject their own card (unless Super Admin).
 */
export const canApproveQc = (
  member: MemberLike,
  userOrRole: UserContextLike | GlobalRole | undefined,
  card: CardLikeForQc,
  reviewerUserId?: number
): boolean => {
  const superAdmin = isSuperAdmin(userOrRole);
  const actualUserId =
    reviewerUserId ??
    (typeof userOrRole === 'object' ? userOrRole.id : undefined);

  // Anti Self-Approval Gate:
  // An assignee cannot review/approve/reject their own card!
  if (
    actualUserId &&
    card.assignees &&
    card.assignees.some((a) => a.user_id === actualUserId) &&
    !superAdmin
  ) {
    return false;
  }

  return (
    superAdmin ||
    isBoardAdmin(member) ||
    isKoorOfDivision(member, card.division_id)
  );
};

export const canAccessBoard = (
  member: MemberLike,
  userOrRole: UserContextLike | GlobalRole | undefined
): boolean => isSuperAdmin(userOrRole) || !!member;
