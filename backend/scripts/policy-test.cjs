const assert = require('node:assert/strict');
const { CardStatus, BoardRole, GlobalRole } = require('@prisma/client');
const workflow = require('../dist/policies/workflow.policy');
const auth = require('../dist/policies/authorization.policy');

// 1. Workflow transitions
assert.equal(workflow.isAllowedCardTransition(CardStatus.TO_DO, CardStatus.ON_PROGRESS), true);
assert.equal(workflow.isAllowedCardTransition(CardStatus.ON_PROGRESS, CardStatus.ON_QC), true);
assert.equal(workflow.isAllowedCardTransition(CardStatus.ON_QC, CardStatus.DONE), true);
assert.equal(workflow.isAllowedCardTransition(CardStatus.DONE, CardStatus.ON_PROGRESS), false);
assert.equal(workflow.isAllowedCardTransition(CardStatus.TO_DO, CardStatus.DONE), false);
assert.equal(workflow.hasValidRevisionNote('needs fix'), true);
assert.equal(workflow.hasValidRevisionNote('no'), false);

// 2. Member and role authorization
const card = { division_id: 7, assignees: [] };
const admin = { role: BoardRole.BOARD_ADMIN, division_id: null };
const koor = { role: BoardRole.KOOR_DIVISION, division_id: 7 };
const otherKoor = { role: BoardRole.KOOR_DIVISION, division_id: 8 };
const staff = { role: BoardRole.STAFF, division_id: 7 };

assert.equal(auth.canApproveQc(admin, GlobalRole.USER, card), true);
assert.equal(auth.canApproveQc(koor, GlobalRole.USER, card), true);
assert.equal(auth.canApproveQc(otherKoor, GlobalRole.USER, card), false);
assert.equal(auth.canApproveQc(staff, GlobalRole.USER, card), false);
assert.equal(auth.canApproveQc(staff, GlobalRole.GLOBAL_ADMIN, card), true);

// 3. Executive / Super Admin multi-role authorization
const superAdminUser = { id: 1, roles: ['SUPER_ADMIN', 'STAFF'], global_role: GlobalRole.GLOBAL_ADMIN, is_super_admin: true };
const cooUser = { id: 2, roles: ['COO', 'STAFF'], global_role: GlobalRole.GLOBAL_ADMIN, is_super_admin: true };
const cfoUser = { id: 3, roles: ['CFO', 'STAFF'], global_role: GlobalRole.GLOBAL_ADMIN, is_super_admin: true };
const staffUser = { id: 4, roles: ['STAFF'], global_role: GlobalRole.USER, is_super_admin: false };

assert.equal(auth.isSuperAdmin(superAdminUser), true);
assert.equal(auth.isSuperAdmin(cooUser), true);
assert.equal(auth.isSuperAdmin(cfoUser), true);
assert.equal(auth.isSuperAdmin(staffUser), false);

assert.equal(auth.canAccessBoard(null, superAdminUser), true);
assert.equal(auth.canAccessBoard(null, cooUser), true);
assert.equal(auth.canAccessBoard(null, cfoUser), true);
assert.equal(auth.canAccessBoard(null, staffUser), false);

// 4. Anti-Self-Approval Enforcement
const selfAssignedCard = { division_id: 7, assignees: [{ user_id: 10 }] };
const reviewerKoorMember = { role: BoardRole.KOOR_DIVISION, division_id: 7 };
const reviewerKoorUser = { id: 10, roles: ['KOOR_DIVISION', 'STAFF'], global_role: GlobalRole.USER };

// Assignee cannot approve their own card even if they are KOOR on that board
assert.equal(auth.canApproveQc(reviewerKoorMember, reviewerKoorUser, selfAssignedCard, 10), false);

// Super Admin / COO / CFO bypass anti-self-approval
const execReviewerUser = { id: 10, roles: ['COO', 'STAFF'], is_super_admin: true };
assert.equal(auth.canApproveQc(reviewerKoorMember, execReviewerUser, selfAssignedCard, 10), true);

console.log('All policy tests passed successfully!');
