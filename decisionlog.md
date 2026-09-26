# StockSense — Decision & Architecture Log

This document records key technical, structural, and architectural decisions made during the development of StockSense.

---

## Decision Log Entries

### DEC-001 | 2026-09-26 | Technology Stack & Architecture Selection
* **Stage:** Project Foundation
* **Decision:** Select Node.js + Express + TypeScript for backend, React + TypeScript + Vite for frontend, PostgreSQL + Prisma ORM for database layer.
* **Context:** OODO Hackathon 2026 requirement for a production-grade Inventory Management System.
* **Problem:** Need a maintainable, strongly-typed, real-time data-backed architecture without over-engineering.
* **Alternatives Considered:**
  1. Microservices architecture (Rejected: Unnecessary distributed complexity for hackathon scope).
  2. Next.js full-stack (Rejected: Separate Express backend provides cleaner controller/service separation and API testing).
* **Chosen Approach:** Modular Monolith architecture with strict Controller ──► Service ──► Repository separation.
* **Reason:** Ensures high developer velocity, clear domain boundaries, and simple deployment while providing robust data integrity.
* **Status:** Implemented.

---

### DEC-002 | 2026-09-26 | Location-Aware Inventory Data Model
* **Stage:** Database Design
* **Decision:** Model inventory as `Product ──► Location ──► Quantity` instead of a flat `Product.stock` field.
* **Context:** Real-world inventory spans multiple warehouses, racks, and shelves.
* **Problem:** A single stock number on a product cannot track where items are stored or enable internal location transfers.
* **Chosen Approach:** Composite entity `Inventory` linking `productId` and `locationId` with a composite unique constraint `@@unique([productId, locationId])`.
* **Reason:** Enables multi-warehouse tracking, location-based stock visibility, and location-level stock movement validation.
* **Status:** Implemented.

---

### DEC-003 | 2026-09-26 | Centralized Transactional Inventory Service
* **Stage:** Architecture Design
* **Decision:** Enforce that ALL stock-mutating operations (Receipts, Deliveries, Transfers, Adjustments) pass through a single, centralized `InventoryService`.
* **Context:** Preventing inconsistent stock calculations and race conditions across feature controllers.
* **Problem:** If controllers independently update stock tables, ledger logging or stock checks could be bypassed or implemented inconsistently.
* **Chosen Approach:** Use Prisma transactions (`prisma.$transaction`) within a unified `InventoryService`.
* **Reason:** Guarantees atomic updates (stock change + ledger entry + status update) and single source of truth for stock rules.
* **Status:** Implemented.

---

### DEC-004 | 2026-09-26 | Corporate Git Branching Strategy (Git Flow / Enterprise Standard)
* **Stage:** Repository Governance
* **Decision:** Adopt Enterprise Git Flow branching architecture with protected `main` branch, integration `develop` branch, and topic `feature/*` branches.
* **Context:** Real-world software engineering standards in corporate tech environments.
* **Chosen Approach:**
  - `main`: Production-ready releases (Protected branch).
  - `develop`: Integration branch where all active features are merged and tested.
  - `feature/*`: Short-lived feature topic branches created off `develop` and merged via Pull Requests.
* **Reason:** Aligns with standard software development lifecycles (SDLC) in professional tech companies.
* **Status:** Implemented.
