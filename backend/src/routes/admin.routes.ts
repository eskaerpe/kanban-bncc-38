import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/authorization.middleware';
import {
  assignDivisions,
  assignRoles,
  listAuthorizationMasters,
} from '../controllers/admin-authorization.controller';

const router = Router();
router.use(authenticateJWT, requireSuperAdmin);
router.get('/authorization-masters', listAuthorizationMasters);
router.put('/users/:id/roles', assignRoles);
router.put('/users/:id/divisions', assignDivisions);

export default router;
