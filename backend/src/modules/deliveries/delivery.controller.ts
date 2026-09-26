import { Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { InventoryService } from '../../services/inventory.service';
import { DocStatus } from '@prisma/client';

export class DeliveryController {
  static async getDeliveries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, locationId } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status as DocStatus;
      if (locationId) whereClause.locationId = String(locationId);

      const deliveries = await prisma.delivery.findMany({
        where: whereClause,
        include: {
          location: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: deliveries });
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const delivery = await prisma.delivery.findUnique({
        where: { id },
        include: {
          location: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      });

      if (!delivery) throw new AppError('Delivery order not found', 404);
      res.status(200).json({ success: true, data: delivery });
    } catch (error) {
      next(error);
    }
  }

  static async createDelivery(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { locationId, customerName, items } = req.body;
      const userId = req.user!.id;

      if (!locationId || !items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('locationId and at least one item are required.', 400);
      }

      const count = await prisma.delivery.count();
      const referenceNumber = `DEL-${String(count + 1).padStart(5, '0')}`;

      const delivery = await prisma.delivery.create({
        data: {
          referenceNumber,
          locationId,
          customerName,
          status: DocStatus.DRAFT,
          createdById: userId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              requestedQty: Number(item.requestedQty || item.quantity),
              deliveredQty: Number(item.deliveredQty || item.requestedQty || item.quantity),
            })),
          },
        },
        include: {
          location: { include: { warehouse: true } },
          items: { include: { product: true } },
        },
      });

      res.status(201).json({ success: true, data: delivery });
    } catch (error) {
      next(error);
    }
  }

  static async validateDelivery(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const validatedDelivery = await InventoryService.validateDelivery(id, userId);

      res.status(200).json({
        success: true,
        message: 'Delivery order validated and stock decreased successfully.',
        data: validatedDelivery,
      });
    } catch (error) {
      next(error);
    }
  }
}
