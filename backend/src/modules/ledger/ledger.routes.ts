import { Router } from 'express';
import { LedgerController } from './ledger.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, LedgerController.getLedger);

export default router;
