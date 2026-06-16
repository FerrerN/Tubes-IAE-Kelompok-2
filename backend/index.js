require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const fs = require('fs');
const path = require('path');
const initDB = require('./db/init');

// Read schemas
const types = fs.readFileSync(path.join(__dirname, 'schema', 'types.graphql'), 'utf8');
const inputs = fs.readFileSync(path.join(__dirname, 'schema', 'inputs.graphql'), 'utf8');
const query = fs.readFileSync(path.join(__dirname, 'schema', 'query.graphql'), 'utf8');
const mutation = fs.readFileSync(path.join(__dirname, 'schema', 'mutation.graphql'), 'utf8');

const typeDefs = [types, inputs, query, mutation].join('\n');

// Import resolvers
const productResolver = require('./resolvers/productResolver');
const stockResolver = require('./resolvers/stockResolver');
const supplierResolver = require('./resolvers/supplierResolver');
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
  Product: productResolver.Product,
  StockIn: stockResolver.StockIn,
  StockOut: stockResolver.StockOut,
  Supplier: supplierResolver.Supplier,
  Category: categoryBrandResolver.Category,
  Brand: categoryBrandResolver.Brand,
};

async function startServer() {
  // Inisialisasi database sebelum server berjalan
  await initDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT || 4000, host: '0.0.0.0' },
    context: async ({ req }) => ({ req }),
  });

  console.log(`🚀  Server ready at: ${url}`);
}

startServer();
