/* ===== KHAOS DEPORTIVO — Shared Utilities ===== */

const categoryNames = {
  "nino-sintetica-corta": "Niño Sintética Corta",
  "sintetica-corta": "Sintética Corta",
  "nino-sintetica-bota": "Niño Sintética Bota",
  "sintetica-bota": "Sintética Bota",
  "gc-tache-aluminio": "Guayo Corta Tache Aluminio",
  "gb-tache-aluminio": "Guayo Bota Tache Aluminio",
  "nino-guayo-corto": "Niño Guayo Corto",
  "guayo-corto": "Guayo Corto",
  "nino-guayo-bota": "Niño Guayo Bota",
  "guayo-bota": "Guayo Bota",
  "nino-futsal-corto": "Niño Futsal Corto",
  "nino-futsal-bota": "Niño Futsal Bota",
  "futsal-corto": "Futsal Corto",
  "futsal-bota": "Futsal Bota"
};

const categoryHierarchy = {
  adulto: {
    label: 'Adulto',
    icon: 'fa-user',
    color: '#3b82f6',
    families: {
      sintetica: { label: 'Sintética', icon: 'fa-leaf', color: '#22c55e', categories: ['sintetica-corta', 'sintetica-bota'] },
      guayo: { label: 'Guayo', icon: 'fa-futbol', color: '#ef4444', categories: ['guayo-corto', 'guayo-bota', 'gc-tache-aluminio', 'gb-tache-aluminio'] },
      futsal: { label: 'Futsal', icon: 'fa-home', color: '#f59e0b', categories: ['futsal-corto', 'futsal-bota'] }
    }
  },
  nino: {
    label: 'Niño',
    icon: 'fa-child',
    color: '#a855f7',
    families: {
      sintetica: { label: 'Sintética', icon: 'fa-leaf', color: '#22c55e', categories: ['nino-sintetica-corta', 'nino-sintetica-bota'] },
      guayo: { label: 'Guayo', icon: 'fa-futbol', color: '#ef4444', categories: ['nino-guayo-corto', 'nino-guayo-bota'] },
      futsal: { label: 'Futsal', icon: 'fa-home', color: '#f59e0b', categories: ['nino-futsal-corto', 'nino-futsal-bota'] }
    }
  }
};

const badgeConfig = {
  bestseller:  { label: 'Más vendido',   icon: '🔥', color: '#ef4444', bg: 'rgba(239,68,68,0.9)' },
  new:         { label: 'Nuevo',         icon: '⭐', color: '#22c55e', bg: 'rgba(34,197,94,0.9)' },
  promo:       { label: 'Promoción',     icon: '🏷️', color: '#f59e0b', bg: 'rgba(245,158,11,0.9)' },
  lastunits:   { label: 'Últimas unid.', icon: '⚡', color: '#f97316', bg: 'rgba(249,115,22,0.9)' },
  limited:     { label: 'Ed. limitada',  icon: '💎', color: '#a855f7', bg: 'rgba(168,85,247,0.9)' },
  recommended: { label: 'Recomendado',   icon: '👑', color: '#D4AF37', bg: 'rgba(212,175,55,0.9)' },
  clearance:   { label: 'Liquidación',   icon: '🧹', color: '#ec4899', bg: 'rgba(236,72,153,0.9)' },
  preorder:    { label: 'Preventa',      icon: '📅', color: '#3b82f6', bg: 'rgba(59,130,246,0.9)' },
  webonly:     { label: 'Exclusivo web', icon: '🌐', color: '#06b6d4', bg: 'rgba(6,182,212,0.9)' }
};

/* ===== Helpers ===== */
function getCategoryName(cat) {
  return categoryNames[cat] || cat;
}

function getCategoryMeta(catId) {
  for (const [groupKey, group] of Object.entries(categoryHierarchy)) {
    for (const [familyKey, family] of Object.entries(group.families)) {
      if (family.categories.includes(catId)) {
        return { group: groupKey, groupLabel: group.label, family: familyKey, familyLabel: family.label };
      }
    }
  }
  return { group: 'adulto', groupLabel: 'Adulto', family: 'otros', familyLabel: 'Otros' };
}

function formatPrice(price) {
  return '$' + Number(price).toLocaleString('es-CO');
}

function getDiscountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function sanitizeUrl(url) {
  if (!url) return '';
  const allowed = ['http:', 'https:', 'data:'];
  try {
    const parsed = new URL(url, window.location.href);
    if (!allowed.includes(parsed.protocol)) return '';
    return url;
  } catch (e) {
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('./')) return url;
    return '';
  }
}

/* ===== Theme ===== */
function loadTheme() {
  try {
    const theme = localStorage.getItem('khaos_theme');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
  updateThemeIcon();
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', 'light');
  try {
    localStorage.setItem('khaos_theme', isLight ? 'dark' : 'light');
  } catch (e) {}
  updateThemeIcon();
}

function updateThemeIcon() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const icon = document.getElementById('themeToggle') || document.getElementById('themeIcon');
  if (!icon) return;
  // Support both catalog (svg) and admin (font-awesome)
  if (icon.tagName === 'I' || icon.classList.contains('fas')) {
    icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
  }
}

/* ===== Toast ===== */
function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'success');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML =
    '<div class="toast-icon">' + (icons[type] || icons.success) + '</div>' +
    '<span>' + escapeHtml(message) + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
