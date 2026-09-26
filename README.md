# StockSense — Inventory Management System (OODO Hackathon 2026)

StockSense is a centralized, location-aware inventory management application built for the **OODO Hackathon 2026**. It provides real-time tracking, transactional stock movements, auditable ledger history, dynamic multi-warehouse management, and an operational dashboard.

---

## 🚀 Current Implementation Status

| Feature / Module | Status | Description |
| :--- | :---: | :--- |
| **Project Foundation** | ✅ Complete | Modular Monolith repository structure, TypeScript configs, environment templates. |
| **Database Schema (Prisma)** | 🔄 In Progress | PostgreSQL relational schema, location-aware inventory model, stock ledger model. |
| **Backend API (Express)** | 🔄 In Progress | Express backend server, JWT auth, validation, controller-service architecture. |
| **Central Inventory Service** | 🔄 In Progress | Transactional inventory mutation engine for Receipts, Deliveries, Transfers & Adjustments. |
| **Frontend UI (React + Vite)**| 🔄 In Progress | Operational web application dashboard, products, warehouses, operations & ledger pages. |

---

## 🏗️ Architecture & Technology Stack

- **Architecture:** Modular Monolith (REST API with Controller ──► Service ──► Repository pattern)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend:** Node.js + Express + TypeScript + Zod Validation
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT + bcrypt password hashing

---

## 📁 Repository Structure

```
Stocksense_OODO/
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── prospects.md         # Master product & engineering blueprint
├── decisionlog.md       # Technical decision log
├── README.md            # Current implemented system documentation
├── backend/             # Node.js + Express + TypeScript REST API
│   ├── prisma/          # Prisma schema and database migrations
│   └── src/             # Application source code (modules, services, middleware)
└── frontend/            # React + TypeScript + Vite Web Application
```

---

## ⚙️ Quick Start Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database instance

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (`.env`):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stocksense_db?schema=public"
   PORT=5000
   JWT_SECRET="your-secret-jwt-key"
   ```
4. Run Prisma database migrations & seed engine:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
