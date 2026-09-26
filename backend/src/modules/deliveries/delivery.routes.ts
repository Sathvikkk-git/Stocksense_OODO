import { Router } from 'express';
import { DeliveryController } from './delivery.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, DeliveryController.getDeliveries);
router.get('/:id', authenticate, DeliveryController.getDeliveryById);
router.post('/', authenticate, DeliveryController.createDelivery);
router.post('/:id/validate', authenticate, DeliveryController.validateDelivery);

export default router;
