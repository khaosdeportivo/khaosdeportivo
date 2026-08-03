
function showLoading(msg) {
  const el = document.getElementById('loadingOverlay');
  if (!el) return;
  const t = el.querySelector('.loading-text');
  if (t && msg) t.textContent = msg;
  el.classList.add('active');
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.remove('active');
}
/* RESTORED VIA LOADER - see next commit */
alert('Admin.js temporal. Recarga en un momento.');
