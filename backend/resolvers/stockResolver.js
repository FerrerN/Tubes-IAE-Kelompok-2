// backend/resolvers/stockResolver.js
const pool = require('../db/database');
const { mapStockIn, mapStockOut, mapProduct, mapSupplier } = require('./helpers');

module.exports = {
  Query: {
    getStockHistory: async (_, { productId, type }) => {
      try {
        let stockIns = [];
        let stockOuts = [];

        if (!type || type.toUpperCase() === 'IN') {
          let sql = 'SELECT * FROM stock_in';
          const params = [];
          if (productId) {
            sql += ' WHERE produk_id = ?';
            params.push(productId);
          }
          const [rows] = await pool.execute(sql, params);
          stockIns = rows.map(mapStockIn);
        }

        if (!type || type.toUpperCase() === 'OUT') {
          let sql = 'SELECT * FROM stock_out';
          const params = [];
          if (productId) {
            sql += ' WHERE produk_id = ?';
            params.push(productId);
          }
          const [rows] = await pool.execute(sql, params);
          stockOuts = rows.map(mapStockOut);
        }

        return {
          stockIns,
          stockOuts,
        };
      } catch (error) {
        throw new Error(`Gagal mengambil riwayat stok: ${error.message}`);
      }
    },
  },

  Mutation: {
    createStockIn: async (_, { input }) => {
      const { productId, supplierId, quantity, date, notes } = input;

      if (!productId) throw new Error('ID produk wajib diisi');
      if (!supplierId) throw new Error('ID supplier wajib diisi');
      if (quantity === undefined || quantity <= 0) throw new Error('Jumlah quantity harus lebih dari 0');
      if (!date || date.trim() === '') throw new Error('Tanggal wajib diisi');

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // 1. Cek apakah produk ada
        const [products] = await conn.execute('SELECT stok FROM produk WHERE id = ?', [productId]);
        if (products.length === 0) {
          throw new Error(`Produk dengan ID "${productId}" tidak ditemukan`);
        }
        const currentStock = products[0].stok;

        // 2. Cek apakah supplier ada
        const [suppliers] = await conn.execute('SELECT id FROM supplier WHERE id = ?', [supplierId]);
        if (suppliers.length === 0) {
          throw new Error(`Supplier dengan ID "${supplierId}" tidak ditemukan`);
        }

        // 3. Catat transaksi stok masuk
        const [insertResult] = await conn.execute(
          'INSERT INTO stock_in (produk_id, supplier_id, quantity, date, notes) VALUES (?, ?, ?, ?, ?)',
          [productId, supplierId, quantity, date.trim(), notes ? notes.trim() : null]
        );

        // 4. Tambah stok produk
        const newStock = currentStock + quantity;
        await conn.execute('UPDATE produk SET stok = ? WHERE id = ?', [newStock, productId]);

        await conn.commit();

        return {
          id: insertResult.insertId.toString(),
          productId,
          supplierId,
          quantity,
          date: date.trim(),
          notes: notes ? notes.trim() : null,
        };
      } catch (error) {
        await conn.rollback();
        throw new Error(`Gagal menambahkan stok masuk: ${error.message}`);
      } finally {
        conn.release();
      }
    },

    createStockOut: async (_, { input }) => {
      const { productId, quantity, reason, date } = input;

      if (!productId) throw new Error('ID produk wajib diisi');
      if (quantity === undefined || quantity <= 0) throw new Error('Jumlah quantity harus lebih dari 0');
      if (!reason) throw new Error('Alasan stok keluar wajib diisi');
      if (!date || date.trim() === '') throw new Error('Tanggal wajib diisi');

      // Validasi reason enum
      const validReasons = ['SOLD', 'DAMAGED', 'RETURNED'];
      if (!validReasons.includes(reason)) {
        throw new Error(`Alasan tidak valid. Harus salah satu dari: ${validReasons.join(', ')}`);
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // 1. Cek apakah produk ada
        const [products] = await conn.execute('SELECT stok FROM produk WHERE id = ?', [productId]);
        if (products.length === 0) {
          throw new Error(`Produk dengan ID "${productId}" tidak ditemukan`);
        }
        const currentStock = products[0].stok;

        // 2. Cek apakah stok cukup
        if (currentStock < quantity) {
          throw new Error(`Stok produk tidak mencukupi. Stok saat ini: ${currentStock}, diminta: ${quantity}`);
        }

        // 3. Catat transaksi stok keluar
        const [insertResult] = await conn.execute(
          'INSERT INTO stock_out (produk_id, quantity, reason, date) VALUES (?, ?, ?, ?)',
          [productId, quantity, reason, date.trim()]
        );

        // 4. Kurangi stok produk
        const newStock = currentStock - quantity;
        await conn.execute('UPDATE produk SET stok = ? WHERE id = ?', [newStock, productId]);

        await conn.commit();

        return {
          id: insertResult.insertId.toString(),
          productId,
          quantity,
          reason,
          date: date.trim(),
        };
      } catch (error) {
        await conn.rollback();
        throw new Error(`Gagal menambahkan stok keluar: ${error.message}`);
      } finally {
        conn.release();
      }
    },
  },

  StockIn: {
    product: async (stockIn) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM produk WHERE id = ?', [stockIn.productId]);
        return rows.length > 0 ? mapProduct(rows[0]) : null;
      } catch (error) {
        throw new Error(`Gagal memuat produk untuk riwayat stok masuk: ${error.message}`);
      }
    },
    supplier: async (stockIn) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM supplier WHERE id = ?', [stockIn.supplierId]);
        return rows.length > 0 ? mapSupplier(rows[0]) : null;
      } catch (error) {
        throw new Error(`Gagal memuat supplier untuk riwayat stok masuk: ${error.message}`);
      }
    },
  },

  StockOut: {
    product: async (stockOut) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM produk WHERE id = ?', [stockOut.productId]);
        return rows.length > 0 ? mapProduct(rows[0]) : null;
      } catch (error) {
        throw new Error(`Gagal memuat produk untuk riwayat stok keluar: ${error.message}`);
      }
    },
  },
};
