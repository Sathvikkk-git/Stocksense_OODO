import { Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { InventoryService } from '../../services/inventory.service';
import { DocStatus } from '@prisma/client';

export class AdjustmentController {
  static async getAdjustments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status as DocStatus;

      const adjustments = await prisma.adjustment.findMany({
        where: whereClause,
        include: {
          location: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: adjustments });
    } catch (error) {
      next(error);
    }
  }

  static async getAdjustmentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
        include: {
          location: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      });

      if (!adjustment) throw new AppError('Stock adjustment not found', 404);
      res.status(200).json({ success: true, data: adjustment });
    } catch (error) {
      next(error);
    }
  }

  static async createAdjustment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { locationId, reason, items } = req.body;
      const userId = req.user!.id;

      if (!locationId || !items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('locationId and at least one item are required.', 400);
      }

      const count = await prisma.adjustment.count();
      const referenceNumber = `ADJ-${String(count + 1).padStart(5, '0')}`;

      // Calculate quantityDiff for each item
      const processedItems = await Promise.all(
        items.map(async (item: any) => {
          const inv = await prisma.inventory.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId,
              },
            },
          });
          const recordedQty = inv ? inv.quantity : 0;
          const physicalQty = Number(item.physicalQty);
          const quantityDiff = physicalQty - recordedQty;

          return {
            productId: item.productId,
            recordedQty,
            physicalQty,
            quantityDiff,
          };
        })
      );

      const adjustment = await prisma.adjustment.create({
        data: {
          referenceNumber,
          locationId,
          reason: reason || 'Physical inventory audit reconciliation',
          status: DocStatus.DRAFT,
          createdById: userId,
          items: {
            create: processedItems,
          },
        },
        include: {
          location: { include: { warehouse: true } },
          items: { include: { product: true } },
        },
      });

      res.status(201).json({ success: true, data: adjustment });
    } catch (error) {
      next(error);
    }
  }

  static async validateAdjustment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const validatedAdjustment = await InventoryService.validateAdjustment(id, userId);

      res.status(200).json({
        success: true,
        message: 'Stock adjustment validated and reconciled successfully.',
        data: validatedAdjustment,
      });
    } catch (error) {
      next(error);
    }
  }
}
