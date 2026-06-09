// backend/resolvers/categoryBrandResolver.js
const pool = require('../db/database');
<<<<<<< Updated upstream
const { mapCategory, mapBrand, mapProduct } = require('./helpers');

module.exports = {
  Query: {
    getCategories: async () => {
      try {
        const [rows] = await pool.execute('SELECT * FROM kategori');
        return rows.map(mapCategory);
      } catch (error) {
        throw new Error(`Gagal mengambil data kategori: ${error.message}`);
      }
    },
    getBrands: async () => {
      try {
        const [rows] = await pool.execute('SELECT * FROM brand');
        return rows.map(mapBrand);
      } catch (error) {
        throw new Error(`Gagal mengambil data brand: ${error.message}`);
      }
=======

module.exports = {
  Query: {
    // ┌─────────────────────────────────────────┐
    // │  SEMUA KATEGORI  (getCategories)         │
    // └─────────────────────────────────────────┘
    getCategories: async () => {
      const [rows] = await pool.execute('SELECT id, nama AS name FROM kategori ORDER BY id');
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        products: [],  // bisa di-resolve terpisah kalau dibutuhkan
      }));
    },

    // ┌─────────────────────────────────────────┐
    // │  SEMUA BRAND  (getBrands)                │
    // │  Tabel brand belum ada di DB,            │
    // │  return array kosong untuk sementara     │
    // └─────────────────────────────────────────┘
    getBrands: async () => {
      // TODO: Buat tabel brand di init.js, lalu query di sini
      return [];
>>>>>>> Stashed changes
    },
  },

  Mutation: {
<<<<<<< Updated upstream
    addCategory: async (_, { name }) => {
      if (!name || name.trim() === '') {
        throw new Error('Nama kategori wajib diisi');
      }

      try {
        const [result] = await pool.execute('INSERT INTO kategori (nama) VALUES (?)', [name.trim()]);
        return {
          id: result.insertId.toString(),
          name: name.trim(),
        };
      } catch (error) {
        throw new Error(`Gagal menambahkan kategori: ${error.message}`);
      }
    },

    addBrand: async (_, { name, country }) => {
      if (!name || name.trim() === '') {
        throw new Error('Nama brand wajib diisi');
      }

      try {
        const trimmedName = name.trim();
        const trimmedCountry = country ? country.trim() : null;
        
        const [result] = await pool.execute(
          'INSERT INTO brand (nama, negara) VALUES (?, ?)',
          [trimmedName, trimmedCountry]
        );
        return {
          id: result.insertId.toString(),
          name: trimmedName,
          country: trimmedCountry,
        };
      } catch (error) {
        throw new Error(`Gagal menambahkan brand: ${error.message}`);
      }
    },
  },

  Category: {
    products: async (category) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM produk WHERE kategori_id = ?', [category.id]);
        return rows.map(mapProduct);
      } catch (error) {
        throw new Error(`Gagal mengambil data produk dalam kategori: ${error.message}`);
      }
    },
  },

  Brand: {
    products: async (brand) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM produk WHERE brand_id = ?', [brand.id]);
        return rows.map(mapProduct);
      } catch (error) {
        throw new Error(`Gagal mengambil data produk dalam brand: ${error.message}`);
      }
    },
  },
=======
    // ┌─────────────────────────────────────────┐
    // │  TAMBAH KATEGORI                        │
    // └─────────────────────────────────────────┘
    addCategory: async (_, { name }) => {
      if (!name) throw new Error('Nama kategori wajib diisi');

      const [result] = await pool.execute(
        'INSERT INTO kategori (nama) VALUES (?)',
        [name]
      );

      return {
        id: result.insertId.toString(),
        name,
        products: [],
      };
    },

    // ┌─────────────────────────────────────────┐
    // │  TAMBAH BRAND                           │
    // │  Belum ada tabel — throw error informatif│
    // └─────────────────────────────────────────┘
    addBrand: async (_, { name, country }) => {
      // TODO: Buat tabel brand di init.js
      throw new Error('Tabel brand belum tersedia di database. Silakan buat tabel terlebih dahulu.');
    },
  }
>>>>>>> Stashed changes
};
