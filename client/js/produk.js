/**
 * produk.js — Halaman Produk: Tambah Produk & Tabel Produk
 * Sports Inventory System | Kelompok 2
 *
 * Depends on: config.js, api.js, ui.js, dashboard.js (fetchProducts, renderProdukTable)
 */

// ── Load Halaman Produk ─────────────────────────────────────────
async function loadProdukPage() {
  // Isi dropdown Kategori & Brand dari API
  const [catData, brandData] = await Promise.all([
    gql(Q_GET_CATEGORIES).catch(() => ({ getCategories: [] })),
    gql(Q_GET_BRANDS).catch(()     => ({ getBrands: [] })),
  ]);

  const catSel   = document.getElementById('prod-category');
  const brandSel = document.getElementById('prod-brand');
  while (catSel.options.length   > 1) catSel.remove(1);
  while (brandSel.options.length > 1) brandSel.remove(1);

  (catData.getCategories || []).forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.text  = c.name;
    catSel.appendChild(o);
  });
  (brandData.getBrands || []).forEach(b => {
    const o = document.createElement('option');
    o.value = b.id;
    o.text  = b.name + (b.country ? ` (${b.country})` : '');
    brandSel.appendChild(o);
  });

  renderProdukTable();
}

// ── Render Tabel Produk ─────────────────────────────────────────
function renderProdukTable() {
  const tbody = document.getElementById('produk-table-body');
  const badge = document.getElementById('produk-count');

  if (!allProducts.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Belum ada produk. Tambahkan produk baru di atas.</td></tr>';
    badge.textContent = '0 produk';
    return;
  }

  badge.textContent = `${allProducts.length} produk`;
  tbody.innerHTML = allProducts.map(p => {
    const q        = typeof p.stock === 'number' ? p.stock : 0;
    const badgeCls = q === 0 ? 'out' : q <= 10 ? 'low' : 'in';
    return `<tr>
      <td><strong>${p.name}</strong></td>
      <td class="td-mono">${p.sku}</td>
      <td><span class="tag cat">${p.category?.name || '—'}</span></td>
      <td><span class="tag brand">${p.brand?.name  || '—'}</span></td>
      <td class="td-price">${fmtIDR(p.price)}</td>
      <td><span class="stock-badge ${badgeCls}">${q} unit</span></td>
    </tr>`;
  }).join('');
}

// ── Submit Mutation: addProduct ─────────────────────────────────
async function submitAddProduct() {
  const btn = document.getElementById('btn-add-product');

  const name       = document.getElementById('prod-name').value.trim();
  const sku        = document.getElementById('prod-sku').value.trim();
  const price      = parseFloat(document.getElementById('prod-price').value);
  const stock      = parseInt(document.getElementById('prod-stock').value)  || 0;
  const categoryId = document.getElementById('prod-category').value;
  const brandId    = document.getElementById('prod-brand').value;

  if (!name || !sku || isNaN(price) || !categoryId || !brandId) {
    toast('error', 'Field Tidak Lengkap', 'Nama, SKU, Harga, Kategori, dan Brand wajib diisi.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Menyimpan…';

  try {
    const data = await gql(M_ADD_PRODUCT, { input: { name, sku, price, stock, categoryId, brandId } });
    const prod = data.addProduct;
    toast('success', 'Produk Ditambahkan!', `${prod.name} (${prod.sku}) berhasil disimpan.`);
    resetProdukForm();
    await fetchProducts();
    renderProdukTable();
  } catch (err) {
    toast('error', 'Gagal Menambah Produk', err.message);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah Produk';
  }
}

// ── Reset Form Produk ───────────────────────────────────────────
function resetProdukForm() {
  ['prod-name', 'prod-sku', 'prod-price'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('prod-stock').value    = '0';
  document.getElementById('prod-category').value = '';
  document.getElementById('prod-brand').value    = '';
}
