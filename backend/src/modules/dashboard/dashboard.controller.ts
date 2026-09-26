import { Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { DocStatus } from '@prisma/client';

export class DashboardController {
  static async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // 1. Fetch all products with inventory
      const products = await prisma.product.findMany({
        include: { inventory: true },
      });

      let totalProductsInStock = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      for (const p of products) {
        const stock = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        if (stock > 0) totalProductsInStock++;
        if (stock === 0) outOfStockCount++;
        else if (stock <= p.minStockLevel) lowStockCount++;
      }

      // 2. Operational document counts
      const pendingReceipts = await prisma.receipt.count({
        where: { status: { in: [DocStatus.DRAFT, DocStatus.WAITING, DocStatus.READY] } },
      });

      const pendingDeliveries = await prisma.delivery.count({
        where: { status: { in: [DocStatus.DRAFT, DocStatus.WAITING, DocStatus.READY] } },
      });

      const scheduledTransfers = await prisma.transfer.count({
        where: { status: { in: [DocStatus.DRAFT, DocStatus.WAITING, DocStatus.READY] } },
      });

      // 3. Recent 5 ledger movements
      const recentMovements = await prisma.stockLedger.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true, uom: true } },
          location: { select: { name: true, warehouse: { select: { name: true } } } },
          user: { select: { name: true } },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          totalProducts: products.length,
          totalProductsInStock,
          lowStockCount,
          outOfStockCount,
          pendingReceipts,
          pendingDeliveries,
          scheduledTransfers,
          recentMovements,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
