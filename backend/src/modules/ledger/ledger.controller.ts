import { Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { OperationType } from '@prisma/client';

export class LedgerController {
  static async getLedger(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId, locationId, operationType, search } = req.query;

      const whereClause: any = {};
      if (productId) whereClause.productId = String(productId);
      if (locationId) whereClause.locationId = String(locationId);
      if (operationType) whereClause.operationType = operationType as OperationType;

      if (search) {
        whereClause.OR = [
          { referenceNumber: { contains: String(search), mode: 'insensitive' } },
          { product: { name: { contains: String(search), mode: 'insensitive' } } },
          { product: { sku: { contains: String(search), mode: 'insensitive' } } },
        ];
      }

      const ledgerEntries = await prisma.stockLedger.findMany({
        where: whereClause,
        include: {
          product: { select: { id: true, name: true, sku: true, uom: true } },
          location: { include: { warehouse: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: ledgerEntries });
    } catch (error) {
      next(error);
    }
  }
}
