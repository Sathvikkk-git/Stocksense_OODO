import { Router } from 'express';
import { AdjustmentController } from './adjustment.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, AdjustmentController.getAdjustments);
router.get('/:id', authenticate, AdjustmentController.getAdjustmentById);
router.post('/', authenticate, AdjustmentController.createAdjustment);
router.post('/:id/validate', authenticate, AdjustmentController.validateAdjustment);

export default router;
