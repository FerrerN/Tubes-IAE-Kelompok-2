require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const initDB = require('./db/init');

// Read schemas
const types    = fs.readFileSync(path.join(__dirname, 'schema', 'types.graphql'),    'utf8');
const inputs   = fs.readFileSync(path.join(__dirname, 'schema', 'inputs.graphql'),   'utf8');
const query    = fs.readFileSync(path.join(__dirname, 'schema', 'query.graphql'),    'utf8');
const mutation = fs.readFileSync(path.join(__dirname, 'schema', 'mutation.graphql'), 'utf8');

const typeDefs = [types, inputs, query, mutation].join('\n');

// Import resolvers
const productResolver       = require('./resolvers/productResolver');
const stockResolver         = require('./resolvers/stockResolver');
const supplierResolver      = require('./resolvers/supplierResolver');
const categoryBrandResolver = require('./resolvers/categoryBrandResolver');

const resolvers = {
  Query: {
    ...productResolver.Query,
    ...stockResolver.Query,
    ...supplierResolver.Query,
    ...categoryBrandResolver.Query,
  },
  Mutation: {
    ...productResolver.Mutation,
    ...stockResolver.Mutation,
    ...supplierResolver.Mutation,
    ...categoryBrandResolver.Mutation,
  },
  Product:  productResolver.Product,
  StockIn:  stockResolver.StockIn,
  StockOut: stockResolver.StockOut,
  Supplier: supplierResolver.Supplier,
  Category: categoryBrandResolver.Category,
  Brand:    categoryBrandResolver.Brand,
};

// Retry logic — tunggu DB siap (penting untuk Docker startup sequence)
async function waitForDB(maxRetries = 20, delayMs = 5000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await initDB();
      return; // Sukses
    } catch (err) {
      if (i === maxRetries) throw err;
      console.log(`⏳  Database belum siap (percobaan ${i}/${maxRetries}). Menunggu ${delayMs / 1000}s...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function startServer() {
  // Inisialisasi database dengan retry (untuk Docker startup)
  await waitForDB();

  const app    = express();
  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();

  // Aktifkan CORS untuk semua origin (akses dari browser & frontend Nginx)
  app.use(
    '/',
    cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }),
  );

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀  GraphQL Server siap di: http://localhost:${PORT}/`);
    console.log(`🏋️   Apollo Sandbox: http://localhost:${PORT}/`);
  });
}

startServer().catch(err => {
  console.error('❌  Gagal menjalankan server:', err.message);
  process.exit(1);
});
