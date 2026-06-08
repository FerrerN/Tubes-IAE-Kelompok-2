// backend/db/init.js
const pool = require('./database');

async function initDB() {
  const conn = await pool.getConnection();

  try {
    // Cek apakah tabel produk sudah ada dan memiliki kolom 'sku'
    let needsRecreation = false;
    try {
      const [columns] = await conn.execute("SHOW COLUMNS FROM produk LIKE 'sku'");
      if (columns.length === 0) {
        needsRecreation = true;
      }
    } catch (err) {
      // Jika tabel produk belum ada, tidak perlu drop paksa
      needsRecreation = false;
    }

    if (needsRecreation) {
      console.log('Skema database lama terdeteksi tidak kompatibel. Membersihkan tabel...');
      await conn.execute('DROP TABLE IF EXISTS stock_out');
      await conn.execute('DROP TABLE IF EXISTS stock_in');
      await conn.execute('DROP TABLE IF EXISTS produk');
      await conn.execute('DROP TABLE IF EXISTS supplier');
      await conn.execute('DROP TABLE IF EXISTS brand');
      await conn.execute('DROP TABLE IF EXISTS kategori');
    }

    // 1. Kategori
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS kategori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL
      )
    `);

    // 2. Brand
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS brand (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        negara VARCHAR(100)
      )
    `);

    // 3. Supplier
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS supplier (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        kontak VARCHAR(100),
        alamat TEXT
      )
    `);

    // 4. Produk
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS produk (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL UNIQUE,
        harga DECIMAL(10,2) NOT NULL,
        stok INT NOT NULL DEFAULT 0,
        kategori_id INT NOT NULL,
        brand_id INT NOT NULL,
        FOREIGN KEY (kategori_id) REFERENCES kategori(id),
        FOREIGN KEY (brand_id) REFERENCES brand(id)
      )
    `);

    // 5. Stock In
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS stock_in (
        id INT AUTO_INCREMENT PRIMARY KEY,
        produk_id INT NOT NULL,
        supplier_id INT NOT NULL,
        quantity INT NOT NULL,
        date VARCHAR(100) NOT NULL,
        notes TEXT,
        FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE,
        FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE CASCADE
      )
    `);

    // 6. Stock Out
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS stock_out (
        id INT AUTO_INCREMENT PRIMARY KEY,
        produk_id INT NOT NULL,
        quantity INT NOT NULL,
        reason VARCHAR(50) NOT NULL,
        date VARCHAR(100) NOT NULL,
        FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
      )
    `);

    // Seed data awal jika kategori kosong
    const [kategoriRows] = await conn.execute('SELECT COUNT(*) as count FROM kategori');
    if (kategoriRows[0].count === 0) {
      console.log('Memasukkan seed data...');
      
      // Seed Kategori
      await conn.execute('INSERT INTO kategori (nama) VALUES (?)', ['Sepatu']);
      await conn.execute('INSERT INTO kategori (nama) VALUES (?)', ['Bola']);
      await conn.execute('INSERT INTO kategori (nama) VALUES (?)', ['Pakaian']);

      // Seed Brand
      await conn.execute('INSERT INTO brand (nama, negara) VALUES (?, ?)', ['Nike', 'USA']);
      await conn.execute('INSERT INTO brand (nama, negara) VALUES (?, ?)', ['Adidas', 'Germany']);
      await conn.execute('INSERT INTO brand (nama, negara) VALUES (?, ?)', ['Spalding', 'USA']);

      // Seed Supplier
      await conn.execute('INSERT INTO supplier (nama, kontak, alamat) VALUES (?, ?, ?)', [
        'PT. Sports Distributor',
        '08123456789',
        'Jl. Sudirman No. 10, Jakarta'
      ]);
      await conn.execute('INSERT INTO supplier (nama, kontak, alamat) VALUES (?, ?, ?)', [
        'CV. Indo Utama',
        '08234567890',
        'Jl. Asia Afrika No. 50, Bandung'
      ]);

      // Seed Produk (FK kategori_id, brand_id)
      // Kategori: Sepatu (1), Brand: Nike (1)
      await conn.execute(
        'INSERT INTO produk (nama, sku, harga, stok, kategori_id, brand_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['Sepatu Futsal Nike Mercurial', 'NIKE-MER-001', 850000, 15, 1, 1]
      );
      // Kategori: Bola (2), Brand: Adidas (2)
      await conn.execute(
        'INSERT INTO produk (nama, sku, harga, stok, kategori_id, brand_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['Bola Kaki Adidas Al Rihla', 'ADI-RIH-002', 450000, 8, 2, 2]
      );

      console.log('Seed data berhasil dimasukkan.');
    }

    console.log('Database siap.');
  } catch (error) {
    console.error('Error saat inisialisasi database:', error);
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = initDB;