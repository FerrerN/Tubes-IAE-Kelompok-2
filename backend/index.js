require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const fs = require('fs');
const path = require('path');

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
  }
};

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Koneksi ke MySQL berhasil.');
  } catch (error) {
    console.error('❌ Gagal terhubung ke MySQL:', error);
  }
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT || 4000 },
  });

  console.log(`🚀  Server ready at: ${url}`);
}

startServer();
