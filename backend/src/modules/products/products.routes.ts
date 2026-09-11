import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';
import { uploadProductImageMiddleware } from '../../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/categories', productsController.getCategories);
router.get('/', productsController.list);
router.get('/:id', productsController.getById);
router.post('/', requireRoles('ADMIN', 'WAREHOUSE'), productsController.create);
router.put('/:id', requireRoles('ADMIN', 'WAREHOUSE'), productsController.update);

// S3 Product Image endpoints
router.post(
  '/:id/image',
  requireRoles('ADMIN', 'WAREHOUSE'),
  uploadProductImageMiddleware,
  productsController.uploadImage
);
router.delete(
  '/:id/image',
  requireRoles('ADMIN', 'WAREHOUSE'),
  productsController.deleteImage
);

export default router;

