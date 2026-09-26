import { Router } from 'express';
import { TransferController } from './transfer.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, TransferController.getTransfers);
router.get('/:id', authenticate, TransferController.getTransferById);
router.post('/', authenticate, TransferController.createTransfer);
router.post('/:id/validate', authenticate, TransferController.validateTransfer);

export default router;
