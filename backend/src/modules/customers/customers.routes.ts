// src/modules/customers/customers.routes.ts
import { Router } from 'express';
import { customersController } from './customers.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('ADMIN', 'SALES', 'ACCOUNTS'), customersController.list);
router.get('/:id', requireRoles('ADMIN', 'SALES', 'ACCOUNTS'), customersController.getById);
router.post('/', requireRoles('ADMIN', 'SALES'), customersController.create);
router.put('/:id', requireRoles('ADMIN', 'SALES'), customersController.update);
router.post('/:id/follow-ups', requireRoles('ADMIN', 'SALES'), customersController.addFollowUp);
router.get('/:id/follow-ups', requireRoles('ADMIN', 'SALES', 'ACCOUNTS'), customersController.getFollowUps);

export default router;
