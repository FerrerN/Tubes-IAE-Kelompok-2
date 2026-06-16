/**
 * ui.js — UI Helpers: Toast, Modal, Navigation, Formatters
 * Sports Inventory System | Kelompok 2
 *
 * Depends on: api.js (state), dashboard.js (loadStokPage dll via showPage)
 */

// ── Emoji Map per Kategori ──────────────────────────────────────
const CATEGORY_EMOJI = {
  'sepatu': '👟', 'shoes': '👟', 'footwear': '👟',
  'bola':   '⚽', 'ball':  '⚽',
  'raket':  '🏸', 'racket': '🏸', 'badminton': '🏸',
  'renang': '🏊', 'swim':  '🏊', 'swimming': '🏊',
  'gym':    '🏋️', 'fitness': '🏋️', 'dumbbell': '🏋️',
  'jersey': '👕', 'pakaian': '👕', 'clothing': '👕',
  'basket': '🏀', 'basketball': '🏀',
  'tenis':  '🎾', 'tennis': '🎾',
  'golf':   '⛳', 'helm':  '⛑️', 'helmet': '⛑️',
  'cycling': '🚴', 'sepeda': '🚴',
  'default': '🏅',
};

/**
 * Kembalikan emoji yang sesuai dengan nama kategori.
 */
function getCategoryEmoji(catName = '') {
  const key = catName.toLowerCase().trim();
  for (const [k, v] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_EMOJI.default;
}

// ── Formatter ───────────────────────────────────────────────────
const fmtIDR = n =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

// ── API Status Indicator ────────────────────────────────────────
function setApiStatus(state, msg) {
  const el = document.getElementById('api-status');
  el.className = 'api-dot ' + state;
  el.textContent = msg || (
    state === 'connected'   ? 'Terhubung'   :
    state === 'error'       ? 'Offline'     : 'Connecting…'
  );
}

// ── Toast Notification ──────────────────────────────────────────
/**
 * Tampilkan toast notification.
 * @param {'success'|'error'} type
 * @param {string} title
 * @param {string} [msg]
 */
function toast(type, title, msg = '') {
  const container = document.getElementById('toast-container');
  const id   = 'toast-' + Date.now();
  const icon = type === 'success' ? '✅' : '❌';
  const el   = document.createElement('div');
  el.className = 'toast ' + type;
  el.id = id;
  el.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>
    <button class="toast-close" onclick="document.getElementById('${id}').remove()">✕</button>
  `;
  container.appendChild(el);
  setTimeout(() => document.getElementById(id)?.remove(), 5000);
}

// ── Navigation (SPA Page Switch) ────────────────────────────────
/**
 * Tampilkan halaman tertentu dan sembunyikan yang lain.
 * @param {string} name   - Nama page: 'dashboard' | 'produk' | 'stok' | 'supplier'
 * @param {Element} el    - Elemen <a> nav yang diklik
 */
function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (el) el.classList.add('active');

  // Lazy load data per halaman
  if (name === 'stok')     loadStokPage();
  if (name === 'supplier') loadSupplierPage();
  if (name === 'produk')   loadProdukPage();
}

// ── Product Detail Modal ────────────────────────────────────────
function openModal(p) {
  const q        = typeof p.stock === 'number' ? p.stock : null;
  const emoji    = getCategoryEmoji(p.category?.name || '');
  const price    = p.price != null ? fmtIDR(p.price) : '—';
  const stockTxt = q === null ? '—' : (q === 0 ? '⛔ Habis' : `${q} unit`);

  const rows = [
    ['ID',       p.id  ?? '—'],
    ['SKU',      `<code style="color:var(--accent3)">${p.sku || '—'}</code>`],
    ['Kategori', p.category?.name || '—'],
    ['Merek',    p.brand?.name    || '—'],
    ['Harga',    `<span style="color:var(--accent);font-weight:800">${price}</span>`],
    ['Stok',     stockTxt],
  ];

  document.getElementById('modal-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div class="card-icon-wrap" style="margin-bottom:0;font-size:30px">${emoji}</div>
      <h2 style="font-size:24px;font-weight:800">${p.name || 'Produk'}</h2>
    </div>
    ${rows.map(([label, val]) => `
      <div class="modal-row">
        <span class="modal-row-label">${label}</span>
        <span class="modal-row-value">${val}</span>
      </div>`).join('')}`;

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
