// backend/resolvers/productResolver.js
const pool = require('../db/database');
const { mapProduct, mapCategory, mapBrand, mapStockIn, mapStockOut } = require('./helpers');

module.exports = {
  Query: {
    getProducts: async (_, { categoryId, brandId, search }) => {
      try {
        let sql = 'SELECT * FROM produk';
        const conditions = [];
        const params = [];

        if (categoryId) {
          conditions.push('kategori_id = ?');
          params.push(categoryId);
        }

        if (brandId) {
          conditions.push('brand_id = ?');
          params.push(brandId);
        }

        if (search && search.trim() !== '') {
          conditions.push('(nama LIKE ? OR sku LIKE ?)');
          const wildcardSearch = `%${search.trim()}%`;
          params.push(wildcardSearch, wildcardSearch);
        }

        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ');
        }

        const [rows] = await pool.execute(sql, params);
        return rows.map(mapProduct);
      } catch (error) {
        throw new Error(`Gagal mengambil data produk: ${error.message}`);
      }
    },

    getProductById: async (_, { id }) => {
      if (!id) {
        throw new Error('ID produk wajib diisi');
      }

      try {
        const [rows] = await pool.execute('SELECT * FROM produk WHERE id = ?', [id]);
        if (rows.length === 0) {
          return null;
        }
        return mapProduct(rows[0]);
      } catch (error) {
        throw new Error(`Gagal mengambil detail produk: ${error.message}`);
      }
    },

    getLowStockProducts: async (_, { threshold }) => {
      const limit = threshold !== undefined ? threshold : 5;
      try {
        const [rows] = await pool.execute('SELECT * FROM produk WHERE stok <= ?', [limit]);
        return rows.map(mapProduct);
      } catch (error) {
        throw new Error(`Gagal mengambil produk dengan stok rendah: ${error.message}`);
      }
    },
  },

  Mutation: {
    addProduct: async (_, { input }) => {
      const { name, sku, price, stock, categoryId, brandId } = input;

      // 1. Validasi field wajib
      if (!name || name.trim() === '') throw new Error('Nama produk wajib diisi');
      if (!sku || sku.trim() === '') throw new Error('SKU produk wajib diisi');
      if (price === undefined || price < 0) throw new Error('Harga produk tidak valid');
      if (!categoryId) throw new Error('ID kategori wajib diisi');
      if (!brandId) throw new Error('ID brand wajib diisi');

      const trimmedSku = sku.trim();
      const trimmedName = name.trim();

      // 3. Simpan ke MySQL via Sequelize
      const product = await Product.create({
        name, sku, price,
        stock: stock ?? 0,
        categoryId,
        brandId,
      });

      return product;
    },

    // ┌─────────────────────────────────────────┐
    // │  HAPUS PRODUK                           │
    // └─────────────────────────────────────────┘
    deleteProduct: async (_, { id }) => {

      // 1. Validasi ID tidak kosong
      try {
        // 2. Cek apakah SKU sudah ada
        const [existingSku] = await pool.execute('SELECT id FROM produk WHERE sku = ?', [trimmedSku]);
        if (existingSku.length > 0) {
          throw new Error(`SKU "${trimmedSku}" sudah terdaftar`);
        }

        // 3. Cek apakah Kategori ada
        const [existingCategory] = await pool.execute('SELECT id FROM kategori WHERE id = ?', [categoryId]);
        if (existingCategory.length === 0) {
          throw new Error(`Kategori dengan ID "${categoryId}" tidak ditemukan`);
        }

        // 4. Cek apakah Brand ada
        const [existingBrand] = await pool.execute('SELECT id FROM brand WHERE id = ?', [brandId]);
        if (existingBrand.length === 0) {
          throw new Error(`Brand dengan ID "${brandId}" tidak ditemukan`);
        }

        // 5. Simpan ke database
        const initialStock = stock !== undefined ? stock : 0;
        const [result] = await pool.execute(
          'INSERT INTO produk (nama, sku, harga, stok, kategori_id, brand_id) VALUES (?, ?, ?, ?, ?, ?)',
          [trimmedName, trimmedSku, price, initialStock, categoryId, brandId]
        );

        return {
          id: result.insertId.toString(),
          name: trimmedName,
          sku: trimmedSku,
          price,
          stock: initialStock,
          categoryId,
          brandId,
        };
      } catch (error) {
        throw new Error(`Gagal menambahkan produk: ${error.message}`);
      }
    },

    updateProduct: async (_, { id, input }) => {
      const { name, price, categoryId, brandId } = input;

      if (!id) {
        throw new Error('ID produk wajib diisi');
      }

      // 2. Cari produk dulu — pastikan ada
      const product = await Product.findByPk(id);
      if (!product) {
        throw new Error(`Produk dengan ID "${id}" tidak ditemukan`);
      }

      // 3. Hapus dari MySQL
      await product.destroy();
      return true;
    },

    // Lanjut Fauzi
    
  }
};
