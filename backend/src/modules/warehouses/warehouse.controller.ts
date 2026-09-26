import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class WarehouseController {
  // Get warehouses with locations and inventory counts
  static async getWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouses = await prisma.warehouse.findMany({
        include: {
          locations: {
            include: {
              _count: { select: { inventory: true } },
            },
          },
        },
        orderBy: { code: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: warehouses,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create warehouse
  static async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, address } = req.body;

      if (!code || !name) {
        throw new AppError('Warehouse code and name are required.', 400);
      }

      const existingCode = await prisma.warehouse.findUnique({ where: { code } });
      if (existingCode) {
        throw new AppError(`Warehouse code '${code}' already exists.`, 400);
      }

      const warehouse = await prisma.warehouse.create({
        data: { code, name, address },
      });

      res.status(201).json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get locations (optionally filtered by warehouseId)
  static async getLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId } = req.query;

      const locations = await prisma.location.findMany({
        where: {
          ...(warehouseId && { warehouseId: String(warehouseId) }),
        },
        include: {
          warehouse: true,
          _count: { select: { inventory: true } },
        },
        orderBy: { code: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create location inside warehouse
  static async createLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId, code, name, type } = req.body;

      if (!warehouseId || !code || !name) {
        throw new AppError('warehouseId, code, and name are required for a location.', 400);
      }

      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) {
        throw new AppError('Selected warehouse does not exist.', 404);
      }

      const existingCode = await prisma.location.findUnique({
        where: { warehouseId_code: { warehouseId, code } },
      });

      if (existingCode) {
        throw new AppError(`Location code '${code}' already exists in this warehouse.`, 400);
      }

      const location = await prisma.location.create({
        data: {
          warehouseId,
          code,
          name,
          type: type || 'RACK',
        },
        include: { warehouse: true },
      });

      res.status(201).json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }
}
