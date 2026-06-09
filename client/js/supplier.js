/**
 * supplier.js — Halaman Supplier: Tambah Supplier & Tabel
 * Sports Inventory System | Kelompok 2
 *
 * Depends on: config.js, api.js, ui.js
 */

// ── Load Halaman Supplier ───────────────────────────────────────
async function loadSupplierPage() {
  try {
    const data   = await gql(Q_GET_SUPPLIERS);
    allSuppliers = data.getSuppliers || [];
    renderSupplierTable();
  } catch (e) {
    document.getElementById('supplier-table-body').innerHTML =
      `<tr><td colspan="4" class="table-empty">Gagal memuat: ${e.message}</td></tr>`;
  }
}

// ── Render Tabel Supplier ───────────────────────────────────────
function renderSupplierTable() {
  const tbody = document.getElementById('supplier-table-body');
  const badge = document.getElementById('supplier-count');

  badge.textContent = `${allSuppliers.length} supplier`;

  if (!allSuppliers.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Belum ada supplier. Tambahkan di atas.</td></tr>';
    return;
  }

  tbody.innerHTML = allSuppliers.map(s => `
    <tr>
      <td class="td-mono">#${s.id}</td>
      <td><strong>${s.name}</strong></td>
      <td>${s.contact || '<span style="color:var(--muted)">—</span>'}</td>
      <td style="color:var(--muted);font-size:13px">${s.address || '—'}</td>
    </tr>`).join('');
}

// ── Submit Mutation: addSupplier ────────────────────────────────
async function submitAddSupplier() {
  const btn = document.getElementById('btn-add-supplier');

  const name    = document.getElementById('sup-name').value.trim();
  const contact = document.getElementById('sup-contact').value.trim();
  const address = document.getElementById('sup-address').value.trim();

  if (!name) {
    toast('error', 'Nama Wajib Diisi', 'Nama supplier tidak boleh kosong.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Menyimpan…';

  try {
    const data = await gql(M_ADD_SUPPLIER, {
      input: { name, contact: contact || null, address: address || null },
    });
    const s = data.addSupplier;
    toast('success', 'Supplier Ditambahkan!', `${s.name} berhasil disimpan.`);
    resetSupplierForm();
    await loadSupplierPage();
  } catch (err) {
    toast('error', 'Gagal Menambah Supplier', err.message);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah Supplier';
  }
}

// ── Reset Form Supplier ─────────────────────────────────────────
function resetSupplierForm() {
  ['sup-name', 'sup-contact', 'sup-address'].forEach(id => {
    document.getElementById(id).value = '';
  });
}
