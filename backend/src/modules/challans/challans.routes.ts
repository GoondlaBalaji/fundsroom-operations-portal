// src/modules/challans/challans.routes.ts
import { Router } from 'express';
import { challansController } from './challans.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', challansController.list);
router.get('/:id', challansController.getById);
router.post('/', requireRoles('ADMIN', 'SALES'), challansController.create);
router.post('/:id/confirm', requireRoles('ADMIN', 'SALES', 'WAREHOUSE'), challansController.confirm);
router.post('/:id/cancel', requireRoles('ADMIN', 'SALES'), challansController.cancel);

export default router;
