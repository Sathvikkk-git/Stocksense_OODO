import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { DocStatus, OperationType } from '@prisma/client';

export class InventoryService {
  /**
   * Validate incoming RECEIPT and atomically increase location inventory
   */
  static async validateReceipt(receiptId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id: receiptId },
        include: {
          items: { include: { product: true } },
          location: { include: { warehouse: true } },
        },
      });

      if (!receipt) {
        throw new AppError('Receipt not found', 404);
      }

      if (receipt.status === DocStatus.DONE) {
        throw new AppError('Receipt has already been validated and marked DONE.', 400);
      }

      if (receipt.status === DocStatus.CANCELED) {
        throw new AppError('Cannot validate a canceled receipt.', 400);
      }

      for (const item of receipt.items) {
        const qtyToAdd = item.receivedQty > 0 ? item.receivedQty : item.expectedQty;

        // Fetch current inventory record or prepare to create
        const currentInv = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: receipt.locationId,
            },
          },
        });

        const quantityBefore = currentInv ? currentInv.quantity : 0;
        const quantityAfter = quantityBefore + qtyToAdd;

        // Upsert inventory
        await tx.inventory.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: receipt.locationId,
            },
          },
          update: { quantity: quantityAfter },
          create: {
            productId: item.productId,
            locationId: receipt.locationId,
            quantity: quantityAfter,
          },
        });

        // Record stock ledger entry
        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            locationId: receipt.locationId,
            operationType: OperationType.RECEIPT,
            referenceNumber: receipt.referenceNumber,
            quantityBefore,
            quantityChange: qtyToAdd,
            quantityAfter,
            userId,
          },
        });
      }

      // Mark receipt as DONE
      const updatedReceipt = await tx.receipt.update({
        where: { id: receiptId },
        data: { status: DocStatus.DONE },
        include: { items: true, location: true },
      });

      return updatedReceipt;
    });
  }

  /**
   * Validate outgoing DELIVERY and atomically decrease location inventory.
   * Throws 422 HTTP error if requested stock exceeds available quantity.
   */
  static async validateDelivery(deliveryId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          items: { include: { product: true } },
          location: { include: { warehouse: true } },
        },
      });

      if (!delivery) {
        throw new AppError('Delivery order not found', 404);
      }

      if (delivery.status === DocStatus.DONE) {
        throw new AppError('Delivery order has already been validated and marked DONE.', 400);
      }

      if (delivery.status === DocStatus.CANCELED) {
        throw new AppError('Cannot validate a canceled delivery order.', 400);
      }

      // 1. Validate available stock for all items
      for (const item of delivery.items) {
        const qtyToDeliver = item.deliveredQty > 0 ? item.deliveredQty : item.requestedQty;

        const currentInv = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: delivery.locationId,
            },
          },
        });

        const available = currentInv ? currentInv.quantity : 0;

        if (available < qtyToDeliver) {
          throw new AppError(
            `Insufficient stock for product ${item.product.name} (SKU: ${item.product.sku}) at location ${delivery.location.name}.`,
            422,
            {
              productId: item.productId,
              sku: item.product.sku,
              requested: qtyToDeliver,
              available,
            }
          );
        }
      }

      // 2. Perform inventory decrease and log to ledger
      for (const item of delivery.items) {
        const qtyToDeliver = item.deliveredQty > 0 ? item.deliveredQty : item.requestedQty;

        const currentInv = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: delivery.locationId,
            },
          },
        });

        const quantityBefore = currentInv!.quantity;
        const quantityAfter = quantityBefore - qtyToDeliver;

        await tx.inventory.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: delivery.locationId,
            },
          },
          data: { quantity: quantityAfter },
        });

        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            locationId: delivery.locationId,
            operationType: OperationType.DELIVERY,
            referenceNumber: delivery.referenceNumber,
            quantityBefore,
            quantityChange: -qtyToDeliver,
            quantityAfter,
            userId,
          },
        });
      }

      // Mark delivery as DONE
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: DocStatus.DONE },
        include: { items: true, location: true },
      });

      return updatedDelivery;
    });
  }

  /**
   * Validate INTERNAL TRANSFER between two locations.
   * Source stock decreases, Destination stock increases. Total global stock remains unchanged.
   */
  static async validateTransfer(transferId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
        include: {
          items: { include: { product: true } },
          sourceLocation: true,
          destinationLocation: true,
        },
      });

      if (!transfer) {
        throw new AppError('Internal transfer not found', 404);
      }

      if (transfer.status === DocStatus.DONE) {
        throw new AppError('Transfer has already been validated and marked DONE.', 400);
      }

      if (transfer.status === DocStatus.CANCELED) {
        throw new AppError('Cannot validate a canceled transfer.', 400);
      }

      if (transfer.sourceLocationId === transfer.destinationLocationId) {
        throw new AppError('Source and destination locations must be different.', 400);
      }

      // 1. Verify stock availability at source location
      for (const item of transfer.items) {
        const sourceInv = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.sourceLocationId,
            },
          },
        });

        const available = sourceInv ? sourceInv.quantity : 0;

        if (available < item.quantity) {
          throw new AppError(
            `Insufficient stock for product ${item.product.name} (SKU: ${item.product.sku}) at source location ${transfer.sourceLocation.name}.`,
            422,
            {
              productId: item.productId,
              sku: item.product.sku,
              requested: item.quantity,
              available,
            }
          );
        }
      }

      // 2. Perform transfer (decrease source, increase destination)
      for (const item of transfer.items) {
        // Source update
        const sourceInv = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.sourceLocationId,
            },
          },
        });

        const sourceBefore = sourceInv!.quantity;
        const sourceAfter = sourceBefore - item.quantity;

        await tx.inventory.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.sourceLocationId,
            },
          },
          data: { quantity: sourceAfter },
        });

        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            locationId: transfer.sourceLocationId,
            operationType: OperationType.TRANSFER,
            referenceNumber: transfer.referenceNumber,
            quantityBefore: sourceBefore,
            quantityChange: -item.quantity,
            quantityAfter: sourceAfter,
            userId,
          },
        });

        // Destination update
        const destInv = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.destinationLocationId,
            },
          },
        });

        const destBefore = destInv ? destInv.quantity : 0;
        const destAfter = destBefore + item.quantity;

        await tx.inventory.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.destinationLocationId,
            },
          },
          update: { quantity: destAfter },
          create: {
            productId: item.productId,
            locationId: transfer.destinationLocationId,
            quantity: destAfter,
          },
        });

        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            locationId: transfer.destinationLocationId,
            operationType: OperationType.TRANSFER,
            referenceNumber: transfer.referenceNumber,
            quantityBefore: destBefore,
            quantityChange: item.quantity,
            quantityAfter: destAfter,
            userId,
          },
        });
      }

      // Mark transfer as DONE
      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: { status: DocStatus.DONE },
        include: { items: true, sourceLocation: true, destinationLocation: true },
      });

      return updatedTransfer;
    });
  }

  /**
   * Validate STOCK ADJUSTMENT (reconciliation between physical count and system quantity)
   */
  static async validateAdjustment(adjustmentId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.adjustment.findUnique({
        where: { id: adjustmentId },
        include: {
          items: { include: { product: true } },
          location: true,
        },
      });

      if (!adjustment) {
        throw new AppError('Stock adjustment not found', 404);
      }

      if (adjustment.status === DocStatus.DONE) {
        throw new AppError('Adjustment has already been validated and marked DONE.', 400);
      }

      if (adjustment.status === DocStatus.CANCELED) {
        throw new AppError('Cannot validate a canceled adjustment.', 400);
      }

      for (const item of adjustment.items) {
        const currentInv = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: adjustment.locationId,
            },
          },
        });

        const quantityBefore = currentInv ? currentInv.quantity : 0;
        const quantityAfter = item.physicalQty;
        const quantityChange = quantityAfter - quantityBefore;

        await tx.inventory.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: adjustment.locationId,
            },
          },
          update: { quantity: quantityAfter },
          create: {
            productId: item.productId,
            locationId: adjustment.locationId,
            quantity: quantityAfter,
          },
        });

        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            locationId: adjustment.locationId,
            operationType: OperationType.ADJUSTMENT,
            referenceNumber: adjustment.referenceNumber,
            quantityBefore,
            quantityChange,
            quantityAfter,
            userId,
          },
        });
      }

      // Mark adjustment as DONE
      const updatedAdjustment = await tx.adjustment.update({
        where: { id: adjustmentId },
        data: { status: DocStatus.DONE },
        include: { items: true, location: true },
      });

      return updatedAdjustment;
    });
  }
}
