import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// Categories
router.get('/categories', ProductController.getCategories);
router.post('/categories', authenticate, ProductController.createCategory);

// Products
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', authenticate, ProductController.createProduct);
router.patch('/:id', authenticate, ProductController.updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), ProductController.deleteProduct);

export default router;
