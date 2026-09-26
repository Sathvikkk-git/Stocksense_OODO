import { Router } from 'express';
import { WarehouseController } from './warehouse.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Warehouses
router.get('/', WarehouseController.getWarehouses);
router.post('/', authenticate, WarehouseController.createWarehouse);

// Locations
router.get('/locations', WarehouseController.getLocations);
router.post('/locations', authenticate, WarehouseController.createLocation);

export default router;
