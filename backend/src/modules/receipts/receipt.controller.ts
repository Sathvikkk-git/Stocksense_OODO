import { Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { InventoryService } from '../../services/inventory.service';
import { DocStatus } from '@prisma/client';

export class ReceiptController {
  static async getReceipts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, warehouseId, locationId } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status as DocStatus;
      if (locationId) whereClause.locationId = String(locationId);
      if (warehouseId) whereClause.location = { warehouseId: String(warehouseId) };

      const receipts = await prisma.receipt.findMany({
        where: whereClause,
        include: {
          supplier: true,
          location: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: receipts });
    } catch (error) {
      next(error);
    }
  }

  static async getReceiptById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const receipt = await prisma.receipt.findUnique({
        where: { id },
        include: {
          supplier: true,
          location: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      });

      if (!receipt) throw new AppError('Receipt not found', 404);
      res.status(200).json({ success: true, data: receipt });
    } catch (error) {
      next(error);
    }
  }

  static async createReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { supplierId, locationId, items } = req.body;
      const userId = req.user!.id;

      if (!locationId || !items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('locationId and at least one item are required.', 400);
      }

      // Generate reference number
      const count = await prisma.receipt.count();
      const referenceNumber = `REC-${String(count + 1).padStart(5, '0')}`;

      const receipt = await prisma.receipt.create({
        data: {
          referenceNumber,
          supplierId: supplierId || null,
          locationId,
          status: DocStatus.DRAFT,
          createdById: userId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              expectedQty: Number(item.expectedQty || item.quantity),
              receivedQty: Number(item.receivedQty || item.expectedQty || item.quantity),
            })),
          },
        },
        include: {
          supplier: true,
          location: { include: { warehouse: true } },
          items: { include: { product: true } },
        },
      });

      res.status(201).json({ success: true, data: receipt });
    } catch (error) {
      next(error);
    }
  }

  static async validateReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const validatedReceipt = await InventoryService.validateReceipt(id, userId);

      res.status(200).json({
        success: true,
        message: 'Receipt validated and stock updated successfully.',
        data: validatedReceipt,
      });
    } catch (error) {
      next(error);
    }
  }
}
