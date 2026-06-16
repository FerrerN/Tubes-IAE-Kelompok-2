// backend/resolvers/productResolver.js
const pool = require('../db/database');
<<<<<<< Updated upstream
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

      try {
        // 1. Cari produk memastikan ada
        const [existingRows] = await pool.execute('SELECT * FROM produk WHERE id = ?', [id]);
        if (existingRows.length === 0) {
          throw new Error(`Produk dengan ID "${id}" tidak ditemukan`);
        }
        const currentProduct = existingRows[0];

        // 2. Validasi Kategori jika dirubah
        if (categoryId !== undefined && categoryId !== null) {
          const [existingCategory] = await pool.execute('SELECT id FROM kategori WHERE id = ?', [categoryId]);
          if (existingCategory.length === 0) {
            throw new Error(`Kategori dengan ID "${categoryId}" tidak ditemukan`);
          }
        }

        // 3. Validasi Brand jika dirubah
        if (brandId !== undefined && brandId !== null) {
          const [existingBrand] = await pool.execute('SELECT id FROM brand WHERE id = ?', [brandId]);
          if (existingBrand.length === 0) {
            throw new Error(`Brand dengan ID "${brandId}" tidak ditemukan`);
          }
        }

        // 4. Buat query update dinamis
        const updates = [];
        const params = [];

        if (name !== undefined) {
          updates.push('nama = ?');
          params.push(name.trim());
        }
        if (price !== undefined) {
          if (price < 0) throw new Error('Harga produk tidak boleh kurang dari 0');
          updates.push('harga = ?');
          params.push(price);
        }
        if (categoryId !== undefined) {
          updates.push('kategori_id = ?');
          params.push(categoryId);
        }
        if (brandId !== undefined) {
          updates.push('brand_id = ?');
          params.push(brandId);
        }

        if (updates.length > 0) {
          params.push(id);
          const updateSql = `UPDATE produk SET ${updates.join(', ')} WHERE id = ?`;
          await pool.execute(updateSql, params);
        }

        // Ambil data terbaru untuk dikembalikan
        const [updatedRows] = await pool.execute('SELECT * FROM produk WHERE id = ?', [id]);
        return mapProduct(updatedRows[0]);
      } catch (error) {
        throw new Error(`Gagal mengupdate produk: ${error.message}`);
      }
    },

    deleteProduct: async (_, { id }) => {
      if (!id) {
        throw new Error('ID produk wajib diisi');
      }

      try {
        // Cek apakah produk ada
        const [existing] = await pool.execute('SELECT id FROM produk WHERE id = ?', [id]);
        if (existing.length === 0) {
          throw new Error(`Produk dengan ID "${id}" tidak ditemukan`);
        }

        await pool.execute('DELETE FROM produk WHERE id = ?', [id]);
        return true;
      } catch (error) {
        throw new Error(`Gagal menghapus produk: ${error.message}`);
      }
    },
  },

  Product: {
    category: async (product) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM kategori WHERE id = ?', [product.categoryId]);
        return rows.length > 0 ? mapCategory(rows[0]) : null;
      } catch (error) {
        throw new Error(`Gagal memuat kategori produk: ${error.message}`);
      }
    },
    brand: async (product) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM brand WHERE id = ?', [product.brandId]);
        return rows.length > 0 ? mapBrand(rows[0]) : null;
      } catch (error) {
        throw new Error(`Gagal memuat brand produk: ${error.message}`);
      }
    },
    stockIns: async (product) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM stock_in WHERE produk_id = ?', [product.id]);
        return rows.map(mapStockIn);
      } catch (error) {
        throw new Error(`Gagal memuat riwayat stok masuk produk: ${error.message}`);
      }
    },
    stockOuts: async (product) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM stock_out WHERE produk_id = ?', [product.id]);
        return rows.map(mapStockOut);
      } catch (error) {
        throw new Error(`Gagal memuat riwayat stok keluar produk: ${error.message}`);
      }
    },
  },
};
