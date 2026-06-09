/**
 * dashboard.js — Halaman Dashboard: Product Grid, Filter, Stats
 * Sports Inventory System | Kelompok 2
 *
 * Depends on: config.js, api.js, ui.js
 */

// ── Fetch & Load Products ───────────────────────────────────────
async function fetchProducts() {
  setApiStatus('connecting');
  showSkeletons(8);

  try {
    const data  = await gql(Q_GET_PRODUCTS);
    allProducts = data.getProducts || [];

    setApiStatus('connected');
    populateFilters(allProducts);
    populateProductDropdowns(allProducts);
    applyFilters();
  } catch (err) {
    setApiStatus('error');
    showError(err.message);
  }
}

// ── Filter & Sort ───────────────────────────────────────────────
function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase().trim();
  const cat    = document.getElementById('filter-category').value;
  const brand  = document.getElementById('filter-brand').value;
  const sort   = document.getElementById('sort-select').value;

  const filtered = allProducts.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search) ||
      p.sku?.toLowerCase().includes(search)  ||
      p.category?.name?.toLowerCase().includes(search) ||
      p.brand?.name?.toLowerCase().includes(search);
    const matchCat   = !cat   || p.category?.name === cat;
    const matchBrand = !brand || p.brand?.name === brand;
    return matchSearch && matchCat && matchBrand;
  });

  filtered.sort((a, b) => {
    if (sort === 'name-asc')   return (a.name  || '').localeCompare(b.name  || '');
    if (sort === 'name-desc')  return (b.name  || '').localeCompare(a.name  || '');
    if (sort === 'price-asc')  return (a.price || 0)  - (b.price || 0);
    if (sort === 'price-desc') return (b.price || 0)  - (a.price || 0);
    if (sort === 'stock-desc') return (b.stock || 0)  - (a.stock || 0);
    return 0;
  });

  updateStats();
  renderCards(filtered);
}

// ── Populate Filter Dropdowns ───────────────────────────────────
function populateFilters(products) {
  const cats   = [...new Set(products.map(p => p.category?.name).filter(Boolean))].sort();
  const brands = [...new Set(products.map(p => p.brand?.name).filter(Boolean))].sort();

  const catSel   = document.getElementById('filter-category');
  const brandSel = document.getElementById('filter-brand');
  while (catSel.options.length   > 1) catSel.remove(1);
  while (brandSel.options.length > 1) brandSel.remove(1);

  cats.forEach(c  => { const o = document.createElement('option'); o.value = c; o.text = c; catSel.appendChild(o); });
  brands.forEach(b => { const o = document.createElement('option'); o.value = b; o.text = b; brandSel.appendChild(o); });
}

// ── Populate Product Dropdowns (dipakai di halaman Stok) ────────
function populateProductDropdowns(products) {
  ['si-product', 'so-product'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    products.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.text  = `${p.name} (Stok: ${p.stock})`;
      sel.appendChild(o);
    });
  });
}

// ── Update Stat Cards ───────────────────────────────────────────
function updateStats() {
  let instock = 0, low = 0, out = 0;
  allProducts.forEach(p => {
    const q = typeof p.stock === 'number' ? p.stock : 0;
    if (q === 0)       out++;
    else if (q <= 10)  low++;
    else               instock++;
  });
  document.getElementById('stat-total').textContent   = allProducts.length;
  document.getElementById('stat-instock').textContent = instock;
  document.getElementById('stat-low').textContent     = low;
  document.getElementById('stat-out').textContent     = out;
}

// ── Render Product Cards ────────────────────────────────────────
function renderCards(products) {
  const grid = document.getElementById('product-grid');

  if (!products.length) {
    grid.innerHTML = `
      <div class="state-box">
        <div class="icon">🔍</div>
        <h3>Produk Tidak Ditemukan</h3>
        <p>Tidak ada produk yang cocok dengan filter Anda.</p>
        <button class="btn" onclick="resetFilters()">Reset Filter</button>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  products.forEach((p, i) => {
    const card       = document.createElement('div');
    card.className   = 'product-card';
    card.style.animationDelay = `${Math.min(i * 0.04, 0.4)}s`;

    const q          = typeof p.stock === 'number' ? p.stock : null;
    const stockLabel = q === null ? null : (q === 0 ? 'Habis' : q <= 10 ? `Sisa ${q}` : `Stok: ${q}`);
    const stockClass = q === null ? 'in'  : (q === 0 ? 'out'  : q <= 10 ? 'low'       : 'in');
    const emoji      = getCategoryEmoji(p.category?.name || '');
    const price      = p.price != null ? fmtIDR(p.price) : '—';

    card.innerHTML = `
      <div class="card-icon-wrap">${emoji}</div>
      <div class="card-tags">
        ${p.category?.name ? `<span class="tag cat">${p.category.name}</span>`   : ''}
        ${p.brand?.name    ? `<span class="tag brand">${p.brand.name}</span>`     : ''}
      </div>
      <div class="card-name">${p.name || 'Tanpa Nama'}</div>
      <div class="card-sku">SKU: ${p.sku || '—'}</div>
      <div class="card-price-row">
        <span class="card-price">${price}</span>
        ${stockLabel ? `<span class="stock-badge ${stockClass}">${stockLabel}</span>` : ''}
      </div>`;

    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
  });
}

// ── Skeleton Loader ─────────────────────────────────────────────
function showSkeletons(n) {
  document.getElementById('product-grid').innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton">
      <div class="skel-line skel-icon"></div>
      <div class="skel-line" style="width:40%;height:10px"></div>
      <div class="skel-line"></div>
      <div class="skel-line skel-short"></div>
      <div class="skel-line" style="width:80%;height:10px"></div>
      <div class="skel-line skel-price"></div>
    </div>`).join('');
}

// ── Error State ─────────────────────────────────────────────────
function showError(msg) {
  document.getElementById('product-grid').innerHTML = `
    <div class="state-box">
      <div class="icon">⚠️</div>
      <h3>Gagal Memuat Data</h3>
      <p>Tidak dapat terhubung ke GraphQL server.<br>
         <code style="font-size:12px;color:var(--accent2)">${msg}</code>
      </p>
      <p style="margin-top:8px;font-size:12px">
        Pastikan backend berjalan di <strong>${GQL}</strong>
      </p>
      <button class="btn" onclick="fetchProducts()" style="margin-top:16px">Coba Lagi</button>
    </div>`;
}

// ── Reset Filters ───────────────────────────────────────────────
function resetFilters() {
  document.getElementById('search-input').value     = '';
  document.getElementById('filter-category').value  = '';
  document.getElementById('filter-brand').value     = '';
  applyFilters();
}
