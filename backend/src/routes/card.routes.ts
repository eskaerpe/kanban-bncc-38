import { Router } from 'express';
import {
  updateCard,
  moveCard,
  deleteCard,
  addAssignee,
  removeAssignee,
} from '../controllers/card.controller';
import { getCardActivities } from '../controllers/activity.controller';
import { addAttachment } from '../controllers/attachment.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.put('/:id', updateCard);
router.patch('/:id/move', moveCard);
router.delete('/:id', deleteCard);

router.post('/:id/assignees', addAssignee);
router.delete('/:id/assignees/:userId', removeAssignee);

router.post('/:id/attachments', addAttachment);
router.get('/:id/activities', getCardActivities);

export default router;
