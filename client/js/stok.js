/**
 * stok.js — Halaman Stok: Stok Masuk, Stok Keluar & Riwayat
 * Sports Inventory System | Kelompok 2
 *
 * Depends on: config.js, api.js, ui.js, dashboard.js (fetchProducts, populateProductDropdowns)
 */

// ── Load Halaman Stok ───────────────────────────────────────────
async function loadStokPage() {
  // Set default tanggal hari ini
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('si-date').value = today;
  document.getElementById('so-date').value = today;

  // Isi dropdown Supplier
  try {
    const data  = await gql(Q_GET_SUPPLIERS);
    allSuppliers = data.getSuppliers || [];

    const supSel = document.getElementById('si-supplier');
    while (supSel.options.length > 1) supSel.remove(1);
    allSuppliers.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id;
      o.text  = s.name;
      supSel.appendChild(o);
    });
  } catch (e) { /* supplier opsional */ }

  await loadStokHistory();
}

// ── Load & Render Riwayat Stok ──────────────────────────────────
async function loadStokHistory() {
  try {
    const data  = await gql(Q_STOCK_HISTORY, {});
    stockHistory = data.getStockHistory || { stockIns: [], stockOuts: [] };
    renderStokTable();
  } catch (err) {
    document.getElementById('stok-table-body').innerHTML =
      `<tr><td colspan="6" class="table-empty">Gagal memuat riwayat: ${err.message}</td></tr>`;
  }
}

// ── Filter Riwayat ──────────────────────────────────────────────
function filterStokHistory(type) {
  currentStokFilter = type;
  renderStokTable();
}

// ── Render Tabel Riwayat Stok ───────────────────────────────────
function renderStokTable() {
  const tbody = document.getElementById('stok-table-body');
  const ins   = stockHistory.stockIns  || [];
  const outs  = stockHistory.stockOuts || [];

  let rows = [];
  if (currentStokFilter !== 'out') {
    rows.push(...ins.map(r => ({
      type: 'IN', qty: r.quantity, productName: r.product?.name || '—',
      info: r.supplier?.name || '—', date: r.date, notes: r.notes || '—',
    })));
  }
  if (currentStokFilter !== 'in') {
    rows.push(...outs.map(r => ({
      type: 'OUT', qty: r.quantity, productName: r.product?.name || '—',
      info: r.reason || '—', date: r.date, notes: '—',
    })));
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Belum ada riwayat stok.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="stock-badge ${r.type === 'IN' ? 'in' : 'out'}">
        ${r.type === 'IN' ? '📦 MASUK' : '🔻 KELUAR'}
      </span></td>
      <td><strong>${r.productName}</strong></td>
      <td><strong>${r.qty}</strong></td>
      <td><span style="color:var(--muted);font-size:13px">${r.info}</span></td>
      <td style="font-size:13px;color:var(--muted)">${fmtDate(r.date)}</td>
      <td style="font-size:13px;color:var(--muted)">${r.notes}</td>
    </tr>`).join('');
}

// ── Submit Mutation: createStockIn ──────────────────────────────
async function submitStockIn() {
  const btn = document.getElementById('btn-stockin');

  const productId  = document.getElementById('si-product').value;
  const supplierId = document.getElementById('si-supplier').value;
  const quantity   = parseInt(document.getElementById('si-qty').value);
  const date       = document.getElementById('si-date').value;
  const notes      = document.getElementById('si-notes').value.trim();

  if (!productId || !supplierId || !quantity || !date) {
    toast('error', 'Field Tidak Lengkap', 'Produk, Supplier, Qty, dan Tanggal wajib diisi.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Menyimpan…';

  try {
    const data = await gql(M_CREATE_STOCK_IN, {
      input: { productId, supplierId, quantity, date, notes: notes || null },
    });
    const r = data.createStockIn;
    toast('success', 'Stok Masuk Dicatat!', `${r.quantity} unit ${r.product?.name} dari ${r.supplier?.name}.`);
    document.getElementById('si-qty').value   = '';
    document.getElementById('si-notes').value = '';
    await fetchProducts();
    populateProductDropdowns(allProducts);
    await loadStokHistory();
  } catch (err) {
    toast('error', 'Gagal Catat Stok Masuk', err.message);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg> Catat Masuk';
  }
}

// ── Submit Mutation: createStockOut ─────────────────────────────
async function submitStockOut() {
  const btn = document.getElementById('btn-stockout');

  const productId = document.getElementById('so-product').value;
  const quantity  = parseInt(document.getElementById('so-qty').value);
  const reason    = document.getElementById('so-reason').value;
  const date      = document.getElementById('so-date').value;

  if (!productId || !quantity || !reason || !date) {
    toast('error', 'Field Tidak Lengkap', 'Produk, Qty, Alasan, dan Tanggal wajib diisi.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Menyimpan…';

  try {
    const data = await gql(M_CREATE_STOCK_OUT, { input: { productId, quantity, reason, date } });
    const r    = data.createStockOut;
    toast('success', 'Stok Keluar Dicatat!', `${r.quantity} unit ${r.product?.name} — ${r.reason}.`);
    document.getElementById('so-qty').value    = '';
    document.getElementById('so-reason').value = '';
    await fetchProducts();
    populateProductDropdowns(allProducts);
    await loadStokHistory();
  } catch (err) {
    toast('error', 'Gagal Catat Stok Keluar', err.message);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg> Catat Keluar';
  }
}
