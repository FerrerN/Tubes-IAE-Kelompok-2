/**
 * config.js — Konfigurasi GraphQL Endpoint, Query & Mutation
 * Sports Inventory System | Kelompok 2
 */

// ── Endpoint GraphQL ────────────────────────────────────────────
const GQL = 'http://localhost:4000/';

// ══════════════════════════════════════════════════════════════
//  QUERIES
// ══════════════════════════════════════════════════════════════

const Q_GET_PRODUCTS = `
  query GetProducts($categoryId: ID, $brandId: ID, $search: String) {
    getProducts(categoryId: $categoryId, brandId: $brandId, search: $search) {
      id name sku price stock
      category { id name }
      brand     { id name }
    }
  }
`;

const Q_GET_CATEGORIES = `
  query GetCategories {
    getCategories { id name }
  }
`;

const Q_GET_BRANDS = `
  query GetBrands {
    getBrands { id name country }
  }
`;

const Q_GET_SUPPLIERS = `
  query GetSuppliers {
    getSuppliers { id name contact address }
  }
`;

const Q_STOCK_HISTORY = `
  query GetStockHistory($productId: ID, $type: String) {
    getStockHistory(productId: $productId, type: $type) {
      stockIns  { id quantity date notes product { id name } supplier { id name } }
      stockOuts { id quantity reason date product { id name } }
    }
  }
`;

// ══════════════════════════════════════════════════════════════
//  MUTATIONS
// ══════════════════════════════════════════════════════════════

const M_ADD_PRODUCT = `
  mutation AddProduct($input: AddProductInput!) {
    addProduct(input: $input) {
      id name sku price stock
      category { name }
      brand     { name }
    }
  }
`;

const M_CREATE_STOCK_IN = `
  mutation CreateStockIn($input: StockInInput!) {
    createStockIn(input: $input) {
      id quantity date notes
      product  { name }
      supplier { name }
    }
  }
`;

const M_CREATE_STOCK_OUT = `
  mutation CreateStockOut($input: StockOutInput!) {
    createStockOut(input: $input) {
      id quantity reason date
      product { name }
    }
  }
`;

const M_ADD_SUPPLIER = `
  mutation AddSupplier($input: AddSupplierInput!) {
    addSupplier(input: $input) { id name contact address }
  }
`;
