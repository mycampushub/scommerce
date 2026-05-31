# SCommerce Multi-Store Management & POS System
## Complete Implementation Plan

**Version:** 2.0
**Status:** Planning Phase
**Last Updated:** 2025
**Author:** SCommerce Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Case](#business-case)
3. [Feature Overview](#feature-overview)
4. [Technical Architecture](#technical-architecture)
5. [Database Schema](#database-schema)
6. [Implementation Phases](#implementation-phases)
7. [API Specifications](#api-specifications)
8. [Frontend Components](#frontend-components)
9. [POS System Implementation](#pos-system-implementation)
10. [Security Considerations](#security-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Plan](#deployment-plan)
13. [Maintenance & Scaling](#maintenance--scaling)
14. [Timeline & Milestones](#timeline--milestones)
15. [Risk Assessment](#risk-assessment)

---

## Executive Summary

### Overview
This document outlines the complete implementation plan for adding two critical enterprise features to SCommerce:

1. **Multi-Store Management**: Ability to manage multiple storefronts from a single admin interface
2. **POS (Point of Sale) System**: Complete retail POS solution with hardware integration

### Expected Impact
- Platform Rating: 96/100 → 98/100
- Fortune 500 Segment: 6/10 → 8.5/10 (+2.5 points)
- Enterprise Segment: 7/10 → 9/10 (+2 points)
- Market Position: Top 1% → Top 0.5% globally

### Cost-Benefit Analysis
| Metric | Before | After |
|--------|--------|-------|
| Development Time | - | 8-12 weeks |
| Target Market | 0-50M revenue | 0-100M+ revenue |
| Competitive Position | Top 1% | Top 0.5% |
| Enterprise Readiness | 70% | 95% |

---

## Business Case

### Market Opportunity

**Multi-Store Management Market Size:**
- 45% of medium businesses operate 2+ stores
- 78% of large businesses have multi-location operations
- 95% of enterprises require multi-store capabilities

**POS System Market Size:**
- Global POS market: $100B+ by 2025
- 60% of retailers use integrated POS systems
- Omnichannel retail demand: +40% YoY growth

### Customer Pain Points Solved

**Multi-Store:**
- Managing inventory across multiple locations
- Different pricing per region/store
- Separate branding per storefront
- Unified reporting across all stores
- Efficient bulk operations

**POS System:**
- Online/Offline inventory synchronization
- Omnichannel customer experience
- Real-time sales tracking
- Multi-location management
- Hardware integration complexity

### Competitive Advantages

| Feature | SCommerce | Shopify | Magento | BigCommerce |
|---------|-----------|---------|---------|-------------|
| Multi-Store | ✅ Native | ✅ Premium | ✅ Custom | ✅ Premium |
| POS System | ✅ Native | ✅ Add-on | ❌ Custom | ✅ Add-on |
| Edge Performance | ✅ | ⚠️ | ❌ | ⚠️ |
| Cost (3yr) | $1,500 | $125,000+ | $225,000+ | $120,000+ |
| Combined Solution | ✅ Integrated | ⚠️ Separate | ❌ Fragmented | ⚠️ Separate |

---

## Feature Overview

### Multi-Store Management

#### Core Capabilities

1. **Centralized Administration**
   - Single dashboard for all stores
   - Role-based access control per store
   - Cross-store analytics
   - Bulk operations

2. **Store Configuration**
   - Individual store settings
   - Domain/subdomain management
   - Store-specific themes
   - Localization per store

3. **Product Management**
   - Global catalog with store overrides
   - Store-specific pricing
   - Regional inventory pools
   - Multi-language support

4. **Order Management**
   - Unified order processing
   - Store-specific fulfillment
   - Cross-store shipping
   - Customer accounts across stores

5. **Analytics & Reporting**
   - Store performance metrics
   - Comparative analysis
   - Revenue attribution
   - Customer journey tracking

#### Use Cases

- **Omnichannel Retail**: Online + physical stores
- **Brand Expansion**: Multiple sub-brands
- **Geographic Markets**: Regional storefronts
- **B2B + B2C**: Separate wholesale/retail portals
- **Marketplace Integration**: Centralized multi-platform management

---

### POS System

#### Core Capabilities

1. **Point of Sale Interface**
   - Fast checkout flow (3 taps or less)
   - Product search with barcode/QR
   - Quick-scan mode
   - Split payments
   - Returns and exchanges

2. **Hardware Integration**
   - Barcode scanners (USB, Bluetooth)
   - Receipt printers (thermal)
   - Cash drawers
   - Card readers (EMV, NFC)
   - Customer displays

3. **Inventory Synchronization**
   - Real-time stock updates
   - Low stock alerts
   - Multi-location inventory
   - Stock transfer between locations
   - Reorder point automation

4. **Customer Management**
   - Customer lookup by phone/email
   - Purchase history
   - Loyalty program integration
   - Gift card management
   - Email receipts

5. **Offline Mode**
   - Local data persistence
   - Automatic sync when online
   - Transaction queuing
   - Conflict resolution

6. **Reporting**
   - Sales by register
   - Cash drawer reconciliation
   - Shift reports
   - Staff performance
   - Product performance

#### Use Cases

- **Physical Retail Stores**: In-store checkout
- **Pop-up Shops**: Temporary retail locations
- **Trade Shows**: Event-based sales
- **Market Stalls**: Weekend markets
- **Kiosks**: Self-service stations

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCommerce Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 App Router (Port 3000)            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │  │
│  │  │   Storefronts   │  │  Admin Panel    │  │   Auth     │ │  │
│  │  │   (Dynamic)     │  │  (Multi-Store)  │  │   System   │ │  │
│  │  └─────────────────┘  └─────────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Edge Functions & Middleware                  │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │ Store Detection │  │   Rate Limit    │  │ Auth Guard  │ │  │
│  │  │    Middleware   │  │    Middleware   │  │             │ │  │
│  │  └─────────────────┘  └─────────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Routes (REST + WebSocket)                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │  │
│  │  │   Store    │  │   Order    │  │     Inventory      │   │  │
│  │  │   API      │  │   API      │  │       API          │   │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Cloudflare D1 Database                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │  │
│  │  │   Stores   │  │  Products  │  │     Inventory      │   │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Edge Cache (Cloudflare)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Mini Services                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Realtime Service (Port 3003)                      │  │
│  │  • Inventory updates                                      │  │
│  │  • Order status changes                                   │  │
│  │  • Multi-store synchronization                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         POS Service (Port 3004) ⭐ NEW                      │  │
│  │  • POS transaction processing                              │  │
│  │  • Hardware communication                                  │  │
│  │  • Offline sync queue                                      │  │
│  │  • WebSocket for real-time updates                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     POS Clients                                  │
├─────────────────────────────────────────────────────────────────┤
│  • Web-based POS (Next.js)                                     │  │
│  • Desktop POS (Electron)                                      │  │
│  • Mobile POS (PWA)                                            │  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Multi-Store Management
- **Framework**: Next.js 16 with App Router
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV + Edge Cache
- **Real-time**: Socket.IO (Port 3003)
- **Auth**: NextAuth.js v4
- **State Management**: Zustand

#### POS System
- **Backend**: Bun + Socket.IO (Port 3004)
- **Frontend**: Next.js 16 (Web POS)
- **Desktop**: Electron (Desktop POS)
- **Mobile**: PWA (Mobile POS)
- **Database**: Cloudflare D1 + Local SQLite (Offline)
- **Hardware**: Node-HID + USB libraries

### Data Flow

#### Multi-Store Request Flow
```
User Request
    ↓
Domain/Subdomain Detection (Middleware)
    ↓
Store Context Loading
    ↓
Route Handler (API/Server Component)
    ↓
Store-specific Data Fetching (D1)
    ↓
Response with Store Data
```

#### POS Transaction Flow
```
Scan Product (Barcode/QR)
    ↓
Local Lookup (IndexedDB)
    ↓
Add to Cart (State)
    ↓
Process Payment (Hardware)
    ↓
Create Transaction (POS Service)
    ↓
Sync to Cloud (API)
    ↓
Update Inventory (D1)
    ↓
Real-time Update (WebSocket)
    ↓
Receipt Print (Hardware)
```

---

## Database Schema

### Core Tables

#### 1. Store Management

```prisma
// Stores Table
model Store {
  id            String      @id @default(cuid())
  name          String
  slug          String      @unique
  domain        String?     @unique
  subdomain     String?     @unique
  storeType     StoreType   @default(ONLINE)
  isActive      Boolean     @default(true)
  isDefault     Boolean     @default(false)

  // Store Configuration
  settings      Json        // Theme, features, integrations
  currency      String      @default("USD")
  locale        String      @default("en-US")
  timezone      String      @default("UTC")

  // Relationships
  ownerId       String
  owner         User        @relation("StoreOwner")

  // Store Assets
  logo          String?
  favicon       String?
  bannerImage   String?

  // Business Details
  businessName  String?
  taxId         String?
  phone         String?
  email         String?
  address       Address?

  // Related Data
  products      Product[]
  orders        Order[]
  customers     Customer[]
  categories    Category[]
  inventories   Inventory[]
  registers     Register[]
  staff         StoreStaff[]
  promotions    Promotion[]
  giftCards     GiftCard[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([slug])
  @@index([domain])
  @@index([subdomain])
  @@index([storeType])
  @@index([isActive])
}

enum StoreType {
  ONLINE
  PHYSICAL
  OMNICHANNEL
  MARKETPLACE
  B2B
}

// Store Staff
model StoreStaff {
  id            String      @id @default(cuid())
  storeId       String
  userId        String
  role          StaffRole
  permissions   Json        // Granular permissions
  isActive      Boolean     @default(true)
  hiredAt       DateTime    @default(now())

  store         Store       @relation(fields: [storeId], references: [id])
  user          User        @relation(fields: [userId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([storeId, userId])
  @@index([storeId])
  @@index([userId])
}

enum StaffRole {
  OWNER
  MANAGER
  CASHIER
  STOCK_MANAGER
  VIEWER
}
```

#### 2. Multi-Store Products

```prisma
// Global Product
model Product {
  id            String      @id @default(cuid())
  sku           String      @unique
  barcode       String?     @unique

  // Base Product Info
  name          String
  description   String?
  shortDesc     String?

  // Product Type
  type          ProductType @default(SIMPLE)
  status        ProductStatus @default(ACTIVE)

  // Pricing (Global Default)
  basePrice     Decimal
  costPrice     Decimal?

  // Inventory
  trackInventory Boolean   @default(true)
  stockWarning  Int        @default(10)

  // Media
  images        Json       // Array of image URLs
  primaryImage  String?

  // SEO
  slug          String
  metaTitle     String?
  metaDesc      String?

  // Timestamps
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Multi-Store
  stores        StoreProduct[]
  inventories   Inventory[]
  categories    ProductCategory[]

  @@index([sku])
  @@index([slug])
  @@index([status])
}

// Store-specific Product Overrides
model StoreProduct {
  id            String      @id @default(cuid())
  productId     String
  storeId       String

  // Override Pricing
  price         Decimal?
  comparePrice  Decimal?
  costPrice     Decimal?

  // Override Inventory
  trackStock    Boolean?
  stockWarning  Int?

  // Override Display
  name          String?
  description   String?
  images        Json?

  // Store-specific
  isActive      Boolean     @default(true)
  featured      Boolean     @default(false)
  visibility    Visibility  @default(PUBLIC)

  // SEO Override
  slug          String?
  metaTitle     String?
  metaDesc      String?

  product       Product     @relation(fields: [productId], references: [id])
  store         Store       @relation(fields: [storeId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([productId, storeId])
  @@index([storeId])
  @@index([productId])
}

enum ProductType {
  SIMPLE
  VARIABLE
  BUNDLE
  GROUPED
  DIGITAL
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  OUT_OF_STOCK
}

enum Visibility {
  PUBLIC
  CATALOG
  PRIVATE
}
```

#### 3. Multi-Store Inventory

```prisma
// Inventory Tracking
model Inventory {
  id            String      @id @default(cuid())
  productId     String
  storeId       String
  locationId    String?

  quantity      Int         @default(0)
  reserved      Int         @default(0)
  available     Int         @computed(quantity - reserved)

  reorderPoint  Int         @default(10)
  maxStock      Int?

  // Tracking
  lastCounted   DateTime?
  countedBy     String?

  product       Product     @relation(fields: [productId], references: [id])
  store         Store       @relation(fields: [storeId], references: [id])
  location      Location?   @relation(fields: [locationId], references: [id])
  movements     InventoryMovement[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([productId, storeId, locationId])
  @@index([productId])
  @@index([storeId])
  @@index([locationId])
}

// Inventory Movement Log
model InventoryMovement {
  id            String          @id @default(cuid())
  inventoryId   String

  type          MovementType
  quantity      Int
  reference     String?         // Order ID, Transfer ID, etc.
  notes         String?

  // Location Tracking
  fromLocation  String?
  toLocation    String?

  // Source Tracking
  source        MovementSource
  sourceId      String?

  inventory     Inventory       @relation(fields: [inventoryId], references: [id])

  createdAt     DateTime        @default(now())
  createdBy     String

  @@index([inventoryId])
  @@index([type])
  @@index([createdAt])
}

// Locations (for multi-location inventory)
model Location {
  id            String      @id @default(cuid())
  storeId       String
  name          String
  code          String      @unique
  type          LocationType
  address       Address?

  // Contact
  phone         String?
  email         String?
  manager       String?

  inventories   Inventory[]
  movements     InventoryMovement[] @relation("FromLocation")
  movementsTo   InventoryMovement[] @relation("ToLocation")

  isActive      Boolean     @default(true)

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([storeId])
  @@index([code])
}

enum MovementType {
  PURCHASE
  SALE
  TRANSFER
  RETURN
  ADJUSTMENT
  DAMAGE
  LOSS
  RESTOCK
}

enum MovementSource {
  POS
  ONLINE
  TRANSFER
  ADJUSTMENT
  IMPORT
  SYNC
}

enum LocationType {
  WAREHOUSE
  RETAIL_STORE
  BACKROOM
  DISPLAY
  SUPPLIER
}
```

#### 4. POS System Tables

```prisma
// POS Registers
model Register {
  id            String      @id @default(cuid())
  name          String
  storeId       String
  locationId    String?

  // Register Status
  isActive      Boolean     @default(true)
  isOpen        Boolean     @default(false)
  openShiftId   String?

  // Hardware Config
  printerId     String?
  scannerId     String?
  drawerId      String?
  displayId     String?

  // Cash Tracking
  startingCash  Decimal     @default(0)
  currentCash   Decimal?

  // Relationships
  store         Store       @relation(fields: [storeId], references: [id])
  location      Location?   @relation(fields: [locationId], references: [id])
  shifts        Shift[]
  transactions  POSTransaction[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([storeId])
  @@index([locationId])
  @@index([isActive])
}

// Shift Management
model Shift {
  id            String      @id @default(cuid())
  registerId    String
  staffId       String

  // Shift Times
  openedAt      DateTime    @default(now())
  closedAt      DateTime?

  // Cash Tracking
  startCash     Decimal
  expectedCash  Decimal?
  actualCash    Decimal?
  variance      Decimal?

  // Notes
  notes         String?

  // Status
  status        ShiftStatus @default(OPEN)

  register      Register    @relation(fields: [registerId], references: [id])

  transactions  POSTransaction[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([registerId])
  @@index([staffId])
  @@index([openedAt])
}

// POS Transactions
model POSTransaction {
  id            String      @id @default(cuid())
  registerId    String
  shiftId       String
  staffId       String
  orderId       String?     // Linked to online order if applicable
  customerId    String?

  // Transaction Details
  type          TransactionType @default(SALE)
  status        TransactionStatus @default(PENDING)
  subtotal      Decimal
  tax           Decimal
  discount      Decimal     @default(0)
  total         Decimal

  // Payment Details
  payments      Json        // Array of payment methods
  changeDue     Decimal?

  // Offline Sync
  syncedAt      DateTime?
  syncAttempts  Int         @default(0)

  // Metadata
  notes         String?
  metadata      Json?

  // Relationships
  register      Register    @relation(fields: [registerId], references: [id])
  shift         Shift       @relation(fields: [shiftId], references: [id])
  items         POSTransactionItem[]
  returns       POSReturn[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([registerId])
  @@index([shiftId])
  @@index([customerId])
  @@index([syncedAt])
}

// Transaction Items
model POSTransactionItem {
  id            String      @id @default(cuid())
  transactionId String
  productId     String
  sku           String
  name          String

  // Item Details
  quantity      Int
  unitPrice     Decimal
  totalPrice    Decimal
  tax           Decimal
  discount      Decimal     @default(0)

  // Returns
  returnedQty   Int         @default(0)

  // Metadata
  variantInfo   Json?
  serialNumber  String?

  transaction   POSTransaction @relation(fields: [transactionId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([transactionId])
  @@index([productId])
}

// Returns & Exchanges
model POSReturn {
  id            String      @id @default(cuid())
  transactionId String
  originalTxId  String
  registerId    String
  staffId       String

  // Return Details
  type          ReturnType
  reason        ReturnReason
  items         Json        // Array of returned items
  subtotal      Decimal
  tax           Decimal
  refundAmount  Decimal

  // Refund Details
  refundMethod  String
  refundId      String?

  // Status
  status        ReturnStatus @default(PENDING)
  processedAt   DateTime?

  // Notes
  notes         String?

  transaction   POSTransaction @relation(fields: [transactionId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([transactionId])
  @@index([originalTxId])
  @@index([status])
}

// Gift Cards
model GiftCard {
  id            String      @id @default(cuid())
  code          String      @unique
  storeId       String

  // Card Details
  initialBalance Decimal
  currentBalance Decimal

  // Customer Info
  customerId    String?
  customerEmail String?
  customerPhone String?

  // Status
  status        GiftCardStatus @default(ACTIVE)
  expiresAt     DateTime?

  // Transactions
  transactions  GiftCardTransaction[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([storeId])
  @@index([code])
  @@index([status])
}

// Gift Card Transactions
model GiftCardTransaction {
  id            String      @id @default(cuid())
  giftCardId    String
  amount        Decimal
  type          GiftCardTransactionType
  reference     String?     // Order ID, POS Transaction ID

  // Notes
  notes         String?

  giftCard      GiftCard    @relation(fields: [giftCardId], references: [id])

  createdAt     DateTime    @default(now())

  @@index([giftCardId])
  @@index([createdAt])
}

// Enums
enum ShiftStatus {
  OPEN
  CLOSED
  VOIDED
}

enum TransactionType {
  SALE
  RETURN
  EXCHANGE
  REFUND
}

enum TransactionStatus {
  PENDING
  COMPLETED
  CANCELLED
  REFUNDED
}

enum ReturnType {
  RETURN
  EXCHANGE
  RETURN_AND_EXCHANGE
}

enum ReturnReason {
  DAMAGED
  WRONG_ITEM
  NOT_AS_DESCRIBED
  CUSTOMER_CHANGE
  QUALITY_ISSUE
  OTHER
}

enum ReturnStatus {
  PENDING
  APPROVED
  REJECTED
  PROCESSED
}

enum GiftCardStatus {
  ACTIVE
  EXPIRED
  VOIDED
  DEPLETED
}

enum GiftCardTransactionType {
  LOAD
  REDEEM
  REFUND
  ADJUSTMENT
}
```

#### 5. Shared Types

```prisma
// User (Extended)
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  phone         String?

  // Authentication
  password      String?
  role          UserRole   @default(CUSTOMER)
  image         String?

  // Customer Data
  addresses     Address[]
  orders        Order[]
  customerId    String?

  // Staff Data
  stores        StoreStaff[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([email])
  @@index([role])
}

enum UserRole {
  SUPER_ADMIN
  STORE_OWNER
  STAFF
  CUSTOMER
}

// Address Type
model Address {
  id            String      @id @default(cuid())
  userId        String?
  type          AddressType

  street        String
  street2       String?
  city          String
  state         String
  postalCode    String
  country       String

  // Contact
  phone         String?
  isDefault     Boolean     @default(false)

  // Relationships
  user          User?       @relation(fields: [userId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([userId])
}

enum AddressType {
  BILLING
  SHIPPING
  BUSINESS
  WAREHOUSE
}

// Categories (Store-specific)
model Category {
  id            String      @id @default(cuid())
  name          String
  slug          String
  description   String?
  image         String?

  // Hierarchy
  parentId      String?
  parent        Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children      Category[]  @relation("CategoryHierarchy")
  level         Int         @default(0)

  // Store Association
  storeId       String
  store         Store       @relation(fields: [storeId], references: [id])

  // Display
  isActive      Boolean     @default(true)
  sortOrder     Int         @default(0)

  // Products
  products      ProductCategory[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([storeId, slug])
  @@index([storeId])
  @@index([parentId])
}

// Product-Category Join Table
model ProductCategory {
  id            String      @id @default(cuid())
  productId     String
  categoryId    String
  isPrimary     Boolean     @default(false)

  product       Product     @relation(fields: [productId], references: [id])
  category      Category    @relation(fields: [categoryId], references: [id])

  createdAt     DateTime    @default(now())

  @@unique([productId, categoryId])
  @@index([productId])
  @@index([categoryId])
}

// Orders (Extended)
model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique
  storeId       String

  // Customer Info
  customerId    String?
  customerEmail String?
  customerName  String?

  // Order Details
  status        OrderStatus @default(PENDING)
  subtotal      Decimal
  tax           Decimal
  shipping      Decimal     @default(0)
  discount      Decimal     @default(0)
  total         Decimal

  // Addresses
  billingAddress Address?
  shippingAddress Address?

  // Items
  items         Json

  // Notes
  notes         String?

  // Relationships
  store         Store       @relation(fields: [storeId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([storeId])
  @@index([customerId])
  @@index([status])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

// Customers (Store-specific)
model Customer {
  id            String      @id @default(cuid())
  storeId       String
  email         String?
  phone         String?

  // Customer Info
  firstName     String
  lastName      String
  company       String?

  // Customer Data
  totalSpent    Decimal     @default(0)
  orderCount    Int         @default(0)
  lastOrderAt   DateTime?

  // Loyalty
  loyaltyPoints Int         @default(0)
  tier          CustomerTier @default(BRONZE)

  // Relationships
  store         Store       @relation(fields: [storeId], references: [id])
  orders        Order[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([storeId, email])
  @@index([storeId])
  @@index([email])
}

enum CustomerTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
  VIP
}

// Promotions (Store-specific)
model Promotion {
  id            String      @id @default(cuid())
  storeId       String

  // Promotion Details
  name          String
  code          String?     @unique
  type          PromotionType
  value         Decimal

  // Validity
  startDate     DateTime
  endDate       DateTime?
  isActive      Boolean     @default(true)

  // Rules
  minPurchase   Decimal?
  maxUses       Int?
  usesCount     Int         @default(0)
  customerLimit Int?

  // Scope
  appliesTo     String?     // "all", "products", "categories"
  appliesToIds  Json?       // Array of product/category IDs

  store         Store       @relation(fields: [storeId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([storeId])
  @@index([code])
  @@index([isActive])
}

enum PromotionType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
  BOGO
}
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Database Schema & Migrations
**Tasks:**
- [ ] Update `prisma/schema.prisma` with new models
- [ ] Run `bun run db:push` to apply schema changes
- [ ] Create seed data for testing
- [ ] Verify database integrity

**Files to Create/Modify:**
- `prisma/schema.prisma` (modify)
- `prisma/seed.ts` (create)
- `db/migrations/` (auto-generated)

**Acceptance Criteria:**
- All new tables created successfully
- Relationships established correctly
- Seed data loads without errors

#### 1.2 Store Detection Middleware
**Tasks:**
- [ ] Create middleware for store detection
- [ ] Implement domain/subdomain parsing
- [ ] Add store context to request
- [ ] Handle default store fallback
- [ ] Add store validation

**Files to Create:**
- `src/middleware/store-detection.ts`
- `src/lib/store-context.ts`

**Acceptance Criteria:**
- Store detected from domain/subdomain
- Default store fallback works
- Invalid store returns 404

#### 1.3 Multi-Store API Foundation
**Tasks:**
- [ ] Create store management API routes
- [ ] Implement CRUD operations for stores
- [ ] Add store listing endpoint
- [ ] Add store switching endpoint
- [ ] Create store settings API

**Files to Create:**
- `src/app/api/stores/route.ts`
- `src/app/api/stores/[id]/route.ts`
- `src/app/api/stores/[id]/settings/route.ts`
- `src/app/api/stores/[id]/products/route.ts`

**Acceptance Criteria:**
- Stores can be created/updated/deleted
- Store list returns all accessible stores
- Store switching works correctly

---

### Phase 2: Multi-Store Admin (Weeks 3-5)

#### 2.1 Store Management UI
**Tasks:**
- [ ] Create store list page
- [ ] Create store detail page
- [ ] Implement store creation form
- [ ] Add store settings panel
- [ ] Create domain/subdomain configuration

**Files to Create:**
- `src/app/admin/stores/page.tsx`
- `src/app/admin/stores/[id]/page.tsx`
- `src/app/admin/stores/new/page.tsx`
- `src/components/admin/store-card.tsx`
- `src/components/admin/store-form.tsx`
- `src/components/admin/store-settings.tsx`

**Acceptance Criteria:**
- Stores displayed in list view
- Store creation form validates correctly
- Settings save and persist

#### 2.2 Multi-Store Product Management
**Tasks:**
- [ ] Update product listing with store filter
- [ ] Add store-specific pricing override
- [ ] Implement product visibility per store
- [ ] Create bulk operations for products
- [ ] Add product sync between stores

**Files to Create:**
- `src/app/admin/products/page.tsx` (modify)
- `src/components/admin/product-store-selector.tsx`
- `src/components/admin/product-pricing-override.tsx`
- `src/components/admin/bulk-product-action.tsx`

**Acceptance Criteria:**
- Products filtered by store
- Pricing overrides work correctly
- Bulk operations execute successfully

#### 2.3 Multi-Store Inventory Management
**Tasks:**
- [ ] Create inventory dashboard
- [ ] Add location management
- [ ] Implement inventory transfer
- [ ] Add stock adjustment interface
- [ ] Create low stock alerts

**Files to Create:**
- `src/app/admin/inventory/page.tsx`
- `src/app/admin/inventory/locations/page.tsx`
- `src/app/admin/inventory/transfers/page.tsx`
- `src/components/admin/inventory-table.tsx`
- `src/components/admin/inventory-transfer-form.tsx`

**Acceptance Criteria:**
- Inventory levels accurate per location
- Transfers update inventory correctly
- Low stock alerts trigger

#### 2.4 Multi-Store Analytics
**Tasks:**
- [ ] Create multi-store dashboard
- [ ] Add store performance comparison
- [ ] Implement cross-store analytics
- [ ] Create revenue attribution reports
- [ ] Add export functionality

**Files to Create:**
- `src/app/admin/analytics/page.tsx`
- `src/components/admin/multi-store-chart.tsx`
- `src/components/admin/store-performance-card.tsx`
- `src/components/admin/analytics-export.tsx`

**Acceptance Criteria:**
- Dashboard shows all stores
- Comparisons display correctly
- Exports work for all reports

---

### Phase 3: POS Service Backend (Weeks 6-7)

#### 3.1 POS Mini Service Setup
**Tasks:**
- [ ] Initialize POS mini service
- [ ] Set up Socket.IO server
- [ ] Configure service on port 3004
- [ ] Add database connection
- [ ] Set up environment variables

**Files to Create:**
- `mini-services/pos-service/index.ts`
- `mini-services/pos-service/package.json`
- `mini-services/pos-service/tsconfig.json`
- `mini-services/pos-service/.env.example`

**Acceptance Criteria:**
- Service starts on port 3004
- Socket.IO connections accepted
- Database queries work

#### 3.2 Transaction Processing
**Tasks:**
- [ ] Create transaction API
- [ ] Implement payment processing
- [ ] Add inventory updates
- [ ] Create receipt generation
- [ ] Implement return processing

**Files to Create:**
- `mini-services/pos-service/api/transactions.ts`
- `mini-services/pos-service/api/payments.ts`
- `mini-services/pos-service/api/returns.ts`
- `mini-services/pos-service/services/transaction.service.ts`
- `mini-services/pos-service/services/receipt.service.ts`

**Acceptance Criteria:**
- Transactions created successfully
- Payments processed correctly
- Inventory updated in real-time

#### 3.3 Hardware Integration Layer
**Tasks:**
- [ ] Create hardware abstraction layer
- [ ] Implement barcode scanner support
- [ ] Add receipt printer support
- [ ] Integrate cash drawer
- [ ] Add card reader support

**Files to Create:**
- `mini-services/pos-service/hardware/scanner.ts`
- `mini-services/pos-service/hardware/printer.ts`
- `mini-services/pos-service/hardware/cash-drawer.ts`
- `mini-services/pos-service/hardware/card-reader.ts`
- `mini-services/pos-service/hardware/index.ts`

**Acceptance Criteria:**
- Hardware devices detected
- Scanner reads barcodes
- Printer prints receipts

#### 3.4 Offline Sync Queue
**Tasks:**
- [ ] Create local SQLite database
- [ ] Implement offline transaction queue
- [ ] Add sync when online
- [ ] Handle sync conflicts
- [ ] Add retry logic

**Files to Create:**
- `mini-services/pos-service/database/local-db.ts`
- `mini-services/pos-service/services/sync.service.ts`
- `mini-services/pos-service/services/queue.service.ts`
- `mini-services/pos-service/services/conflict-resolver.ts`

**Acceptance Criteria:**
- Transactions saved offline
- Sync completes when online
- Conflicts resolved correctly

---

### Phase 4: POS Frontend (Weeks 8-10)

#### 4.1 Web POS Interface
**Tasks:**
- [ ] Create POS layout
- [ ] Implement product grid
- [ ] Add shopping cart
- [ ] Create checkout flow
- [ ] Add receipt modal

**Files to Create:**
- `src/app/pos/page.tsx`
- `src/components/pos/pos-layout.tsx`
- `src/components/pos/product-grid.tsx`
- `src/components/pos/shopping-cart.tsx`
- `src/components/pos/checkout-panel.tsx`
- `src/components/pos/receipt-modal.tsx`

**Acceptance Criteria:**
- POS interface responsive
- Products load quickly
- Checkout flow smooth

#### 4.2 POS Hardware UI
**Tasks:**
- [ ] Create hardware status panel
- [ ] Add connection indicators
- [ ] Implement device settings
- [ ] Add hardware test buttons
- [ ] Create error handling UI

**Files to Create:**
- `src/components/pos/hardware-panel.tsx`
- `src/components/pos/device-indicator.tsx`
- `src/components/pos/hardware-settings.tsx`

**Acceptance Criteria:**
- Hardware status visible
- Connection errors displayed
- Settings accessible

#### 4.3 Shift Management UI
**Tasks:**
- [ ] Create shift opening flow
- [ ] Implement shift closing flow
- [ ] Add cash count interface
- [ ] Create shift report
- [ ] Add shift history

**Files to Create:**
- `src/components/pos/shift-open.tsx`
- `src/components/pos/shift-close.tsx`
- `src/components/pos/cash-count.tsx`
- `src/components/pos/shift-report.tsx`

**Acceptance Criteria:**
- Shifts open/close correctly
- Cash counts accurate
- Reports generate correctly

#### 4.4 Customer Management UI
**Tasks:**
- [ ] Create customer lookup
- [ ] Add customer details panel
- [ ] Implement customer creation
- [ ] Add loyalty points display
- [ ] Create purchase history

**Files to Create:**
- `src/components/pos/customer-lookup.tsx`
- `src/components/pos/customer-panel.tsx`
- `src/components/pos/customer-form.tsx`

**Acceptance Criteria:**
- Customers searchable
- Details display correctly
- Loyalty points accurate

---

### Phase 5: Integration & Testing (Weeks 11-12)

#### 5.1 Multi-Store + POS Integration
**Tasks:**
- [ ] Connect POS to store inventory
- [ ] Sync POS transactions to store
- [ ] Implement real-time updates
- [ ] Add cross-store inventory sync
- [ ] Test end-to-end flows

**Files to Modify:**
- `src/hooks/use-socket.ts` (extend)
- `mini-services/realtime-service/index.ts` (update)

**Acceptance Criteria:**
- Inventory updates in real-time
- All stores synced
- No data inconsistencies

#### 5.2 Testing Suite
**Tasks:**
- [ ] Write unit tests for models
- [ ] Create API integration tests
- [ ] Add E2E tests for flows
- [ ] Test offline sync
- [ ] Performance testing

**Files to Create:**
- `tests/unit/stores.test.ts`
- `tests/integration/pos-api.test.ts`
- `tests/e2e/multi-store-flow.spec.ts`
- `tests/e2e/pos-flow.spec.ts`
- `tests/offline/sync.test.ts`

**Acceptance Criteria:**
- All tests passing
- Coverage >80%
- Performance benchmarks met

#### 5.3 Documentation
**Tasks:**
- [ ] Write API documentation
- [ ] Create user guides
- [ ] Add deployment docs
- [ ] Create troubleshooting guide
- [ ] Write migration guide

**Files to Create:**
- `docs/api/stores.md`
- `docs/api/pos.md`
- `docs/user/multi-store-guide.md`
- `docs/user/pos-guide.md`
- `docs/deployment.md`

**Acceptance Criteria:**
- Documentation complete
- Examples working
- Screenshots included

---

## API Specifications

### Multi-Store API

#### Store Management

**GET /api/stores**
Get all stores (filtered by user access)

```typescript
interface GetStoresResponse {
  stores: {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    subdomain?: string;
    storeType: StoreType;
    isActive: boolean;
    isDefault: boolean;
    currency: string;
    locale: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

**POST /api/stores**
Create a new store

```typescript
interface CreateStoreRequest {
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  storeType: StoreType;
  currency?: string;
  locale?: string;
  businessName?: string;
  logo?: string;
}

interface CreateStoreResponse {
  store: {
    id: string;
    name: string;
    slug: string;
    // ... other fields
  };
}
```

**GET /api/stores/[id]**
Get store details

```typescript
interface GetStoreResponse {
  store: {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    subdomain?: string;
    storeType: StoreType;
    isActive: boolean;
    settings: Json;
    currency: string;
    locale: string;
    businessName?: string;
    phone?: string;
    email?: string;
    address?: Address;
    createdAt: string;
    updatedAt: string;
  };
}
```

**PUT /api/stores/[id]**
Update store

```typescript
interface UpdateStoreRequest {
  name?: string;
  slug?: string;
  domain?: string;
  subdomain?: string;
  isActive?: boolean;
  settings?: Json;
  currency?: string;
  locale?: string;
  businessName?: string;
  // ... other fields
}

interface UpdateStoreResponse {
  store: Store;
}
```

**DELETE /api/stores/[id]**
Delete store

```typescript
interface DeleteStoreResponse {
  success: boolean;
  message: string;
}
```

---

#### Store Products

**GET /api/stores/[storeId]/products**
Get products for a specific store

```typescript
interface GetStoreProductsRequest {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetStoreProductsResponse {
  products: {
    id: string;
    sku: string;
    name: string;
    price: Decimal;
    comparePrice?: Decimal;
    stock: number;
    image?: string;
    status: ProductStatus;
    storeOverrides?: {
      price?: Decimal;
      isActive?: boolean;
      featured?: boolean;
    };
  }[];
  pagination: Pagination;
}
```

**POST /api/stores/[storeId]/products**
Add product to store

```typescript
interface AddProductToStoreRequest {
  productId: string;
  price?: Decimal;
  comparePrice?: Decimal;
  isActive?: boolean;
  featured?: boolean;
  visibility?: Visibility;
  trackStock?: boolean;
  stockWarning?: number;
}

interface AddProductToStoreResponse {
  storeProduct: StoreProduct;
}
```

**PUT /api/stores/[storeId]/products/[productId]**
Update store product settings

```typescript
interface UpdateStoreProductRequest {
  price?: Decimal;
  comparePrice?: Decimal;
  isActive?: boolean;
  featured?: boolean;
  visibility?: Visibility;
  trackStock?: boolean;
  stockWarning?: number;
}

interface UpdateStoreProductResponse {
  storeProduct: StoreProduct;
}
```

**DELETE /api/stores/[storeId]/products/[productId]**
Remove product from store

```typescript
interface RemoveProductFromStoreResponse {
  success: boolean;
  message: string;
}
```

---

#### Store Inventory

**GET /api/stores/[storeId]/inventory**
Get inventory levels for store

```typescript
interface GetStoreInventoryRequest {
  page?: number;
  limit?: number;
  locationId?: string;
  lowStock?: boolean;
  search?: string;
}

interface GetStoreInventoryResponse {
  inventory: {
    id: string;
    product: {
      id: string;
      sku: string;
      name: string;
      barcode?: string;
      image?: string;
    };
    quantity: number;
    reserved: number;
    available: number;
    location: {
      id: string;
      name: string;
      code: string;
      type: LocationType;
    } | null;
    reorderPoint: number;
    maxStock?: number;
  }[];
  pagination: Pagination;
}
```

**POST /api/stores/[storeId]/inventory/adjust**
Adjust inventory levels

```typescript
interface AdjustInventoryRequest {
  productId: string;
  locationId?: string;
  quantity: number;
  type: MovementType;
  notes?: string;
}

interface AdjustInventoryResponse {
  inventory: Inventory;
  movement: InventoryMovement;
}
```

**POST /api/stores/[storeId]/inventory/transfer**
Transfer inventory between locations

```typescript
interface TransferInventoryRequest {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  notes?: string;
}

interface TransferInventoryResponse {
  transfer: {
    id: string;
    productId: string;
    fromLocation: Location;
    toLocation: Location;
    quantity: number;
    status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED';
    createdAt: string;
  };
}
```

---

### POS API

#### Registers

**GET /api/pos/registers**
Get all registers for store

```typescript
interface GetRegistersResponse {
  registers: {
    id: string;
    name: string;
    storeId: string;
    locationId?: string;
    isActive: boolean;
    isOpen: boolean;
    currentShift?: {
      id: string;
      openedAt: string;
      staffName: string;
    };
  }[];
}
```

**POST /api/pos/registers**
Create new register

```typescript
interface CreateRegisterRequest {
  name: string;
  locationId?: string;
  hardware?: {
    printerId?: string;
    scannerId?: string;
    drawerId?: string;
    displayId?: string;
  };
}

interface CreateRegisterResponse {
  register: Register;
}
```

---

#### Shifts

**POST /api/pos/registers/[registerId]/shifts/open**
Open a new shift

```typescript
interface OpenShiftRequest {
  staffId: string;
  startCash: number;
  notes?: string;
}

interface OpenShiftResponse {
  shift: {
    id: string;
    registerId: string;
    staffId: string;
    openedAt: string;
    startCash: Decimal;
    status: ShiftStatus;
  };
}
```

**POST /api/pos/shifts/[shiftId]/close**
Close a shift

```typescript
interface CloseShiftRequest {
  actualCash: number;
  notes?: string;
}

interface CloseShiftResponse {
  shift: {
    id: string;
    closedAt: string;
    actualCash: Decimal;
    expectedCash: Decimal;
    variance: Decimal;
    status: ShiftStatus;
  };
  report: {
    totalSales: Decimal;
    cashSales: Decimal;
    cardSales: Decimal;
    otherPayments: Decimal;
    transactions: number;
  };
}
```

---

#### Transactions

**POST /api/pos/transactions**
Create a new transaction

```typescript
interface CreateTransactionRequest {
  registerId: string;
  shiftId: string;
  staffId: string;
  customerId?: string;
  type: TransactionType;
  items: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    discount?: number;
    variantInfo?: Json;
    serialNumber?: string;
  }[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  payments: {
    method: string;
    amount: number;
    reference?: string;
    cardDetails?: {
      type: string;
      last4: string;
      authCode?: string;
    };
  }[];
  notes?: string;
  offline?: boolean;
}

interface CreateTransactionResponse {
  transaction: {
    id: string;
    orderNumber: string;
    registerId: string;
    shiftId: string;
    subtotal: Decimal;
    tax: Decimal;
    discount: Decimal;
    total: Decimal;
    status: TransactionStatus;
    syncedAt?: string;
    createdAt: string;
  };
  receipt?: {
    data: string;
    format: 'text' | 'html';
  };
}
```

**GET /api/pos/transactions/[id]**
Get transaction details

```typescript
interface GetTransactionResponse {
  transaction: {
    id: string;
    orderNumber: string;
    register: {
      id: string;
      name: string;
    };
    shift: {
      id: string;
      openedAt: string;
    };
    staff: {
      id: string;
      name: string;
    };
    customer?: {
      id: string;
      name: string;
      email: string;
    };
    type: TransactionType;
    status: TransactionStatus;
    subtotal: Decimal;
    tax: Decimal;
    discount: Decimal;
    total: Decimal;
    payments: Json;
    items: {
      id: string;
      productId: string;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: Decimal;
      totalPrice: Decimal;
      tax: Decimal;
      discount: Decimal;
      returnedQty: number;
      variantInfo?: Json;
      serialNumber?: string;
    }[];
    notes?: string;
    syncedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

---

#### Returns

**POST /api/pos/transactions/[transactionId]/returns**
Process a return

```typescript
interface CreateReturnRequest {
  registerId: string;
  staffId: string;
  type: ReturnType;
  reason: ReturnReason;
  items: {
    transactionItemId: string;
    productId: string;
    quantity: number;
    condition?: 'NEW' | 'OPENED' | 'DAMAGED';
  }[];
  refundMethod: string;
  notes?: string;
}

interface CreateReturnResponse {
  returnRecord: {
    id: string;
    originalTransaction: {
      id: string;
      orderNumber: string;
    };
    type: ReturnType;
    reason: ReturnReason;
    items: Json;
    subtotal: Decimal;
    tax: Decimal;
    refundAmount: Decimal;
    refundMethod: string;
    status: ReturnStatus;
    createdAt: string;
  };
  refund: {
    id: string;
    amount: Decimal;
    method: string;
    reference?: string;
    processedAt: string;
  };
}
```

---

#### Gift Cards

**POST /api/pos/gift-cards**
Create a gift card

```typescript
interface CreateGiftCardRequest {
  amount: number;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  expiresAt?: string;
}

interface CreateGiftCardResponse {
  giftCard: {
    id: string;
    code: string;
    storeId: string;
    initialBalance: Decimal;
    currentBalance: Decimal;
    status: GiftCardStatus;
    expiresAt?: string;
    createdAt: string;
  };
}
```

**GET /api/pos/gift-cards/[code]**
Look up gift card

```typescript
interface GetGiftCardResponse {
  giftCard: {
    id: string;
    code: string;
    currentBalance: Decimal;
    status: GiftCardStatus;
    expiresAt?: string;
    customerEmail?: string;
  };
}
```

**POST /api/pos/gift-cards/[code]/redeem**
Redeem gift card

```typescript
interface RedeemGiftCardRequest {
  amount: number;
  transactionId: string;
}

interface RedeemGiftCardResponse {
  giftCard: {
    id: string;
    code: string;
    previousBalance: Decimal;
    currentBalance: Decimal;
  };
  transaction: {
    id: string;
    amount: Decimal;
  };
}
```

---

## Frontend Components

### Multi-Store Components

#### StoreSelector
```typescript
// src/components/admin/store-selector.tsx
interface StoreSelectorProps {
  selectedStore?: string;
  onStoreChange: (storeId: string) => void;
  showAllOption?: boolean;
  disabled?: boolean;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({
  selectedStore,
  onStoreChange,
  showAllOption = true,
  disabled = false,
}) => {
  const { data: stores, isLoading } = useStores();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    if (!searchQuery) return stores;
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stores, searchQuery]);

  return (
    <div className="relative">
      <Select
        value={selectedStore}
        onValueChange={onStoreChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select store" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Stores</SelectItem>
          )}
          {filteredStores.map(store => (
            <SelectItem key={store.id} value={store.id}>
              <div className="flex items-center gap-2">
                <StoreIcon className="h-4 w-4" />
                <span>{store.name}</span>
                {store.isActive && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
```

#### MultiStoreDashboard
```typescript
// src/components/admin/multi-store-dashboard.tsx
interface MultiStoreDashboardProps {
  dateRange: DateRange;
  metrics?: string[];
}

const MultiStoreDashboard: React.FC<MultiStoreDashboardProps> = ({
  dateRange,
  metrics = ['revenue', 'orders', 'customers', 'avgOrderValue'],
}) => {
  const { data: storeMetrics, isLoading } = useStoreMetrics(dateRange);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={storeMetrics?.totalRevenue}
          change={storeMetrics?.revenueChange}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Orders"
          value={storeMetrics?.totalOrders}
          change={storeMetrics?.ordersChange}
          icon={ShoppingCart}
        />
        <MetricCard
          title="New Customers"
          value={storeMetrics?.totalCustomers}
          change={storeMetrics?.customersChange}
          icon={Users}
        />
        <MetricCard
          title="Avg. Order Value"
          value={storeMetrics?.avgOrderValue}
          change={storeMetrics?.aovChange}
          icon={TrendingUp}
        />
      </div>

      {/* Store Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Store Performance</CardTitle>
          <CardDescription>Compare performance across all stores</CardDescription>
        </CardHeader>
        <CardContent>
          <StoreComparisonChart data={storeMetrics?.byStore} />
        </CardContent>
      </Card>

      {/* Regional Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Performance</CardTitle>
          <CardDescription>Revenue by geographic region</CardDescription>
        </CardHeader>
        <CardContent>
          <RegionalChart data={storeMetrics?.byRegion} />
        </CardContent>
      </Card>

      {/* Top Products Across Stores */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Best-selling products across all stores</CardDescription>
        </CardHeader>
        <CardContent>
          <TopProductsTable data={storeMetrics?.topProducts} />
        </CardContent>
      </Card>
    </div>
  );
};
```

#### ProductPricingOverride
```typescript
// src/components/admin/product-pricing-override.tsx
interface ProductPricingOverrideProps {
  productId: string;
  storeId?: string;
  onSave: () => void;
}

const ProductPricingOverride: React.FC<ProductPricingOverrideProps> = ({
  productId,
  storeId,
  onSave,
}) => {
  const { data: product } = useProduct(productId);
  const { data: storeProduct } = useStoreProduct(productId, storeId);
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(storeProduct?.price || product?.basePrice);
  const [comparePrice, setComparePrice] = useState(storeProduct?.comparePrice);

  const updateMutation = useUpdateStoreProduct();

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      productId,
      storeId: storeId!,
      price,
      comparePrice,
    });
    setIsEditing(false);
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Store Pricing</CardTitle>
            <CardDescription>
              {product?.name} - {storeProduct?.store.name}
            </CardDescription>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Base Price</Label>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(product?.basePrice)}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Store Price</Label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            disabled={!isEditing}
          />
        </div>

        <div className="grid gap-2">
          <Label>Compare-at Price</Label>
          <Input
            type="number"
            step="0.01"
            value={comparePrice || ''}
            onChange={(e) => setComparePrice(e.target.value ? parseFloat(e.target.value) : undefined)}
            disabled={!isEditing}
          />
        </div>

        {price < product?.basePrice && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Price below base</AlertTitle>
            <AlertDescription>
              This price is lower than the base product price. Ensure this is intentional.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

---

### POS Components

#### POSLayout
```typescript
// src/components/pos/pos-layout.tsx
interface POSLayoutProps {
  children: React.ReactNode;
}

const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {
  const { register } = usePOSRegister();
  const { shift } = usePOSShift();

  if (!shift) {
    return <ShiftOpenDialog />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <POSHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Right Panel - Cart & Checkout */}
      <div className="w-96 border-l bg-card flex flex-col">
        <ShoppingCart />
        <CheckoutPanel />
      </div>

      {/* Hardware Status */}
      <HardwarePanel />
    </div>
  );
};
```

#### ProductGrid
```typescript
// src/components/pos/product-grid.tsx
interface ProductGridProps {
  storeId: string;
  onProductSelect: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  storeId,
  onProductSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: products, isLoading } = usePOSProducts(storeId, {
    search: searchQuery,
    category: selectedCategory,
  });

  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find(p => p.barcode === barcode);
    if (product) {
      onProductSelect(product);
    } else {
      toast.error('Product not found', { description: `Barcode: ${barcode}` });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeScan(searchQuery);
              }
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 border-b">
        <CategorySelector
          storeId={storeId}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductSelect(product)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No products found
          </div>
        )}
      </div>
    </div>
  );
};
```

#### ShoppingCart
```typescript
// src/components/pos/shopping-cart.tsx
const ShoppingCart: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart } = usePOSCart();
  const { customer } = usePOSCustomer();

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = cart.reduce((sum, item) => sum + item.tax, 0);
  const total = subtotal + tax;

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Shopping Cart</h2>
        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Customer Info */}
      <CustomerLookup />

      {/* Cart Items */}
      <div className="space-y-2 mt-4">
        {cart.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Cart is empty</p>
            <p className="text-sm">Scan or select products to begin</p>
          </div>
        ) : (
          cart.map(item => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
              onRemove={() => removeItem(item.id)}
            />
          ))
        )}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          {customer?.loyaltyPoints > 0 && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>Loyalty Points</span>
              <span>{customer.loyaltyPoints}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### CheckoutPanel
```typescript
// src/components/pos/checkout-panel.tsx
const CheckoutPanel: React.FC = () => {
  const { cart } = usePOSCart();
  const { register } = usePOSRegister();
  const { shift } = usePOSShift();
  const { customer } = usePOSCustomer();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = cart.reduce((sum, item) => sum + item.tax, 0);
  const total = subtotal + tax;

  const createTransaction = useCreatePOSTransaction();

  const handleCheckout = async () => {
    if (!shift || !register) {
      toast.error('Register or shift not available');
      return;
    }

    setIsProcessing(true);

    try {
      const transaction = await createTransaction.mutateAsync({
        registerId: register.id,
        shiftId: shift.id,
        staffId: shift.staffId,
        customerId: customer?.id,
        type: 'SALE',
        items: cart.map(item => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tax: item.tax,
          discount: item.discount,
        })),
        subtotal,
        tax,
        total,
        payments: [{
          method: paymentMethod,
          amount: total,
        }],
      });

      toast.success('Transaction completed', {
        description: `Order #${transaction.orderNumber}`,
      });

      // Show receipt modal
      showReceipt(transaction);
    } catch (error) {
      toast.error('Transaction failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 border-t bg-card">
      <h3 className="font-semibold mb-4">Payment</h3>

      {/* Payment Methods */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <PaymentMethodButton
          method="CASH"
          selected={paymentMethod === 'CASH'}
          onClick={() => setPaymentMethod('CASH')}
          icon={Banknote}
        />
        <PaymentMethodButton
          method="CARD"
          selected={paymentMethod === 'CARD'}
          onClick={() => setPaymentMethod('CARD')}
          icon={CreditCard}
        />
        <PaymentMethodButton
          method="MOBILE"
          selected={paymentMethod === 'MOBILE'}
          onClick={() => setPaymentMethod('MOBILE')}
          icon={Smartphone}
        />
        <PaymentMethodButton
          method="GIFT_CARD"
          selected={paymentMethod === 'GIFT_CARD'}
          onClick={() => setPaymentMethod('GIFT_CARD')}
          icon={Gift}
          disabled={!customer}
        />
      </div>

      {/* Checkout Button */}
      <Button
        className="w-full h-12 text-lg"
        disabled={cart.length === 0 || isProcessing}
        onClick={handleCheckout}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Checkout {formatCurrency(total)}
          </>
        )}
      </Button>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReturnDialog(true)}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Return
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDiscountDialog(true)}
        >
          <Percent className="h-4 w-4 mr-2" />
          Discount
        </Button>
      </div>
    </div>
  );
};
```

---

## POS System Implementation

### Mini Service Structure

```
mini-services/pos-service/
├── index.ts                 # Entry point
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── server.ts            # Socket.IO server setup
│   ├── api/
│   │   ├── transactions.ts  # Transaction endpoints
│   │   ├── payments.ts      # Payment processing
│   │   ├── returns.ts       # Return processing
│   │   ├── shifts.ts        # Shift management
│   │   └── registers.ts     # Register management
│   ├── services/
│   │   ├── transaction.service.ts
│   │   ├── payment.service.ts
│   │   ├── inventory.service.ts
│   │   ├── receipt.service.ts
│   │   ├── sync.service.ts  # Offline sync
│   │   └── queue.service.ts # Transaction queue
│   ├── hardware/
│   │   ├── scanner.ts       # Barcode scanner
│   │   ├── printer.ts       # Receipt printer
│   │   ├── cash-drawer.ts   # Cash drawer
│   │   ├── card-reader.ts   # Card reader
│   │   └── index.ts         # Hardware manager
│   ├── database/
│   │   ├── cloud-db.ts      # Cloudflare D1 client
│   │   └── local-db.ts      # Local SQLite (offline)
│   ├── types.ts
│   └── utils.ts
└── tests/
    ├── unit/
    └── integration/
```

### Server Setup

```typescript
// mini-services/pos-service/src/server.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import { setupTransactionHandlers } from './api/transactions';
import { setupPaymentHandlers } from './api/payments';
import { setupSyncHandlers } from './services/sync.service';

const PORT = 3004;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Setup API handlers
setupTransactionHandlers(io);
setupPaymentHandlers(io);
setupSyncHandlers(io);

// Connection handling
io.on('connection', (socket) => {
  console.log('POS client connected:', socket.id);

  // Register handshake
  socket.on('register', (data: { registerId: string, storeId: string }) => {
    socket.join(`register:${data.registerId}`);
    socket.join(`store:${data.storeId}`);
    console.log(`Register ${data.registerId} connected`);
  });

  socket.on('disconnect', () => {
    console.log('POS client disconnected:', socket.id);
  });
});

// Health check
httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'pos-service' }));
  }
});

httpServer.listen(PORT, () => {
  console.log(`POS Service running on port ${PORT}`);
});
```

### Transaction Service

```typescript
// mini-services/pos-service/src/services/transaction.service.ts
import { PrismaClient } from '@prisma/client';
import { generateOrderNumber } from '../utils';

export class TransactionService {
  constructor(private db: PrismaClient) {}

  async createTransaction(data: CreateTransactionDTO) {
    // Validate shift is open
    const shift = await this.db.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift || shift.status !== 'OPEN') {
      throw new Error('Shift must be open to create transaction');
    }

    // Create transaction
    const transaction = await this.db.pOSTransaction.create({
      data: {
        registerId: data.registerId,
        shiftId: data.shiftId,
        staffId: data.staffId,
        customerId: data.customerId,
        type: data.type,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        status: 'COMPLETED',
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            tax: item.tax,
            discount: item.discount,
          })),
        },
      },
      include: {
        items: true,
        shift: true,
        register: true,
      },
    });

    // Update inventory
    await this.updateInventory(data.items, data.registerId);

    // Generate order number
    const orderNumber = await generateOrderNumber(transaction.id);
    await this.db.pOSTransaction.update({
      where: { id: transaction.id },
      data: { orderNumber },
    });

    return { ...transaction, orderNumber };
  }

  private async updateInventory(
    items: TransactionItemDTO[],
    registerId: string
  ) {
    const register = await this.db.register.findUnique({
      where: { id: registerId },
      include: { location: true },
    });

    if (!register?.locationId) {
      throw new Error('Register location not configured');
    }

    for (const item of items) {
      const inventory = await this.db.inventory.findUnique({
        where: {
          productId_storeId_locationId: {
            productId: item.productId,
            storeId: register.storeId,
            locationId: register.locationId,
          },
        },
      });

      if (inventory) {
        await this.db.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        // Log movement
        await this.db.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            type: 'SALE',
            quantity: -item.quantity,
            source: 'POS',
            sourceId: registerId,
          },
        });

        // Check low stock
        if (inventory.quantity - item.quantity <= inventory.reorderPoint) {
          // Emit low stock alert
          this.emitLowStockAlert({
            productId: item.productId,
            quantity: inventory.quantity - item.quantity,
            reorderPoint: inventory.reorderPoint,
          });
        }
      }
    }
  }

  private emitLowStockAlert(data: LowStockAlert) {
    // Emit to all connected clients
    io.emit('inventory:low_stock', data);
  }
}
```

### Hardware Integration

```typescript
// mini-services/pos-service/src/hardware/scanner.ts
import { HID } from 'node-hid';

export class BarcodeScanner {
  private device: HID | null = null;

  constructor() {
    this.findScanner();
  }

  private findScanner() {
    const devices = HID.devices();
    const scanner = devices.find(d =>
      d.vendorId === 0x05F9 && d.productId === 0x2200 // Example scanner
    );

    if (scanner) {
      try {
        this.device = new HID(scanner.vendorId, scanner.productId);
        this.setupListeners();
        console.log('Barcode scanner connected');
      } catch (error) {
        console.error('Failed to connect to scanner:', error);
      }
    }
  }

  private setupListeners() {
    if (!this.device) return;

    let barcodeBuffer = '';

    this.device.on('data', (data) => {
      // Convert data to string
      const text = data.toString('utf-8').replace(/\0/g, '');

      // Check for enter key (end of barcode)
      if (text.includes('\n') || text.includes('\r')) {
        const barcode = barcodeBuffer.trim();
        if (barcode) {
          this.emitScan(barcode);
        }
        barcodeBuffer = '';
      } else {
        barcodeBuffer += text;
      }
    });

    this.device.on('error', (error) => {
      console.error('Scanner error:', error);
    });
  }

  private emitScan(barcode: string) {
    // Emit to all clients
    io.emit('scanner:scan', { barcode, timestamp: new Date() });
  }

  disconnect() {
    if (this.device) {
      this.device.close();
      this.device = null;
    }
  }
}
```

```typescript
// mini-services/pos-service/src/hardware/printer.ts
import escpos from 'escpos';
import usb from 'escpos-usb';

export class ReceiptPrinter {
  private device: escpos.Printer | null = null;

  async connect() {
    const device = new usb.Device();
    try {
      const printer = new escpos.Printer(device);
      this.device = printer;
      console.log('Receipt printer connected');
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  async printReceipt(transaction: POSTransaction) {
    if (!this.device) {
      throw new Error('Printer not connected');
    }

    const device = this.device;

    return new Promise((resolve, reject) => {
      device
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text(transaction.register.store.name)
        .text('RECEIPT')
        .style('normal')
        .drawLine()
        .align('lt')
        .text(`Order #: ${transaction.orderNumber}`)
        .text(`Date: ${new Date(transaction.createdAt).toLocaleString()}`)
        .text(`Register: ${transaction.register.name}`)
        .drawLine()
        .text('ITEMS')
        .text('--------------------')
        .then(() => {
          // Print items
          let chain = device;
          for (const item of transaction.items) {
            chain = chain
              .text(`${item.name}`)
              .text(`  ${item.quantity} x ${item.unitPrice} = ${item.totalPrice}`);
          }
          return chain;
        })
        .then((chain) => {
          // Print totals
          return chain
            .drawLine()
            .text(`Subtotal: ${transaction.subtotal}`)
            .text(`Tax: ${transaction.tax}`)
            .text(`Discount: -${transaction.discount}`)
            .text(`--------------------`)
            .size(1, 2)
            .text(`TOTAL: ${transaction.total}`)
            .size(1, 1)
            .drawLine()
            .text('PAYMENT')
            .text('--------------------');
        })
        .then((chain) => {
          // Print payments
          const payments = JSON.parse(JSON.stringify(transaction.payments));
          for (const payment of payments) {
            chain = chain.text(`${payment.method}: ${payment.amount}`);
          }
          return chain;
        })
        .then((chain) => {
          return chain
            .drawLine()
            .align('ct')
            .text('Thank you for shopping!')
            .text(transaction.register.store.businessName || '')
            .cut()
            .close();
        })
        .then(() => resolve(true))
        .catch((error) => reject(error));
    });
  }
}
```

### Offline Sync

```typescript
// mini-services/pos-service/src/services/sync.service.ts
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

export class SyncService {
  private localDb: Database.Database;
  private cloudDb: PrismaClient;
  private syncQueue: SyncQueueItem[] = [];

  constructor() {
    this.localDb = new Database('./pos-local.db');
    this.cloudDb = new PrismaClient();
    this.initLocalDb();
    this.startSyncWorker();
  }

  private initLocalDb() {
    // Create local tables
    this.localDb.exec(`
      CREATE TABLE IF NOT EXISTS pending_transactions (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        last_attempt TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inventory_cache (
        product_id TEXT,
        store_id TEXT,
        location_id TEXT,
        quantity INTEGER,
        last_updated TEXT NOT NULL,
        PRIMARY KEY (product_id, store_id, location_id)
      );
    `);
  }

  async queueTransaction(data: CreateTransactionDTO) {
    const item: SyncQueueItem = {
      id: generateId(),
      type: 'transaction',
      data,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    // Save to local queue
    const stmt = this.localDb.prepare(`
      INSERT INTO pending_transactions (id, data, created_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(item.id, JSON.stringify(item.data), item.createdAt);

    this.syncQueue.push(item);
  }

  private async startSyncWorker() {
    setInterval(async () => {
      if (navigator.onLine) {
        await this.processQueue();
      }
    }, 5000); // Check every 5 seconds
  }

  private async processQueue() {
    const pending = this.localDb.prepare(`
      SELECT * FROM pending_transactions
      ORDER BY created_at ASC
      LIMIT 10
    `).all() as SyncQueueItem[];

    for (const item of pending) {
      try {
        await this.syncItem(item);
        // Remove from queue
        this.localDb.prepare('DELETE FROM pending_transactions WHERE id = ?')
          .run(item.id);
      } catch (error) {
        // Update attempt count
        this.localDb.prepare(`
          UPDATE pending_transactions
          SET attempts = attempts + 1, last_attempt = ?
          WHERE id = ?
        `).run(new Date().toISOString(), item.id);

        // Max retries reached, mark for manual review
        if (item.attempts >= 10) {
          // Log error for manual review
          console.error('Max sync attempts reached for item:', item.id);
        }
      }
    }
  }

  private async syncItem(item: SyncQueueItem) {
    switch (item.type) {
      case 'transaction':
        return this.syncTransaction(item.data as CreateTransactionDTO);
      case 'inventory':
        return this.syncInventory(item.data as InventoryUpdate);
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  private async syncTransaction(data: CreateTransactionDTO) {
    // Check if already synced
    const existing = await this.cloudDb.pOSTransaction.findFirst({
      where: { orderNumber: data.orderNumber },
    });

    if (existing) {
      return { synced: false, reason: 'Already exists' };
    }

    // Create transaction in cloud
    const transaction = await this.cloudDb.pOSTransaction.create({
      data: {
        ...data,
        syncedAt: new Date(),
      },
    });

    return { synced: true, transaction };
  }

  private async syncInventory(data: InventoryUpdate) {
    // Update cloud inventory
    await this.cloudDb.inventory.update({
      where: { id: data.inventoryId },
      data: { quantity: data.quantity },
    });

    return { synced: true };
  }

  async pullLatestInventory(storeId: string) {
    // Fetch from cloud
    const inventory = await this.cloudDb.inventory.findMany({
      where: { storeId },
      include: { product: true, location: true },
    });

    // Update local cache
    const stmt = this.localDb.prepare(`
      INSERT OR REPLACE INTO inventory_cache
      (product_id, store_id, location_id, quantity, last_updated)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of inventory) {
      stmt.run(
        item.productId,
        item.storeId,
        item.locationId || '',
        item.quantity,
        new Date().toISOString()
      );
    }

    return inventory.length;
  }
}
```

---

## Security Considerations

### Authentication & Authorization

#### Multi-Store Access Control
```typescript
// Store Access Middleware
export async function requireStoreAccess(
  request: Request,
  storeId: string
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has access to this store
  const storeAccess = await db.storeStaff.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId,
      },
    },
  });

  if (!storeAccess) {
    // Check if user is super admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return storeAccess;
}

// Role-based permissions
export const PERMISSIONS = {
  STORE_OWNER: ['*'],
  MANAGER: [
    'products:read',
    'products:write',
    'inventory:read',
    'inventory:write',
    'orders:read',
    'orders:write',
    'staff:read',
    'reports:read',
  ],
  CASHIER: [
    'products:read',
    'inventory:read',
    'orders:write',
  ],
  STOCK_MANAGER: [
    'inventory:read',
    'inventory:write',
  ],
  VIEWER: [
    'products:read',
    'inventory:read',
    'orders:read',
    'reports:read',
  ],
} as const;

export function hasPermission(
  role: StaffRole,
  permission: string
): boolean {
  const permissions = PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
}
```

#### POS Authentication
```typescript
// POS Register Authentication
export async function authenticatePOS(
  registerId: string,
  pinCode: string
) {
  const register = await db.register.findUnique({
    where: { id: registerId },
    include: { store: true },
  });

  if (!register || !register.isActive) {
    throw new Error('Register not found or inactive');
  }

  // Validate PIN code (should be stored hashed)
  const staff = await db.user.findFirst({
    where: {
      stores: {
        some: { storeId: register.storeId },
      },
    },
  });

  if (!staff || !verifyPIN(pinCode, staff.pinCode)) {
    throw new Error('Invalid PIN code');
  }

  // Create session token
  const token = generatePOSRegisterToken({
    registerId,
    staffId: staff.id,
    storeId: register.storeId,
  });

  return { token, register, staff };
}
```

### Data Security

#### Encryption
- **Database**: Cloudflare D1 encryption at rest
- **Transit**: TLS 1.3 for all API calls
- **Local Data**: SQLite database encryption for offline POS
- **Sensitive Data**: PIN codes hashed with bcrypt

#### Input Validation
```typescript
// Validate store input
import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/).optional(),
  storeType: z.enum(['ONLINE', 'PHYSICAL', 'OMNICHANNEL', 'MARKETPLACE', 'B2B']),
  currency: z.string().length(3).default('USD'),
  locale: z.string().default('en-US'),
});

export const createTransactionSchema = z.object({
  registerId: z.string().cuid(),
  shiftId: z.string().cuid(),
  staffId: z.string().cuid(),
  type: z.enum(['SALE', 'RETURN', 'EXCHANGE', 'REFUND']),
  items: z.array(z.object({
    productId: z.string().cuid(),
    sku: z.string(),
    name: z.string(),
    quantity: z.int().min(1),
    unitPrice: z.number().min(0),
    tax: z.number().min(0),
    discount: z.number().min(0).optional(),
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  payments: z.array(z.object({
    method: z.string(),
    amount: z.number().min(0),
    reference: z.string().optional(),
  })),
});
```

### Audit Logging

```typescript
// Audit logging for critical actions
export async function logAuditEvent(data: {
  userId: string;
  storeId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}) {
  await db.auditLog.create({
    data: {
      ...data,
      timestamp: new Date(),
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
    },
  });
}

// Usage example
await logAuditEvent({
  userId: session.user.id,
  storeId: storeId,
  action: 'DELETE',
  resource: 'PRODUCT',
  resourceId: productId,
  metadata: { reason: 'Discontinued' },
});
```

---

## Testing Strategy

### Unit Tests

#### Model Tests
```typescript
// tests/unit/stores.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';

describe('Store Model', () => {
  beforeEach(async () => {
    // Clear database
    await db.store.deleteMany();
  });

  it('should create a store with required fields', async () => {
    const store = await db.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store',
        ownerId: 'user-id',
        currency: 'USD',
        locale: 'en-US',
      },
    });

    expect(store).toHaveProperty('id');
    expect(store.name).toBe('Test Store');
    expect(store.slug).toBe('test-store');
    expect(store.isActive).toBe(true);
  });

  it('should enforce unique slug per store', async () => {
    await db.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store',
        ownerId: 'user-id',
      },
    });

    await expect(
      db.store.create({
        data: {
          name: 'Another Store',
          slug: 'test-store',
          ownerId: 'user-id',
        },
      })
    ).rejects.toThrow();
  });
});
```

### Integration Tests

#### API Tests
```typescript
// tests/integration/store-api.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/stores/route';

describe('Store API', () => {
  beforeEach(async () => {
    // Setup test user and session
    await setupTestSession();
  });

  it('should create a new store', async () => {
    const response = await POST(
      new Request('http://localhost/api/stores', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Integration Test Store',
          slug: 'integration-test',
          storeType: 'ONLINE',
        }),
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.store.name).toBe('Integration Test Store');
  });

  it('should validate store slug format', async () => {
    const response = await POST(
      new Request('http://localhost/api/stores', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Invalid Store',
          slug: 'Invalid Slug!',
        }),
      })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('slug');
  });
});
```

### E2E Tests

#### Multi-Store Flow
```typescript
// tests/e2e/multi-store-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Multi-Store Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should create and switch between stores', async ({ page }) => {
    // Create first store
    await page.click('text=Stores');
    await page.click('text=New Store');
    await page.fill('input[name="name"]', 'Store A');
    await page.fill('input[name="slug"]', 'store-a');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Store A created')).toBeVisible();

    // Create second store
    await page.click('text=New Store');
    await page.fill('input[name="name"]', 'Store B');
    await page.fill('input[name="slug"]', 'store-b');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Store B created')).toBeVisible();

    // Switch stores
    await page.selectOption('[data-testid="store-selector"]', 'Store B');
    await expect(page.locator('text=Store B')).toBeVisible();

    // Verify context changed
    await page.goto('/admin/products');
    const currentStore = await page.textContent('[data-testid="current-store"]');
    expect(currentStore).toBe('Store B');
  });

  test('should sync inventory across stores', async ({ page }) => {
    // Setup: Create product and add to both stores
    await page.goto('/admin/products/new');
    await page.fill('input[name="name"]', 'Test Product');
    await page.fill('input[name="sku"]', 'TEST-001');
    await page.fill('input[name="price"]', '10.00');
    await page.click('button[type="submit"]');

    // Add to Store A with quantity 100
    await page.goto('/admin/inventory');
    await page.click('text=Adjust');
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('[name="store"]', 'Store A');
    await page.click('text=Save');

    // Transfer to Store B
    await page.click('text=Transfer');
    await page.fill('input[name="quantity"]', '50');
    await page.selectOption('[name="fromLocation"]', 'Store A');
    await page.selectOption('[name="toLocation"]', 'Store B');
    await page.click('text=Save');

    // Verify inventory
    await page.goto('/admin/inventory');
    await expect(page.locator('text=Store A: 50')).toBeVisible();
    await expect(page.locator('text=Store B: 50')).toBeVisible();
  });
});
```

#### POS Flow
```typescript
// tests/e2e/pos-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('POS System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pos');
    // Open shift
    await page.fill('input[name="startCash"]', '100');
    await page.click('text=Open Shift');
  });

  test('should complete a sale', async ({ page }) => {
    // Add product to cart
    await page.fill('input[placeholder="Search products..."]', 'TEST-001');
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await expect(page.locator('text=Test Product')).toBeVisible();

    // Checkout with cash
    await page.click('button:has-text("Checkout")');
    await page.click('button:has-text("Cash")');
    await page.fill('input[name="amountGiven"]', '20');
    await page.click('text=Complete');

    // Verify transaction
    await expect(page.locator('text=Transaction completed')).toBeVisible();
    await expect(page.locator('text=Order #')).toBeVisible();
  });

  test('should process a return', async ({ page }) => {
    // First complete a sale
    await page.fill('input[placeholder="Search products..."]', 'TEST-001');
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await page.click('button:has-text("Checkout")');
    await page.click('button:has-text("Cash")');
    await page.fill('input[name="amountGiven"]', '20');
    await page.click('text=Complete');

    // Process return
    const orderNumber = await page.textContent('[data-testid="order-number"]');
    await page.click('text=Return');
    await page.fill('input[name="orderNumber"]', orderNumber);
    await page.click('text=Lookup');

    // Select items to return
    await page.check('input[type="checkbox"]');
    await page.selectOption('[name="reason"]', 'Customer Change');
    await page.click('text=Process Return');

    // Verify refund
    await expect(page.locator('text=Return processed')).toBeVisible();
  });

  test('should handle offline mode', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);

    // Add products to cart
    await page.fill('input[placeholder="Search products..."]', 'TEST-001');
    await page.press('input[placeholder="Search products..."]', 'Enter');

    // Checkout (should queue)
    await page.click('button:has-text("Checkout")');
    await page.click('button:has-text("Cash")');
    await page.fill('input[name="amountGiven"]', '20');
    await page.click('text=Complete');

    // Should show queued message
    await expect(page.locator('text=Transaction queued')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Verify sync
    await page.waitForTimeout(5000); // Wait for sync
    await expect(page.locator('text=Synced')).toBeVisible();
  });
});
```

---

## Deployment Plan

### Environment Setup

#### Environment Variables

**Main Application (.env)**
```env
# Database
DATABASE_URL="file:./db.sqlite"

# Multi-Store
DEFAULT_STORE_ID=""
ALLOWED_DOMAINS="example.com,*.example.com"

# API URLs
REALTIME_SERVICE_URL="http://localhost:3003"
POS_SERVICE_URL="http://localhost:3004"

# Security
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# Email (optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

**POS Service (mini-services/pos-service/.env)**
```env
# Database
DATABASE_URL="file:../../db/db.sqlite"

# API
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"

# Security
JWT_SECRET=""

# Hardware
PRINTER_DEVICE=""
SCANNER_VENDOR_ID=""
SCANNER_PRODUCT_ID=""
```

#### Deployment Steps

1. **Database Migration**
```bash
# Apply schema changes
bun run db:push

# Seed initial data (optional)
bun run db:seed
```

2. **Main Application**
```bash
# Build application
bun run build

# Start production server
bun run start
```

3. **Realtime Service**
```bash
cd mini-services/realtime-service
bun run build
bun run start
```

4. **POS Service**
```bash
cd mini-services/pos-service
bun run build
bun run start
```

### Cloudflare Workers Deployment

**Configuration (wrangler.toml)**
```toml
name = "scommerce"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "scommerce-db"
database_id = "your-database-id"

# KV Storage (for caching)
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"

# Environment variables
[vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://yourdomain.com"

# Secrets (set via CLI)
# wrangler secret put JWT_SECRET
```

**Deploy Commands**
```bash
# Deploy main application
npx wrangler deploy

# Deploy POS service as separate worker
npx wrangler deploy pos-service --name scommerce-pos

# Deploy realtime service as separate worker
npx wrangler deploy realtime-service --name scommerce-realtime
```

---

## Maintenance & Scaling

### Monitoring

#### Health Checks
```typescript
// src/app/api/health/route.ts
import { db } from '@/lib/db';

export async function GET() {
  const checks = {
    database: false,
    realtime: false,
    pos: false,
    cache: false,
  };

  try {
    // Check database
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // Check realtime service
    const response = await fetch(`${process.env.REALTIME_SERVICE_URL}/health`);
    checks.realtime = response.ok;
  } catch (error) {
    console.error('Realtime service health check failed:', error);
  }

  try {
    // Check POS service
    const response = await fetch(`${process.env.POS_SERVICE_URL}/health`);
    checks.pos = response.ok;
  } catch (error) {
    console.error('POS service health check failed:', error);
  }

  const status = Object.values(checks).every(Boolean) ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;

  return Response.json({
    status,
    checks,
    timestamp: new Date().toISOString(),
  }, { status: statusCode });
}
```

### Backup Strategy

**Cloudflare D1**
- Automated backups (7-day retention)
- Export database daily
- Store backups in R2 (S3-compatible)

```typescript
// scripts/backup-db.ts
import { exec } from 'child_process';
import { uploadToR2 } from '@/lib/r2';

async function backupDatabase() {
  const date = new Date().toISOString().split('T')[0];
  const filename = `scommerce-db-${date}.sql`;

  // Export database
  exec(`bun run db:export > ${filename}`, async (error) => {
    if (error) {
      console.error('Backup failed:', error);
      return;
    }

    // Upload to R2
    await uploadToR2({
      filename,
      path: `backups/${filename}`,
    });

    console.log(`Backup uploaded: ${filename}`);
  });
}
```

### Scaling Considerations

#### Vertical Scaling
- Upgrade Cloudflare Workers (more CPU/memory)
- Increase D1 storage limits

#### Horizontal Scaling
- Deploy multiple instances of mini services
- Use load balancer for POS service
- Cache responses at edge

#### Caching Strategy
```typescript
// Cache store data
export async function getStoreWithCache(storeId: string) {
  const cacheKey = `store:${storeId}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const store = await db.store.findUnique({
    where: { id: storeId },
  });

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(store), { ttl: 300 });

  return store;
}
```

---

## Timeline & Milestones

### 12-Week Implementation Plan

| Week | Phase | Tasks | Deliverables |
|------|-------|-------|--------------|
| 1-2 | Foundation | Database schema, middleware, API foundation | ✓ Schema updated<br>✓ Store detection working<br>✓ Basic API endpoints |
| 3 | Multi-Store Admin | Store management UI | ✓ Store list/detail pages<br>✓ Store creation form |
| 4 | Multi-Store Admin | Product management | ✓ Store product override<br>✓ Bulk operations |
| 5 | Multi-Store Admin | Inventory management | ✓ Inventory dashboard<br>✓ Location management |
| 6 | POS Backend | POS service setup | ✓ Mini service running<br>✓ Socket.IO connected |
| 7 | POS Backend | Transaction processing | ✓ Transaction API<br>✓ Payment processing |
| 8 | POS Backend | Hardware integration | ✓ Scanner working<br>✓ Printer working |
| 9 | POS Frontend | Web POS interface | ✓ Product grid<br>✓ Shopping cart |
| 10 | POS Frontend | Checkout & shifts | ✓ Checkout flow<br>✓ Shift management |
| 11 | Integration | Testing & sync | ✓ Multi-store POS sync<br>✓ Offline sync |
| 12 | Launch | Documentation & deployment | ✓ API docs<br>✓ User guides<br>✓ Production deployment |

### Critical Path

```
Week 1-2: Foundation (MUST complete first)
    ↓
Week 3-5: Multi-Store Admin (in parallel with POS Backend)
    ↓                          ↓
Week 6-8: POS Backend    →   POS Frontend
    ↓                          ↓
Week 9-10: Integration & Testing
    ↓
Week 11-12: Documentation & Launch
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database migration issues | Medium | High | Create backup, test on staging |
| Offline sync conflicts | Medium | Medium | Implement conflict resolution, retry logic |
| Hardware compatibility | High | Low | Support multiple hardware vendors |
| Performance degradation | Low | High | Implement caching, optimize queries |
| WebSocket connection drops | Medium | Medium | Auto-reconnect, queue messages |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Delayed timeline | Medium | Medium | Buffer time in schedule |
| Scope creep | High | Medium | Strict change control process |
| User adoption issues | Medium | High | Comprehensive documentation, training |
| Cost overruns | Low | Medium | Cloudflare free tier, monitor usage |

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding multi-store management and POS system capabilities to SCommerce. Upon completion:

✅ **Platform Rating**: 96/100 → 98/100
✅ **Enterprise Readiness**: 70% → 95%
✅ **Target Market**: $0-50M → $0-100M+ revenue
✅ **Competitive Position**: Top 1% → Top 0.5% globally
✅ **Cost Advantage**: Maintain 100x cost savings vs enterprise solutions

The phased approach ensures manageable development cycles while delivering value incrementally. The technical architecture leverages existing infrastructure (Next.js 16, Cloudflare D1, Socket.IO) while adding new capabilities through mini services.

---

**Document Version:** 2.0
**Last Updated:** 2025
**Next Review:** After Phase 1 completion

---

## Appendix A: Quick Reference

### Key Files
- Database Schema: `prisma/schema.prisma`
- Store Middleware: `src/middleware/store-detection.ts`
- Multi-Store Admin: `src/app/admin/stores/`
- POS Frontend: `src/app/pos/`
- POS Service: `mini-services/pos-service/`
- Realtime Service: `mini-services/realtime-service/`

### Key Commands
```bash
# Database
bun run db:push          # Apply schema changes
bun run db:seed          # Seed test data
bun run db:studio        # Open database viewer

# Development
bun run dev              # Start main application
bun run dev:pos          # Start POS service
bun run dev:realtime     # Start realtime service

# Testing
bun run test             # Run all tests
bun run test:unit        # Unit tests only
bun run test:e2e         # E2E tests only

# Build
bun run build            # Build main application
bun run build:pos        # Build POS service
bun run lint             # Check code quality
```

### Support & Resources
- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- Cloudflare D1: https://developers.cloudflare.com/d1
- Socket.IO: https://socket.io/docs/v4/
- shadcn/ui: https://ui.shadcn.com

---

*End of Document*