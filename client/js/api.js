/**
 * api.js — GraphQL Fetch Helper & Shared State
 * Sports Inventory System | Kelompok 2
 *
 * Depends on: config.js (GQL)
 */

// ── Shared Application State ────────────────────────────────────
let allProducts       = [];
let allSuppliers      = [];
let stockHistory      = { stockIns: [], stockOuts: [] };
let currentStokFilter = 'all';

// ── GraphQL Fetch Helper ────────────────────────────────────────
/**
 * Kirim GraphQL query/mutation ke server.
 * @param {string} query   - Query atau mutation string
 * @param {object} variables - Variabel (opsional)
 * @returns {object} data dari response
 */
async function gql(query, variables = {}) {
  const res = await fetch(GQL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

  const json = await res.json();
  if (json.errors && json.errors.length) throw new Error(json.errors[0].message);

  return json.data;
}
