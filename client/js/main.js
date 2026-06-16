/**
 * main.js — Entry Point: Event Listeners & Inisialisasi
 * Sports Inventory System | Kelompok 2
 *
 * Depends on: semua modul di atas (config, api, ui, dashboard, produk, stok, supplier)
 * File ini HARUS di-load paling terakhir.
 */

// ── Dashboard: Filter & View Toggle ────────────────────────────
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-category').addEventListener('change', applyFilters);
document.getElementById('filter-brand').addEventListener('change', applyFilters);
document.getElementById('sort-select').addEventListener('change', applyFilters);

document.getElementById('btn-refresh').addEventListener('click', () => {
  allProducts = [];
  fetchProducts();
});

document.getElementById('btn-grid').addEventListener('click', () => {
  document.getElementById('product-grid').classList.remove('list-view');
  document.getElementById('btn-grid').classList.add('active');
  document.getElementById('btn-list').classList.remove('active');
});

document.getElementById('btn-list').addEventListener('click', () => {
  document.getElementById('product-grid').classList.add('list-view');
  document.getElementById('btn-list').classList.add('active');
  document.getElementById('btn-grid').classList.remove('active');
});

// ── Modal ───────────────────────────────────────────────────────
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── Responsive: Stok Form Layout ────────────────────────────────
const mq = window.matchMedia('(max-width: 768px)');
function handleStokLayout(e) {
  const f = document.querySelector('.stok-forms');
  if (f) f.style.gridTemplateColumns = e.matches ? '1fr' : '1fr 1fr';
}
mq.addEventListener('change', handleStokLayout);

// ── Init: Load Dashboard ─────────────────────────────────────────
fetchProducts();
