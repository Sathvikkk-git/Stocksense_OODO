import { PrismaClient, Role, DocStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense database seeding...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stocksense.com' },
    update: {},
    create: {
      email: 'admin@stocksense.com',
      name: 'System Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@stocksense.com' },
    update: {},
    create: {
      email: 'manager@stocksense.com',
      name: 'Sathvik Manager',
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@stocksense.com' },
    update: {},
    create: {
      email: 'staff@stocksense.com',
      name: 'Warehouse Operator',
      passwordHash,
      role: Role.WAREHOUSE_STAFF,
    },
  });

  console.log('✅ Users seeded (Admin, Manager, Staff)');

  // 2. Create Categories
  const catRaw = await prisma.category.upsert({
    where: { name: 'Raw Materials' },
    update: {},
    create: { name: 'Raw Materials', description: 'Metals, plastics, raw elements' },
  });

  const catElec = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics', description: 'PCBs, ICs, sensors and wiring' },
  });

  const catFinish = await prisma.category.upsert({
    where: { name: 'Finished Goods' },
    update: {},
    create: { name: 'Finished Goods', description: 'Assembled products ready for sale' },
  });

  const catPack = await prisma.category.upsert({
    where: { name: 'Packaging' },
    update: {},
    create: { name: 'Packaging', description: 'Boxes, bubble wrap, pallets' },
  });

  console.log('✅ Categories seeded');

  // 3. Create Warehouses & Locations
  const mwh = await prisma.warehouse.upsert({
    where: { code: 'MWH-01' },
    update: {},
    create: { code: 'MWH-01', name: 'Main Warehouse', address: '100 Industrial Parkway, Zone A' },
  });

  const pf = await prisma.warehouse.upsert({
    where: { code: 'PF-01' },
    update: {},
    create: { code: 'PF-01', name: 'Production Facility', address: '250 Assembly Boulevard, Building 2' },
  });

  const dc = await prisma.warehouse.upsert({
    where: { code: 'DC-01' },
    update: {},
    create: { code: 'DC-01', name: 'Distribution Center', address: '75 Logistics Hub, Gate 4' },
  });

  // Locations in Main Warehouse
  const mwhRackA = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: mwh.id, code: 'MWH-RACK-A1' } },
    update: {},
    create: { warehouseId: mwh.id, code: 'MWH-RACK-A1', name: 'Rack A - Shelf 1', type: 'RACK' },
  });

  const mwhRackB = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: mwh.id, code: 'MWH-RACK-B2' } },
    update: {},
    create: { warehouseId: mwh.id, code: 'MWH-RACK-B2', name: 'Rack B - Shelf 2', type: 'RACK' },
  });

  const mwhPallet = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: mwh.id, code: 'MWH-PALLET-01' } },
    update: {},
    create: { warehouseId: mwh.id, code: 'MWH-PALLET-01', name: 'Bulk Pallet Staging', type: 'PALLET' },
  });

  // Locations in Production Facility
  const pfAssembly = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: pf.id, code: 'PF-FLOOR-01' } },
    update: {},
    create: { warehouseId: pf.id, code: 'PF-FLOOR-01', name: 'Assembly Floor 1', type: 'FLOOR' },
  });

  const pfRaw = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: pf.id, code: 'PF-RAW-01' } },
    update: {},
    create: { warehouseId: pf.id, code: 'PF-RAW-01', name: 'Raw Material Holding', type: 'SHELF' },
  });

  // Locations in Distribution Center
  const dcShipping = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: dc.id, code: 'DC-SHIP-01' } },
    update: {},
    create: { warehouseId: dc.id, code: 'DC-SHIP-01', name: 'Outbound Shipping Dock', type: 'FLOOR' },
  });

  console.log('✅ Warehouses & Locations seeded');

  // 4. Create Suppliers
  const supplierSteel = await prisma.supplier.create({
    data: { name: 'SteelCorp Global Industries', contactEmail: 'sales@steelcorp.com', phone: '+1-555-0192', address: 'Pittsburgh, PA' },
  }).catch(() => null);

  const supplierTech = await prisma.supplier.create({
    data: { name: 'Global Tech Components Ltd', contactEmail: 'orders@globaltech.com', phone: '+1-555-0843', address: 'San Jose, CA' },
  }).catch(() => null);

  console.log('✅ Suppliers seeded');

  // 5. Create Products
  const prodSteel = await prisma.product.upsert({
    where: { sku: 'RM-STEEL-001' },
    update: {},
    create: {
      name: 'Steel Rods 12mm',
      sku: 'RM-STEEL-001',
      categoryId: catRaw.id,
      uom: 'kg',
      description: 'High tensile steel rods for manufacturing',
      minStockLevel: 50,
    },
  });

  const prodPCB = await prisma.product.upsert({
    where: { sku: 'EL-PCB-V2' },
    update: {},
    create: {
      name: 'Main Controller Circuit Board V2',
      sku: 'EL-PCB-V2',
      categoryId: catElec.id,
      uom: 'pcs',
      description: 'Microcontroller mainboard assembly',
      minStockLevel: 25,
    },
  });

  const prodAlum = await prisma.product.upsert({
    where: { sku: 'RM-ALUM-002' },
    update: {},
    create: {
      name: 'Aluminum Sheet 2mm',
      sku: 'RM-ALUM-002',
      categoryId: catRaw.id,
      uom: 'kg',
      description: 'Anodized 2mm aluminum sheet',
      minStockLevel: 30,
    },
  });

  const prodBox = await prisma.product.upsert({
    where: { sku: 'PK-BOX-HEAVY' },
    update: {},
    create: {
      name: 'Heavy-Duty Shipping Box XL',
      sku: 'PK-BOX-HEAVY',
      categoryId: catPack.id,
      uom: 'boxes',
      description: 'Double-walled corrugated cardboard box',
      minStockLevel: 100,
    },
  });

  const prodMicro = await prisma.product.upsert({
    where: { sku: 'EL-MCU-32BIT' },
    update: {},
    create: {
      name: '32-Bit ARM Microcontroller IC',
      sku: 'EL-MCU-32BIT',
      categoryId: catElec.id,
      uom: 'pcs',
      description: 'Low power 32-bit RISC MCU chip',
      minStockLevel: 200,
    },
  });

  console.log('✅ Products seeded');

  // 6. Initial Inventory Allocations
  await prisma.inventory.upsert({
    where: { productId_locationId: { productId: prodSteel.id, locationId: mwhRackA.id } },
    update: { quantity: 120 },
    create: { productId: prodSteel.id, locationId: mwhRackA.id, quantity: 120 },
  });

  await prisma.inventory.upsert({
    where: { productId_locationId: { productId: prodSteel.id, locationId: pfRaw.id } },
    update: { quantity: 30 },
    create: { productId: prodSteel.id, locationId: pfRaw.id, quantity: 30 },
  });

  await prisma.inventory.upsert({
    where: { productId_locationId: { productId: prodPCB.id, locationId: mwhRackB.id } },
    update: { quantity: 15 }, // Low stock (< 25 minStockLevel)
    create: { productId: prodPCB.id, locationId: mwhRackB.id, quantity: 15 },
  });

  await prisma.inventory.upsert({
    where: { productId_locationId: { productId: prodAlum.id, locationId: mwhPallet.id } },
    update: { quantity: 80 },
    create: { productId: prodAlum.id, locationId: mwhPallet.id, quantity: 80 },
  });

  await prisma.inventory.upsert({
    where: { productId_locationId: { productId: prodBox.id, locationId: dcShipping.id } },
    update: { quantity: 250 },
    create: { productId: prodBox.id, locationId: dcShipping.id, quantity: 250 },
  });

  await prisma.inventory.upsert({
    where: { productId_locationId: { productId: prodMicro.id, locationId: mwhRackB.id } },
    update: { quantity: 0 }, // Out of stock (0)
    create: { productId: prodMicro.id, locationId: mwhRackB.id, quantity: 0 },
  });

  console.log('✅ Initial Inventory allocations seeded');

  console.log('🚀 StockSense database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
