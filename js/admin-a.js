
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

// ===== CONFIG =====
const categoryNames = {
    "nino-sintetica-corta": "Niño Sintética Corta", "sintetica-corta": "Sintética Corta",
    "nino-sintetica-bota": "Niño Sintética Bota", "sintetica-bota": "Sintética Bota",
    "gc-tache-aluminio": "GC Tache Aluminio", "nino-guayo-corto": "Niño Guayo Corto",
    "guayo-corto": "Guayo Corto", "gb-tache-aluminio": "GB Tache Aluminio",
    "nino-guayo-bota": "Niño Guayo Bota", "guayo-bota": "Guayo Bota",
    "nino-futsal-corto": "Niño Futsal Corto", "futsal-corto": "Futsal Corto",
    "nino-futsal-bota": "Niño Futsal Bota", "futsal-bota": "Futsal Bota"
};
