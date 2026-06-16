# 🏋️ Sports Inventory System

> Aplikasi manajemen inventaris peralatan olahraga berbasis **GraphQL API** dan **Docker**, dibangun sebagai Tugas Besar mata kuliah Integrasi Aplikasi Enterprise.

**Kelompok 2** | Teknik Informatika / Sistem Informasi

---

## 📋 Daftar Isi
1. [Tentang Project](#-tentang-project)
2. [Arsitektur Sistem](#-arsitektur-sistem)
3. [ERD Database](#-erd-database)
4. [Teknologi](#-teknologi)
5. [Cara Menjalankan (Docker)](#-cara-menjalankan-docker--recommended)
6. [Cara Menjalankan (Lokal)](#-cara-menjalankan-lokal)
7. [Dokumentasi GraphQL API](#-dokumentasi-graphql-api)
8. [Struktur Direktori](#-struktur-direktori)

---

## 📌 Tentang Project

Sports Inventory System adalah aplikasi **end-to-end terintegrasi** yang memungkinkan pengelolaan stok peralatan olahraga secara real-time. Fitur utama:

- ✅ **Dashboard** — Tampilan produk dengan filter, search, dan statistik stok
- ✅ **Manajemen Produk** — Tambah produk baru, lihat semua produk
- ✅ **Manajemen Stok** — Catat stok masuk & keluar, lihat riwayat transaksi
- ✅ **Manajemen Supplier** — Tambah dan kelola data supplier
- ✅ **GraphQL API** — 7 Query + 8 Mutation dengan schema modular
- ✅ **Containerisasi** — 3-service Docker Compose (MySQL + Node.js + Nginx)

---

## 🏗 Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────┐
│                    BROWSER / CLIENT                       │
│              http://localhost:8080                        │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP (static files)
                       ▼
┌──────────────────────────────────────────────────────────┐
│              NGINX CONTAINER (:80 → :8080)                │
│         Menyajikan file HTML/CSS/JS statis                │
└──────────────────────┬───────────────────────────────────┘
                       │ fetch POST (GraphQL JSON)
                       ▼
┌──────────────────────────────────────────────────────────┐
│         BACKEND CONTAINER — Apollo GraphQL Server         │
│              Node.js 18 · Port :4000                      │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  schema/ (modular .graphql files)                   │ │
│  │    types.graphql  inputs.graphql                    │ │
│  │    query.graphql  mutation.graphql                  │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  resolvers/ (terpisah per domain)                   │ │
│  │    productResolver.js    stockResolver.js           │ │
│  │    supplierResolver.js   categoryBrandResolver.js   │ │
│  │    helpers.js (shared mappers)                      │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  db/                                                │ │
│  │    database.js (mysql2 connection pool)             │ │
│  │    init.js (auto-migration + seed data)             │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────┘
                       │ mysql2/promise (TCP :3306)
                       ▼
┌──────────────────────────────────────────────────────────┐
│              DATABASE CONTAINER — MySQL 8.0               │
│           Port :3306 · Volume: mysql_data                 │
│                                                           │
│   kategori   brand   supplier   produk                    │
│   stock_in   stock_out                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄 ERD Database

```
┌──────────────┐     ┌──────────────────────────────────────────┐
│   kategori   │     │                  produk                   │
│─────────────-│     │──────────────────────────────────────────│
│ id (PK)      │──┐  │ id (PK)                                   │
│ nama         │  └─►│ nama          VARCHAR(255) NOT NULL        │
└──────────────┘     │ sku           VARCHAR(100) UNIQUE NOT NULL │
                     │ harga         DECIMAL(10,2) NOT NULL       │
┌──────────────┐     │ stok          INT NOT NULL DEFAULT 0       │
│    brand     │     │ kategori_id   INT FK → kategori.id         │
│──────────────│     │ brand_id      INT FK → brand.id            │
│ id (PK)      │──┐  └────────────────────┬─────────────────────┘
│ nama         │  └───────────────────────┤
│ negara       │            ┌─────────────┴──────────────────┐
└──────────────┘            ▼                                ▼
                  ┌──────────────────┐         ┌───────────────────┐
┌──────────────┐  │    stock_in      │         │    stock_out       │
│   supplier   │  │──────────────── │         │───────────────────│
│──────────────│  │ id (PK)          │         │ id (PK)            │
│ id (PK)      │◄─│ supplier_id (FK) │         │ produk_id (FK)     │
│ nama         │  │ produk_id (FK)   │         │ quantity  INT       │
│ kontak       │  │ quantity  INT    │         │ reason    VARCHAR   │
│ alamat       │  │ date      VARCHAR│         │ date      VARCHAR   │
└──────────────┘  │ notes     TEXT   │         └───────────────────┘
                  └──────────────────┘
```

---

## 🛠 Teknologi

| Layer | Teknologi | Versi |
|---|---|---|
| Backend / API | Node.js + Apollo Server | Node 18, Apollo 4 |
| GraphQL Engine | graphql-js | v16 |
| Database | MySQL | 8.0 |
| DB Driver | mysql2/promise | v3 |
| Frontend | HTML5 + Vanilla CSS + JavaScript | — |
| Web Server | Nginx | Alpine |
| Containerisasi | Docker + Docker Compose | Compose v3.8 |

---

## 🐳 Cara Menjalankan (Docker) — *Recommended*

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstal dan berjalan

### Langkah

```bash
# 1. Clone repository
git clone https://github.com/FerrerN/Tubes-IAE-Kelompok-2.git
cd Tubes-IAE-Kelompok-2

# 2. Jalankan semua service
docker-compose up --build
```

> ⏳ Proses build pertama membutuhkan waktu ±2–3 menit untuk download image.
> Backend akan otomatis menunggu database siap (retry logic).

### Akses Aplikasi

| Service | URL | Keterangan |
|---|---|---|
| 🌐 Frontend | http://localhost:8080 | Dashboard inventaris |
| 🚀 GraphQL API | http://localhost:4000 | Apollo Sandbox (Playground) |
| 🗄 MySQL | localhost:3306 | User: root / Pass: rootpassword |

### Menghentikan Aplikasi
```bash
# Hentikan container
docker-compose down

# Hentikan + hapus data database (reset penuh)
docker-compose down -v
```

---

## 💻 Cara Menjalankan (Lokal)

### Prasyarat
- Node.js v18+
- MySQL 8.0 berjalan lokal dengan database `sport_db`

### Langkah

```bash
# 1. Masuk ke direktori backend
cd backend

# 2. Install dependencies
npm install

# 3. Sesuaikan .env (opsional, sudah ada default)
# DB_HOST=localhost, DB_USER=root, DB_PASSWORD=, DB_NAME=sport_db

# 4. Jalankan server
npm start
# atau untuk development dengan auto-reload:
npm run dev
```

Akses GraphQL API di `http://localhost:4000`

Untuk frontend, buka file `client/index.html` langsung di browser, atau gunakan live server.

---

## 📡 Dokumentasi GraphQL API

Endpoint: `POST http://localhost:4000/`

### 🔍 Query (7 Query)

#### 1. `getProducts` — Daftar semua produk (dengan filter)
```graphql
query {
  getProducts(categoryId: null, brandId: null, search: "nike") {
    id
    name
    sku
    price
    stock
    category { id name }
    brand     { id name }
  }
}
```

#### 2. `getProductById` — Detail produk by ID
```graphql
query {
  getProductById(id: "1") {
    id name sku price stock
    category { name }
    brand     { name }
    stockIns  { quantity date supplier { name } }
    stockOuts { quantity reason date }
  }
}
```

#### 3. `getLowStockProducts` — Produk dengan stok rendah
```graphql
query {
  getLowStockProducts(threshold: 10) {
    id name sku stock
  }
}
```

#### 4. `getCategories` — Semua kategori
```graphql
query {
  getCategories { id name }
}
```

#### 5. `getBrands` — Semua brand/merek
```graphql
query {
  getBrands { id name country }
}
```

#### 6. `getSuppliers` — Semua supplier
```graphql
query {
  getSuppliers { id name contact address }
}
```

#### 7. `getStockHistory` — Riwayat stok masuk & keluar
```graphql
query {
  getStockHistory(productId: null, type: "IN") {
    stockIns {
      id quantity date notes
      product  { name }
      supplier { name }
    }
    stockOuts {
      id quantity reason date
      product { name }
    }
  }
}
```

---

### ✏️ Mutation (8 Mutation)

#### 1. `addProduct` — Tambah produk baru
```graphql
mutation {
  addProduct(input: {
    name:       "Sepatu Futsal Nike Mercurial"
    sku:        "NIKE-MER-001"
    price:      850000
    stock:      15
    categoryId: "1"
    brandId:    "1"
  }) {
    id name sku price stock
    category { name }
    brand    { name }
  }
}
```

#### 2. `updateProduct` — Update data produk
```graphql
mutation {
  updateProduct(id: "1", input: {
    name:  "Sepatu Futsal Nike Mercurial Pro"
    price: 950000
  }) {
    id name price
  }
}
```

#### 3. `deleteProduct` — Hapus produk
```graphql
mutation {
  deleteProduct(id: "1")
}
```

#### 4. `createStockIn` — Catat stok masuk
```graphql
mutation {
  createStockIn(input: {
    productId:  "1"
    supplierId: "1"
    quantity:   50
    date:       "2026-06-09"
    notes:      "Pengiriman batch Juni"
  }) {
    id quantity date
    product  { name }
    supplier { name }
  }
}
```

#### 5. `createStockOut` — Catat stok keluar
```graphql
mutation {
  createStockOut(input: {
    productId: "1"
    quantity:  5
    reason:    SOLD
    date:      "2026-06-09"
  }) {
    id quantity reason date
    product { name }
  }
}
```

#### 6. `addSupplier` — Tambah supplier baru
```graphql
mutation {
  addSupplier(input: {
    name:    "PT. Sports Distributor"
    contact: "08123456789"
    address: "Jl. Sudirman No. 10, Jakarta"
  }) {
    id name contact address
  }
}
```

#### 7. `addCategory` — Tambah kategori baru
```graphql
mutation {
  addCategory(name: "Renang") {
    id name
  }
}
```

#### 8. `addBrand` — Tambah brand baru
```graphql
mutation {
  addBrand(name: "Speedo", country: "UK") {
    id name country
  }
}
```

---

## 📁 Struktur Direktori

```
Tubes-IAE-Kelompok-2/
│
├── 📄 docker-compose.yml          # Orkestrasi 3 service (db + backend + client)
├── 📄 package.json                # Root package info
│
├── 📂 backend/
│   ├── 📄 Dockerfile              # Image Node.js 18 Alpine
│   ├── 📄 index.js                # Entry point + server assembly + retry logic
│   ├── 📄 package.json            # Backend dependencies
│   ├── 📄 .env                    # Environment variables (lokal)
│   │
│   ├── 📂 db/
│   │   ├── 📄 database.js         # MySQL connection pool (mysql2/promise)
│   │   └── 📄 init.js             # Auto-migration + seed data
│   │
│   ├── 📂 schema/                 # GraphQL Schema (modular)
│   │   ├── 📄 types.graphql       # Type definitions (Product, Category, Brand, dll)
│   │   ├── 📄 inputs.graphql      # Input types untuk mutation
│   │   ├── 📄 query.graphql       # Root Query type
│   │   └── 📄 mutation.graphql    # Root Mutation type
│   │
│   └── 📂 resolvers/              # Business logic (terpisah per domain)
│       ├── 📄 productResolver.js  # Resolver Produk (3 query, 3 mutation, 4 field)
│       ├── 📄 stockResolver.js    # Resolver Stok (1 query, 2 mutation, 3 field)
│       ├── 📄 supplierResolver.js # Resolver Supplier (1 query, 1 mutation, 1 field)
│       ├── 📄 categoryBrandResolver.js  # Resolver Kategori & Brand
│       └── 📄 helpers.js          # Shared DB-to-GraphQL mapper functions
│
└── 📂 client/
    └── 📄 index.html              # SPA Frontend (Dashboard + 3 halaman, 4 form mutation)
```

---

## 👥 Anggota Kelompok 2

| No | Nama | NIM | Kontribusi |
|---|---|---|---|
| 1 | *(Anggota 1)* | *(NIM)* | *(Modul yang dikerjakan)* |
| 2 | *(Anggota 2)* | *(NIM)* | *(Modul yang dikerjakan)* |
| 3 | *(Anggota 3)* | *(NIM)* | *(Modul yang dikerjakan)* |
| 4 | *(Anggota 4)* | *(NIM)* | *(Modul yang dikerjakan)* |

---

*Tugas Besar Integrasi Aplikasi Enterprise — 2026*
