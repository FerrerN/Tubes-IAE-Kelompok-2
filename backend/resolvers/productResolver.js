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
=======

module.exports = {
  Query: {
    // ┌─────────────────────────────────────────┐
    // │  SEMUA PRODUK  (getProducts)             │
    // │  Mendukung filter: categoryId, brandId,  │
    // │  dan search (pencarian nama)             │
    // └─────────────────────────────────────────┘
    getProducts: async (_, { categoryId, brandId, search }) => {
      let sql = `
        SELECT p.id, p.nama AS name, p.kategori_id AS categoryId,
               p.harga AS price, p.stok AS stock,
               k.id AS cat_id, k.nama AS cat_name
        FROM produk p
        LEFT JOIN kategori k ON p.kategori_id = k.id
        WHERE 1=1
      `;
      const params = [];

      if (categoryId) {
        sql += ' AND p.kategori_id = ?';
        params.push(categoryId);
      }

      if (search) {
        sql += ' AND p.nama LIKE ?';
        params.push(`%${search}%`);
      }

      const [rows] = await pool.execute(sql, params);

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: '-',               // tabel belum punya kolom SKU
        price: parseFloat(row.price),
        stock: row.stock,
        category: {
          id: row.cat_id,
          name: row.cat_name,
        },
        brand: { id: '0', name: '-' },   // tabel belum punya brand
        stockIns: [],
        stockOuts: [],
      }));
    },

    // ┌─────────────────────────────────────────┐
    // │  PRODUK BY ID  (getProductById)          │
    // └─────────────────────────────────────────┘
    getProductById: async (_, { id }) => {
      const [rows] = await pool.execute(
        `SELECT p.id, p.nama AS name, p.kategori_id AS categoryId,
                p.harga AS price, p.stok AS stock,
                k.id AS cat_id, k.nama AS cat_name
         FROM produk p
         LEFT JOIN kategori k ON p.kategori_id = k.id
         WHERE p.id = ?`,
        [id]
      );

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        sku: '-',
        price: parseFloat(row.price),
        stock: row.stock,
        category: {
          id: row.cat_id,
          name: row.cat_name,
        },
        brand: { id: '0', name: '-' },
        stockIns: [],
        stockOuts: [],
      };
    },

    // ┌─────────────────────────────────────────┐
    // │  LOW STOCK PRODUCTS                      │
    // └─────────────────────────────────────────┘
    getLowStockProducts: async (_, { threshold }) => {
      const limit = threshold ?? 5;
      const [rows] = await pool.execute(
        `SELECT p.id, p.nama AS name, p.kategori_id AS categoryId,
                p.harga AS price, p.stok AS stock,
                k.id AS cat_id, k.nama AS cat_name
         FROM produk p
         LEFT JOIN kategori k ON p.kategori_id = k.id
         WHERE p.stok <= ?`,
        [limit]
      );

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: '-',
        price: parseFloat(row.price),
        stock: row.stock,
        category: {
          id: row.cat_id,
          name: row.cat_name,
        },
        brand: { id: '0', name: '-' },
        stockIns: [],
        stockOuts: [],
      }));
    },
  },

  Mutation: {
    // ┌─────────────────────────────────────────┐
    // │  TAMBAH PRODUK                          │
    // └─────────────────────────────────────────┘
    addProduct: async (_, { input }) => {
      const { name, sku, price, stock, categoryId, brandId } = input;

      // 1. Validasi field wajib tidak kosong
      if (!name || !price || !categoryId) {
        throw new Error('Field name, price, categoryId wajib diisi');
      }

      // 2. Simpan ke MySQL
      const [result] = await pool.execute(
        'INSERT INTO produk (nama, kategori_id, harga, stok) VALUES (?, ?, ?, ?)',
        [name, categoryId, price, stock ?? 0]
      );

      // 3. Ambil data kategori
      const [cats] = await pool.execute('SELECT id, nama FROM kategori WHERE id = ?', [categoryId]);
      const cat = cats[0] || { id: categoryId, nama: '-' };

      return {
        id: result.insertId.toString(),
        name,
        sku: sku || '-',
        price,
        stock: stock ?? 0,
        category: { id: cat.id, name: cat.nama },
        brand: { id: brandId || '0', name: '-' },
        stockIns: [],
        stockOuts: [],
      };
    },

    // ┌─────────────────────────────────────────┐
    // │  UPDATE PRODUK                          │
    // └─────────────────────────────────────────┘
    updateProduct: async (_, { id, input }) => {
      const fields = [];
      const params = [];

      if (input.name !== undefined) { fields.push('nama = ?'); params.push(input.name); }
      if (input.price !== undefined) { fields.push('harga = ?'); params.push(input.price); }
      if (input.categoryId !== undefined) { fields.push('kategori_id = ?'); params.push(input.categoryId); }

      if (fields.length === 0) throw new Error('Tidak ada field yang diupdate');

      params.push(id);
      await pool.execute(`UPDATE produk SET ${fields.join(', ')} WHERE id = ?`, params);

      // Ambil data produk terbaru
      const [rows] = await pool.execute(
        `SELECT p.id, p.nama AS name, p.kategori_id AS categoryId,
                p.harga AS price, p.stok AS stock,
                k.id AS cat_id, k.nama AS cat_name
         FROM produk p
         LEFT JOIN kategori k ON p.kategori_id = k.id
         WHERE p.id = ?`,
        [id]
      );

      if (rows.length === 0) throw new Error(`Produk ID ${id} tidak ditemukan`);

      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        sku: '-',
        price: parseFloat(row.price),
        stock: row.stock,
        category: { id: row.cat_id, name: row.cat_name },
        brand: { id: '0', name: '-' },
        stockIns: [],
        stockOuts: [],
      };
    },

    // ┌─────────────────────────────────────────┐
    // │  HAPUS PRODUK                           │
    // └─────────────────────────────────────────┘
    deleteProduct: async (_, { id }) => {
      if (!id) throw new Error('ID produk wajib diisi');

      const [rows] = await pool.execute('SELECT id FROM produk WHERE id = ?', [id]);
      if (rows.length === 0) throw new Error(`Produk dengan ID "${id}" tidak ditemukan`);

      await pool.execute('DELETE FROM produk WHERE id = ?', [id]);
      return true;
>>>>>>> Stashed changes
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
