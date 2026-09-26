import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class ProductController {
  // Get all products with location stock & search/category filters
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, categoryId, status } = req.query;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { sku: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        whereClause.categoryId = String(categoryId);
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          inventory: {
            include: {
              location: {
                include: { warehouse: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Calculate total stock and low-stock flag for each product
      const formattedProducts = products.map((p) => {
        const totalStock = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        let stockStatus = 'NORMAL';
        if (totalStock === 0) {
          stockStatus = 'OUT_OF_STOCK';
        } else if (totalStock <= p.minStockLevel) {
          stockStatus = 'LOW_STOCK';
        }

        return {
          ...p,
          totalStock,
          stockStatus,
        };
      });

      // Optional status filter (LOW_STOCK / OUT_OF_STOCK / NORMAL)
      let finalProducts = formattedProducts;
      if (status) {
        finalProducts = formattedProducts.filter((p) => p.stockStatus === String(status));
      }

      res.status(200).json({
        success: true,
        data: finalProducts,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product details
  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          inventory: {
            include: {
              location: {
                include: { warehouse: true },
              },
            },
          },
          reorderRules: { include: { warehouse: true } },
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);

      res.status(200).json({
        success: true,
        data: {
          ...product,
          totalStock,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Create product
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, sku, categoryId, uom, description, minStockLevel, initialStock, locationId } = req.body;

      if (!name || !sku || !categoryId) {
        throw new AppError('Name, SKU, and categoryId are required.', 400);
      }

      // Validate SKU uniqueness
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        throw new AppError(`SKU '${sku}' already exists. SKU must be unique.`, 400);
      }

      const product = await prisma.product.create({
        data: {
          name,
          sku,
          categoryId,
          uom: uom || 'pcs',
          description,
          minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : 10,
        },
        include: { category: true },
      });

      // Optional initial stock allocation
      if (initialStock && Number(initialStock) > 0 && locationId) {
        await prisma.inventory.create({
          data: {
            productId: product.id,
            locationId,
            quantity: Number(initialStock),
          },
        });
      }

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product
  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, sku, categoryId, uom, description, minStockLevel } = req.body;

      if (sku) {
        const existingSku = await prisma.product.findFirst({
          where: { sku, NOT: { id } },
        });
        if (existingSku) {
          throw new AppError(`SKU '${sku}' is already in use by another product.`, 400);
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(sku && { sku }),
          ...(categoryId && { categoryId }),
          ...(uom && { uom }),
          ...(description !== undefined && { description }),
          ...(minStockLevel !== undefined && { minStockLevel: Number(minStockLevel) }),
        },
        include: { category: true },
      });

      res.status(200).json({
        success: true,
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product
  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Categories CRUD
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      if (!name) throw new AppError('Category name is required.', 400);

      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) throw new AppError('Category already exists.', 400);

      const category = await prisma.category.create({
        data: { name, description },
      });

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }
}
