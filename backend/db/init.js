// backend/db/init.js
const pool = require('./database');

async function initDB() {
  const conn = await pool.getConnection();

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS kategori (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(100) NOT NULL
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS produk (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      kategori_id INT NOT NULL,
      harga DECIMAL(10,2) NOT NULL,
      stok INT NOT NULL DEFAULT 0,
      FOREIGN KEY (kategori_id) REFERENCES kategori(id)
    )
  `);

  // Seed data awal
  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM kategori');
  if (rows[0].count === 0) {
    await conn.execute('INSERT INTO kategori (nama) VALUES (?)', ['Sepatu']);
    await conn.execute('INSERT INTO kategori (nama) VALUES (?)', ['Bola']);
    await conn.execute('INSERT INTO kategori (nama) VALUES (?)', ['Pakaian']);

    await conn.execute(
      'INSERT INTO produk (nama, kategori_id, harga, stok) VALUES (?, ?, ?, ?)',
      ['Sepatu Futsal Nike', 1, 350000, 10]
    );
    await conn.execute(
      'INSERT INTO produk (nama, kategori_id, harga, stok) VALUES (?, ?, ?, ?)',
      ['Bola Basket Spalding', 2, 500000, 5]
    );

    console.log('Seed data berhasil dimasukkan');
  }

  conn.release();
  console.log('Database siap');
}

module.exports = initDB;