module.exports = {
  Query: {
    // stock queries
  },
  Mutation: {
    // ┌─────────────────────────────────────────┐
    // │  UPDATE STOK                            │
    // └─────────────────────────────────────────┘
    updateStok: async (_, { id, stock }) => {
      
      // 1. Validasi ID tidak kosong
      if (!id) {
        throw new Error('ID produk wajib diisi');
      }

      // 2. Cari produk dulu — pastikan ada
      const product = await Product.findByPk(id);
      if (!product) {
        throw new Error(`Produk dengan ID "${id}" tidak ditemukan`);
      }

      // 3. Update khusus untuk field stok saja via Sequelize
      await product.update({
        stock: stock !== undefined ? stock : product.stock
      });

      return product;
    }
  }
};