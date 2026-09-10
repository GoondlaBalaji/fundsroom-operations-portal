// src/modules/products/products.routes.ts
import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/categories', productsController.getCategories);
router.get('/', productsController.list);
router.get('/:id', productsController.getById);
router.post('/', requireRoles('ADMIN', 'WAREHOUSE'), productsController.create);
router.put('/:id', requireRoles('ADMIN', 'WAREHOUSE'), productsController.update);

export default router;
