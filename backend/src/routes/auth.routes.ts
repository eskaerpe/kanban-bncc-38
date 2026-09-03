import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/validation.schemas';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticateJWT, getMe);

export default router;
