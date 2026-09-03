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
import { validate } from '../middlewares/validate.middleware';
import {
  updateCardSchema,
  moveCardSchema,
  addAssigneeSchema,
} from '../schemas/validation.schemas';

const router = Router();

router.use(authenticateJWT);

router.put('/:id', validate(updateCardSchema), updateCard);
router.patch('/:id/move', validate(moveCardSchema), moveCard);
router.delete('/:id', deleteCard);

router.post('/:id/assignees', validate(addAssigneeSchema), addAssignee);
router.delete('/:id/assignees/:userId', removeAssignee);

router.post('/:id/attachments', addAttachment);
router.get('/:id/activities', getCardActivities);

export default router;
