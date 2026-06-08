module.exports = {
  Query: {
    // product queries
  },
  Mutation: {
    // ┌─────────────────────────────────────────┐
    // │  TAMBAH PRODUK                          │
    // └─────────────────────────────────────────┘
    addProduct: async (_, { input }) => {
      const { name, sku, price, stock, categoryId, brandId } = input;

      // 1. Validasi field wajib tidak kosong
      if (!name || !sku || !price || !categoryId || !brandId) {
        throw new Error('Field name, sku, price, categoryId, brandId wajib diisi');
      }

      // 2. Cek SKU sudah ada di DB
      const existing = await Product.findOne({ where: { sku } });
      if (existing) {
        throw new Error(`SKU "${sku}" sudah terdaftar`);
      }

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
