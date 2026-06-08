// ── Configuration ─────────────────────────────────────────
const API_URL = 'http://localhost:4000/';

// ── GraphQL Helper ────────────────────────────────────────
async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const { data, errors } = await res.json();
  if (errors && errors.length > 0) {
    throw new Error(errors.map(e => e.message).join('\n'));
  }
  return data;
}

// ── Toast Notification ────────────────────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Navigation ────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.page;

      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(`page-${target}`)?.classList.add('active');

      document.querySelector('.topbar h2').textContent = item.querySelector('.nav-label').textContent;

      // Load page data on switch
      if (target === 'dashboard') loadDashboard();
      if (target === 'products')  loadProducts();
      if (target === 'stock')     loadStockPage();
      if (target === 'entities')  loadEntities();
    });
  });
}

// ── Modal Helpers ─────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ──────────────────────────────────────────────────────────
//  DASHBOARD
// ──────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await gql(`
      query {
        getProducts { id stock }
        getCategories { id }
        getBrands { id }
        getSuppliers { id }
        getLowStockProducts(threshold: 5) { id name stock }
      }
    `);

    document.getElementById('metric-products').textContent   = data.getProducts.length;
    document.getElementById('metric-categories').textContent = data.getCategories.length;
    document.getElementById('metric-brands').textContent     = data.getBrands.length;
    document.getElementById('metric-suppliers').textContent  = data.getSuppliers.length;
    document.getElementById('metric-lowstock').textContent   = data.getLowStockProducts.length;

    // Low Stock Alert Table
    const tbody = document.getElementById('lowstock-tbody');
    if (data.getLowStockProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-muted" style="text-align:center;padding:20px;">Semua stok aman ✅</td></tr>`;
    } else {
      tbody.innerHTML = data.getLowStockProducts.map(p => `
        <tr>
          <td>${p.name}</td>
          <td><span class="badge badge-red">⚠️ ${p.stock} unit</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    toast('Gagal memuat dashboard: ' + err.message, 'error');
  }
}

// ──────────────────────────────────────────────────────────
//  PRODUCTS
// ──────────────────────────────────────────────────────────
let allProducts = [], allCategories = [], allBrands = [];

async function loadProducts() {
  try {
    const data = await gql(`
      query {
        getProducts { id name sku price stock category { id name } brand { id name } }
        getCategories { id name }
        getBrands { id name }
      }
    `);

    allProducts   = data.getProducts;
    allCategories = data.getCategories;
    allBrands     = data.getBrands;

    populateCategoryFilter();
    populateBrandFilter();
    populateProductFormDropdowns();
    renderProductTable(allProducts);
  } catch (err) {
    toast('Gagal memuat data produk: ' + err.message, 'error');
  }
}

function populateCategoryFilter() {
  const sel = document.getElementById('filter-category');
  sel.innerHTML = `<option value="">Semua Kategori</option>` +
    allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function populateBrandFilter() {
  const sel = document.getElementById('filter-brand');
  sel.innerHTML = `<option value="">Semua Brand</option>` +
    allBrands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
}

function populateProductFormDropdowns() {
  ['add-product-category', 'edit-product-category'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  });
  ['add-product-brand', 'edit-product-brand'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = allBrands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  });
}

function renderProductTable(products) {
  const tbody = document.getElementById('product-tbody');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📦</div><p>Tidak ada produk ditemukan</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const stockPct   = Math.min(100, (p.stock / 30) * 100);
    const stockClass = p.stock <= 3 ? 'low' : p.stock <= 8 ? 'medium' : '';
    const badgeClass = p.stock <= 3 ? 'badge-red' : p.stock <= 8 ? 'badge-yellow' : 'badge-green';

    return `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td><code style="font-size:11px;background:rgba(255,255,255,0.07);padding:2px 7px;border-radius:4px;">${p.sku}</code></td>
      <td>Rp ${Number(p.price).toLocaleString('id-ID')}</td>
      <td>
        <div class="stock-indicator">
          <div class="stock-bar"><div class="stock-fill ${stockClass}" style="width:${stockPct}%"></div></div>
          <span class="badge ${badgeClass}">${p.stock}</span>
        </div>
      </td>
      <td><span class="badge badge-purple">${p.category?.name || '-'}</span></td>
      <td><span class="badge badge-blue">${p.brand?.name || '-'}</span></td>
      <td>
        <div class="flex gap-8">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditProduct('${p.id}')" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProduct('${p.id}', '${p.name}')" title="Hapus">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterProducts() {
  const search   = document.getElementById('search-product').value.toLowerCase().trim();
  const catId    = document.getElementById('filter-category').value;
  const brandId  = document.getElementById('filter-brand').value;

  const filtered = allProducts.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
    const matchCat    = !catId   || p.category?.id === catId;
    const matchBrand  = !brandId || p.brand?.id === brandId;
    return matchSearch && matchCat && matchBrand;
  });

  renderProductTable(filtered);
}

// ── Add Product ───────────────────────────────────────────
document.getElementById('btn-add-product')?.addEventListener('click', () => {
  document.getElementById('add-product-form').reset();
  openModal('modal-add-product');
});

document.getElementById('add-product-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

  const input = {
    name:       document.getElementById('add-product-name').value,
    sku:        document.getElementById('add-product-sku').value,
    price:      parseFloat(document.getElementById('add-product-price').value),
    stock:      parseInt(document.getElementById('add-product-stock').value),
    categoryId: document.getElementById('add-product-category').value,
    brandId:    document.getElementById('add-product-brand').value,
  };

  try {
    await gql(`
      mutation AddProduct($input: AddProductInput!) {
        addProduct(input: $input) { id }
      }
    `, { input });
    toast('Produk berhasil ditambahkan!', 'success');
    closeModal('modal-add-product');
    loadProducts();
  } catch (err) {
    toast('Gagal: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan Produk';
  }
});

// ── Edit Product ──────────────────────────────────────────
function openEditProduct(id) {
  const p = allProducts.find(p => p.id === id);
  if (!p) return;

  document.getElementById('edit-product-id').value       = p.id;
  document.getElementById('edit-product-name').value     = p.name;
  document.getElementById('edit-product-price').value    = p.price;
  document.getElementById('edit-product-category').value = p.category?.id || '';
  document.getElementById('edit-product-brand').value    = p.brand?.id || '';
  openModal('modal-edit-product');
}

document.getElementById('edit-product-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

  const id = document.getElementById('edit-product-id').value;
  const input = {
    name:       document.getElementById('edit-product-name').value,
    price:      parseFloat(document.getElementById('edit-product-price').value),
    categoryId: document.getElementById('edit-product-category').value,
    brandId:    document.getElementById('edit-product-brand').value,
  };

  try {
    await gql(`
      mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) { id }
      }
    `, { id, input });
    toast('Produk berhasil diperbarui!', 'success');
    closeModal('modal-edit-product');
    loadProducts();
  } catch (err) {
    toast('Gagal: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan Perubahan';
  }
});

// ── Delete Product ────────────────────────────────────────
async function deleteProduct(id, name) {
  if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await gql(`mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }`, { id });
    toast('Produk berhasil dihapus.', 'success');
    loadProducts();
  } catch (err) {
    toast('Gagal: ' + err.message, 'error');
  }
}

// ──────────────────────────────────────────────────────────
//  STOCK TRANSACTIONS
// ──────────────────────────────────────────────────────────
let allProductsForStock = [], allSuppliersForStock = [];

async function loadStockPage() {
  try {
    const data = await gql(`
      query {
        getProducts { id name stock }
        getSuppliers { id name }
        getStockHistory { stockIns { id quantity date notes product { name } supplier { name } } stockOuts { id quantity reason date product { name } } }
      }
    `);

    allProductsForStock  = data.getProducts;
    allSuppliersForStock = data.getSuppliers;

    // Populate stock-in product & supplier dropdowns
    document.getElementById('stockin-product').innerHTML =
      allProductsForStock.map(p => `<option value="${p.id}">${p.name} (stok: ${p.stock})</option>`).join('');
    document.getElementById('stockin-supplier').innerHTML =
      allSuppliersForStock.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    document.getElementById('stockout-product').innerHTML =
      allProductsForStock.map(p => `<option value="${p.id}">${p.name} (stok: ${p.stock})</option>`).join('');

    renderStockHistory(data.getStockHistory);
  } catch (err) {
    toast('Gagal memuat data stok: ' + err.message, 'error');
  }
}

function renderStockHistory({ stockIns, stockOuts }) {
  // Stock In History
  const inTbody = document.getElementById('stockin-history');
  inTbody.innerHTML = stockIns.length === 0
    ? `<tr><td colspan="4" class="text-muted" style="text-align:center;padding:16px">Belum ada transaksi masuk</td></tr>`
    : stockIns.slice().reverse().slice(0, 10).map(s => `
      <tr>
        <td>${s.product?.name}</td>
        <td><span class="badge badge-green">+${s.quantity}</span></td>
        <td>${s.supplier?.name}</td>
        <td class="text-muted">${s.date}</td>
      </tr>`).join('');

  // Stock Out History
  const outTbody = document.getElementById('stockout-history');
  outTbody.innerHTML = stockOuts.length === 0
    ? `<tr><td colspan="4" class="text-muted" style="text-align:center;padding:16px">Belum ada transaksi keluar</td></tr>`
    : stockOuts.slice().reverse().slice(0, 10).map(s => `
      <tr>
        <td>${s.product?.name}</td>
        <td><span class="badge badge-red">-${s.quantity}</span></td>
        <td><span class="badge badge-yellow">${s.reason}</span></td>
        <td class="text-muted">${s.date}</td>
      </tr>`).join('');
}

document.getElementById('stockin-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;

  const input = {
    productId:  document.getElementById('stockin-product').value,
    supplierId: document.getElementById('stockin-supplier').value,
    quantity:   parseInt(document.getElementById('stockin-quantity').value),
    date:       document.getElementById('stockin-date').value,
    notes:      document.getElementById('stockin-notes').value || null,
  };

  try {
    await gql(`
      mutation CreateStockIn($input: StockInInput!) {
        createStockIn(input: $input) { id }
      }
    `, { input });
    toast('Stok masuk berhasil dicatat!', 'success');
    e.target.reset();
    loadStockPage();
  } catch (err) {
    toast('Gagal: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('stockout-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;

  const input = {
    productId: document.getElementById('stockout-product').value,
    quantity:  parseInt(document.getElementById('stockout-quantity').value),
    reason:    document.getElementById('stockout-reason').value,
    date:      document.getElementById('stockout-date').value,
  };

  try {
    await gql(`
      mutation CreateStockOut($input: StockOutInput!) {
        createStockOut(input: $input) { id }
      }
    `, { input });
    toast('Stok keluar berhasil dicatat!', 'success');
    e.target.reset();
    loadStockPage();
  } catch (err) {
    toast('Gagal: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

// ──────────────────────────────────────────────────────────
//  ENTITIES (Category, Brand, Supplier)
// ──────────────────────────────────────────────────────────
async function loadEntities() {
  try {
    const data = await gql(`
      query {
        getCategories { id name }
        getBrands { id name country }
        getSuppliers { id name contact address }
      }
    `);

    renderCategories(data.getCategories);
    renderBrands(data.getBrands);
    renderSuppliers(data.getSuppliers);
  } catch (err) {
    toast('Gagal memuat data: ' + err.message, 'error');
  }
}

function renderCategories(cats) {
  document.getElementById('categories-grid').innerHTML = cats.length === 0
    ? `<div class="empty-state"><div class="empty-icon">🏷️</div><p>Belum ada kategori</p></div>`
    : cats.map(c => `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">🏷️ ${c.name}</div>
            <div class="item-card-sub">ID: ${c.id}</div>
          </div>
        </div>
      </div>`).join('');
}

function renderBrands(brands) {
  document.getElementById('brands-grid').innerHTML = brands.length === 0
    ? `<div class="empty-state"><div class="empty-icon">⭐</div><p>Belum ada brand</p></div>`
    : brands.map(b => `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">⭐ ${b.name}</div>
            <div class="item-card-sub">${b.country || 'Negara tidak diisi'}</div>
          </div>
          <span class="badge badge-blue">Brand</span>
        </div>
      </div>`).join('');
}

function renderSuppliers(suppliers) {
  document.getElementById('suppliers-grid').innerHTML = suppliers.length === 0
    ? `<div class="empty-state"><div class="empty-icon">🏭</div><p>Belum ada supplier</p></div>`
    : suppliers.map(s => `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">🏭 ${s.name}</div>
            <div class="item-card-sub">${s.contact || '-'}</div>
          </div>
        </div>
        <div class="item-card-sub" style="margin-top:8px;">📍 ${s.address || 'Alamat tidak diisi'}</div>
      </div>`).join('');
}

// ── Add Category ──────────────────────────────────────────
document.getElementById('add-category-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('add-category-name').value.trim();
  if (!name) return;
  try {
    await gql(`mutation AddCategory($name: String!) { addCategory(name: $name) { id } }`, { name });
    toast('Kategori berhasil ditambahkan!', 'success');
    e.target.reset();
    loadEntities();
  } catch (err) { toast('Gagal: ' + err.message, 'error'); }
});

// ── Add Brand ─────────────────────────────────────────────
document.getElementById('add-brand-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name    = document.getElementById('add-brand-name').value.trim();
  const country = document.getElementById('add-brand-country').value.trim() || null;
  if (!name) return;
  try {
    await gql(`mutation AddBrand($name: String!, $country: String) { addBrand(name: $name, country: $country) { id } }`, { name, country });
    toast('Brand berhasil ditambahkan!', 'success');
    e.target.reset();
    loadEntities();
  } catch (err) { toast('Gagal: ' + err.message, 'error'); }
});

// ── Add Supplier ──────────────────────────────────────────
document.getElementById('add-supplier-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const input = {
    name:    document.getElementById('add-supplier-name').value.trim(),
    contact: document.getElementById('add-supplier-contact').value.trim() || null,
    address: document.getElementById('add-supplier-address').value.trim() || null,
  };
  if (!input.name) return;
  try {
    await gql(`mutation AddSupplier($input: AddSupplierInput!) { addSupplier(input: $input) { id } }`, { input });
    toast('Supplier berhasil ditambahkan!', 'success');
    e.target.reset();
    loadEntities();
  } catch (err) { toast('Gagal: ' + err.message, 'error'); }
});

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  loadDashboard();

  // Set today's date as default for stock forms
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type=date]');
  dateInputs.forEach(d => d.value = today);
});
