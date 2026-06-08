// backend/resolvers/supplierResolver.js
const pool = require('../db/database');
const { mapSupplier, mapStockIn } = require('./helpers');

module.exports = {
  Query: {
    getSuppliers: async () => {
      try {
        const [rows] = await pool.execute('SELECT * FROM supplier');
        return rows.map(mapSupplier);
      } catch (error) {
        throw new Error(`Gagal mengambil data supplier: ${error.message}`);
      }
    },
  },

  Mutation: {
    addSupplier: async (_, { input }) => {
      const { name, contact, address } = input;
      if (!name || name.trim() === '') {
        throw new Error('Nama supplier wajib diisi');
      }

      try {
        const trimmedName = name.trim();
        const trimmedContact = contact ? contact.trim() : null;
        const trimmedAddress = address ? address.trim() : null;

        const [result] = await pool.execute(
          'INSERT INTO supplier (nama, kontak, alamat) VALUES (?, ?, ?)',
          [trimmedName, trimmedContact, trimmedAddress]
        );
        return {
          id: result.insertId.toString(),
          name: trimmedName,
          contact: trimmedContact,
          address: trimmedAddress,
        };
      } catch (error) {
        throw new Error(`Gagal menambahkan supplier: ${error.message}`);
      }
    },
  },

  Supplier: {
    stockIns: async (supplier) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM stock_in WHERE supplier_id = ?', [supplier.id]);
        return rows.map(mapStockIn);
      } catch (error) {
        throw new Error(`Gagal mengambil data stok masuk supplier: ${error.message}`);
      }
    },
  },
};
