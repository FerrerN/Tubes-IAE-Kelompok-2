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

    // ┌─────────────────────────────────────────┐
    // │  UPDATE PRODUK                          │
    // └─────────────────────────────────────────┘
    updateProduct: async (_, { id, input }) => {
      const { name, sku, price, stock, categoryId, brandId } = input;

      // 1. Validasi ID tidak kosong
      if (!id) {
        throw new Error('ID produk wajib diisi');
      }

      // 2. Cari produk dulu — pastikan ada
      const product = await Product.findByPk(id);
      if (!product) {
        throw new Error(`Produk dengan ID "${id}" tidak ditemukan`);
      }

      // 3. Cek jika SKU diubah, pastikan SKU baru belum dipakai produk lain
      if (sku && sku !== product.sku) {
        const existingSku = await Product.findOne({ where: { sku } });
        if (existingSku) {
          throw new Error(`SKU "${sku}" sudah terdaftar pada produk lain`);
        }
      }

      // 4. Update data ke MySQL via Sequelize
      // Menggunakan fallback data lama jika field tidak dikirim (undefined)
      await product.update({
        name: name !== undefined ? name : product.name,
        sku: sku !== undefined ? sku : product.sku,
        price: price !== undefined ? price : product.price,
        stock: stock !== undefined ? stock : product.stock,
        categoryId: categoryId !== undefined ? categoryId : product.categoryId,
        brandId: brandId !== undefined ? brandId : product.brandId,
      });

      return product;
    }
  }
};
