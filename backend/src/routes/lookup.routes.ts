import { Router } from 'express';
import { getDivisions, getUsers } from '../controllers/lookup.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/divisions', getDivisions);
router.get('/users', getUsers);

export default router;
