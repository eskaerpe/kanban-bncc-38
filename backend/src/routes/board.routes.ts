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

const router = Router();

router.use(authenticateJWT);

router.post('/', createBoard);
router.get('/', getBoards);
router.get('/:id', getBoardById);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);

router.post('/:id/members', addBoardMember);
router.delete('/:id/members/:userId', removeBoardMember);

router.post('/:boardId/cards', createCard);
router.get('/:boardId/cards', getBoardCards);

export default router;
