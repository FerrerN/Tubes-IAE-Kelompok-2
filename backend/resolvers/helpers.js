// backend/resolvers/helpers.js

const mapCategory = (row) => row ? {
  id: row.id.toString(),
  name: row.nama,
} : null;

const mapBrand = (row) => row ? {
  id: row.id.toString(),
  name: row.nama,
  country: row.negara,
} : null;

const mapSupplier = (row) => row ? {
  id: row.id.toString(),
  name: row.nama,
  contact: row.kontak,
  address: row.alamat,
} : null;

const mapProduct = (row) => row ? {
  id: row.id.toString(),
  name: row.nama,
  sku: row.sku,
  price: parseFloat(row.harga),
  stock: row.stok,
  categoryId: row.kategori_id ? row.kategori_id.toString() : null,
  brandId: row.brand_id ? row.brand_id.toString() : null,
} : null;

const mapStockIn = (row) => row ? {
  id: row.id.toString(),
  productId: row.produk_id ? row.produk_id.toString() : null,
  supplierId: row.supplier_id ? row.supplier_id.toString() : null,
  quantity: row.quantity,
  date: row.date,
  notes: row.notes,
} : null;

const mapStockOut = (row) => row ? {
  id: row.id.toString(),
  productId: row.produk_id ? row.produk_id.toString() : null,
  quantity: row.quantity,
  reason: row.reason,
  date: row.date,
} : null;

module.exports = {
  mapCategory,
  mapBrand,
  mapSupplier,
  mapProduct,
  mapStockIn,
  mapStockOut,
};
