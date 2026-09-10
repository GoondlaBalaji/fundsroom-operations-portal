// src/modules/inventory/inventory.routes.ts
import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/low-stock', inventoryController.getLowStock);
router.get('/movements', inventoryController.listMovements);
router.post('/movements', requireRoles('ADMIN', 'WAREHOUSE'), inventoryController.createInMovement);

export default router;
