import { Router } from 'express';
import {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember,
} from '../controllers/board.controller';
import { createCard, getBoardCards } from '../controllers/card.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createBoardSchema,
  updateBoardSchema,
  addBoardMemberSchema,
  createCardSchema,
} from '../schemas/validation.schemas';

const router = Router();

router.use(authenticateJWT);

router.post('/', validate(createBoardSchema), createBoard);
router.get('/', getBoards);
router.get('/:id', getBoardById);
router.put('/:id', validate(updateBoardSchema), updateBoard);
router.delete('/:id', deleteBoard);

router.post('/:id/members', validate(addBoardMemberSchema), addBoardMember);
router.delete('/:id/members/:userId', removeBoardMember);

router.post('/:boardId/cards', validate(createCardSchema), createCard);
router.get('/:boardId/cards', getBoardCards);

export default router;
