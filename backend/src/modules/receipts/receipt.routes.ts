import { Router } from 'express';
import { ReceiptController } from './receipt.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, ReceiptController.getReceipts);
router.get('/:id', authenticate, ReceiptController.getReceiptById);
router.post('/', authenticate, ReceiptController.createReceipt);
router.post('/:id/validate', authenticate, ReceiptController.validateReceipt);

export default router;
