import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/products/product.routes';
import warehouseRoutes from './modules/warehouses/warehouse.routes';
import receiptRoutes from './modules/receipts/receipt.routes';
import deliveryRoutes from './modules/deliveries/delivery.routes';
import transferRoutes from './modules/transfers/transfer.routes';
import adjustmentRoutes from './modules/adjustments/adjustment.routes';
import ledgerRoutes from './modules/ledger/ledger.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

// Middlewares
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'StockSense API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Middleware
app.use(errorHandler);

export default app;
