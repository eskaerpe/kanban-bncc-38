const assert = require('node:assert/strict');
const { CardStatus } = require('@prisma/client');
const workflow = require('../dist/policies/workflow.policy');
const auth = require('../dist/policies/authorization.policy');

const { BoardRole, GlobalRole } = require('@prisma/client');

assert.equal(workflow.isAllowedCardTransition(CardStatus.TO_DO, CardStatus.ON_PROGRESS), true);
assert.equal(workflow.isAllowedCardTransition(CardStatus.ON_PROGRESS, CardStatus.ON_QC), true);
assert.equal(workflow.isAllowedCardTransition(CardStatus.ON_QC, CardStatus.DONE), true);
assert.equal(workflow.isAllowedCardTransition(CardStatus.DONE, CardStatus.ON_PROGRESS), false);
assert.equal(workflow.isAllowedCardTransition(CardStatus.TO_DO, CardStatus.DONE), false);
assert.equal(workflow.hasValidRevisionNote('needs fix'), true);
assert.equal(workflow.hasValidRevisionNote('no'), false);

const card = { division_id: 7 };
const admin = { role: BoardRole.BOARD_ADMIN, division_id: null };
const koor = { role: BoardRole.KOOR_DIVISION, division_id: 7 };
const otherKoor = { role: BoardRole.KOOR_DIVISION, division_id: 8 };
const staff = { role: BoardRole.STAFF, division_id: 7 };
assert.equal(auth.canApproveQc(admin, GlobalRole.USER, card), true);
assert.equal(auth.canApproveQc(koor, GlobalRole.USER, card), true);
assert.equal(auth.canApproveQc(otherKoor, GlobalRole.USER, card), false);
assert.equal(auth.canApproveQc(staff, GlobalRole.USER, card), false);
assert.equal(auth.canApproveQc(staff, GlobalRole.GLOBAL_ADMIN, card), true);

console.log('Policy tests passed');
