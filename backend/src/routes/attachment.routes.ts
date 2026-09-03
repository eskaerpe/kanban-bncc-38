import { Router } from 'express';
import { addAttachment, deleteAttachment } from '../controllers/attachment.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/cards/:id/attachments', addAttachment);
router.delete('/attachments/:id', deleteAttachment);

export default router;
