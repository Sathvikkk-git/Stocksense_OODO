import { Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { InventoryService } from '../../services/inventory.service';
import { DocStatus } from '@prisma/client';

export class TransferController {
  static async getTransfers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status as DocStatus;

      const transfers = await prisma.transfer.findMany({
        where: whereClause,
        include: {
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: transfers });
    } catch (error) {
      next(error);
    }
  }

  static async getTransferById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      });

      if (!transfer) throw new AppError('Transfer not found', 404);
      res.status(200).json({ success: true, data: transfer });
    } catch (error) {
      next(error);
    }
  }

  static async createTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sourceLocationId, destinationLocationId, items } = req.body;
      const userId = req.user!.id;

      if (!sourceLocationId || !destinationLocationId || !items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('sourceLocationId, destinationLocationId, and at least one item are required.', 400);
      }

      if (sourceLocationId === destinationLocationId) {
        throw new AppError('Source and destination locations must be different.', 400);
      }

      const count = await prisma.transfer.count();
      const referenceNumber = `TRN-${String(count + 1).padStart(5, '0')}`;

      const transfer = await prisma.transfer.create({
        data: {
          referenceNumber,
          sourceLocationId,
          destinationLocationId,
          status: DocStatus.DRAFT,
          createdById: userId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
            })),
          },
        },
        include: {
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          items: { include: { product: true } },
        },
      });

      res.status(201).json({ success: true, data: transfer });
    } catch (error) {
      next(error);
    }
  }

  static async validateTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const validatedTransfer = await InventoryService.validateTransfer(id, userId);

      res.status(200).json({
        success: true,
        message: 'Internal transfer validated and stock moved successfully.',
        data: validatedTransfer,
      });
    } catch (error) {
      next(error);
    }
  }
}
