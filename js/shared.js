// defaultProducts removed - catalog reads from admin only


const fallbackProducts = [
  {id:1,name:"Guayo Nike Phantom GT Elite - Negro/Dorado",price:189000,oldPrice:220000,category:"guayo-corto",code:"GC-001",sizes:["38","39","40","41","42","43"],outOfStock:[],image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",desc:"Guayo corto profesional con upper sintético de alta gama. Suela con taches cónicos para control óptimo en césped natural.",badge:"bestseller"},
  {id:2,name:"Guayo Adidas Predator Freak - Blanco/Plata",price:195000,oldPrice:240000,category:"guayo-bota",code:"GB-002",sizes:["39","40","41","42","43","44"],outOfStock:["44"],image:"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop",desc:"Bota con tecnología Demonskin para un control superior del balón. Diseño ergonómico de caña alta.",badge:"new"},
  {id:3,name:"Sintética Puma Ultra - Azul Eléctrico",price:145000,oldPrice:170000,category:"sintetica-corta",code:"SC-003",sizes:["38","39","40","41","42"],outOfStock:[],image:"https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=300&fit=crop",desc:"Ultra ligera para canchas sintéticas. Suela de goma antideslizante con amortiguación reactiva.",badge:"promo"},
  {id:4,name:"Futsal Joma Top Flex - Rojo/Negro",price:125000,category:"futsal-corto",code:"FC-004",sizes:["38","39","40","41","42","43"],outOfStock:["38"],image:"https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop",desc:"Diseñada específicamente para futsal. Suela plana de goma flexible con gran agarre en parque.",badge:"recommended"},
  {id:5,name:"Guayo Niño Future Z - Verde Lima",price:95000,oldPrice:115000,category:"nino-guayo-corto",code:"NGC-005",sizes:["28","29","30","31","32","33","34"],outOfStock:[],image:"https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=400&h=300&fit=crop",desc:"Versión juvenil con las mismas tecnologías del modelo profesional. Ideal para academias.",badge:"new"},
  {id:6,name:"Sintética Bota Nike Tiempo - Cuero Negro",price:175000,oldPrice:210000,category:"sintetica-bota",code:"SB-006",sizes:["40","41","42","43","44"],outOfStock:["40"],image:"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",desc:"Cuero sintético premium con acabado hidrófugo. Bota clásica renovada para sintética moderna.",badge:"bestseller"},
  {id:7,name:"Futsal Bota Mizuno Morelia - Blanco/Azul",price:155000,category:"futsal-bota",code:"FB-007",sizes:["39","40","41","42","43"],outOfStock:[],image:"https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=300&fit=crop",desc:"Construcción japonesa con piel de canguro sintética. Toque excepcional y durabilidad extrema.",badge:"limited"},
  {id:8,name:"Tache Aluminio Corto - Phantom Venom",price:210000,oldPrice:250000,category:"gc-tache-aluminio",code:"GCA-008",sizes:["40","41","42","43","44","45"],outOfStock:["45"],image:"https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&h=300&fit=crop",desc:"Taches de aluminio profesionales para máxima tracción. Placa ligera con tecnología anti-torsión.",badge:"lastunits"}
];

const categoryNames = {
  "nino-sintetica-corta":"Niño Sintética Corta","sintetica-corta":"Sintética Corta",
  "nino-sintetica-bota":"Niño Sintética Bota","sintetica-bota":"Sintética Bota",
  "gc-tache-aluminio":"Guayo Corta Tache Aluminio","gb-tache-aluminio":"Guayo Bota Tache Aluminio",
  "nino-guayo-corto":"Niño Guayo Corto","guayo-corto":"Guayo Corto",
  "nino-guayo-bota":"Niño Guayo Bota","guayo-bota":"Guayo Bota",
  "nino-futsal-corto":"Niño Futsal Corto","nino-futsal-bota":"Niño Futsal Bota",
  "futsal-corto":"Futsal Corto","futsal-bota":"Futsal Bota",
  "zapatillas-urbanas":"Zapatillas Urbanas",
  "zapatillas-running":"Zapatillas Running",
  "zapatillas-casual":"Zapatillas Casual",
  "canilleras":"Canilleras",
  "medias":"Medias",
  "bolsos":"Bolsos"
};

const categoryHierarchy = {
  adulto: {
    label: 'Adulto',
    families: {
      sintetica: { label: 'Sintética', categories: ['sintetica-corta', 'sintetica-bota'] },
      guayo: { label: 'Guayo', categories: ['guayo-corto', 'guayo-bota', 'gc-tache-aluminio', 'gb-tache-aluminio'] },
      futsal: { label: 'Futsal', categories: ['futsal-corto', 'futsal-bota'] },
      zapatillas: { label: 'Zapatillas', categories: ['zapatillas-urbanas', 'zapatillas-running', 'zapatillas-casual'] },
      accesorios: { label: 'Accesorios', categories: ['canilleras', 'medias', 'bolsos'] }
    }
  },
  nino: {
    label: 'Niño',
    families: {
      sintetica: { label: 'Sintética', categories: ['nino-sintetica-corta', 'nino-sintetica-bota'] },
      guayo: { label: 'Guayo', categories: ['nino-guayo-corto', 'nino-guayo-bota'] },
      futsal: { label: 'Futsal', categories: ['nino-futsal-corto', 'nino-futsal-bota'] }
    }
  }
};

// Config de tienda (se lee desde localStorage del admin)
let storeConfig = {
  storeName: 'Khaos Deportivo',
  whatsapp: '573105624563',
  instagram: 'https://www.instagram.com/khaosdeportivo',
  facebook: 'https://www.facebook.com/share/1Bkqc7LWJW/',
  color: '#D4AF37'
};

let products = [];
let favorites = [];
const state = {
  currentFilter: 'todos', searchQuery: '', sortBy: 'default',
  modalProduct: null, modalSize: null, modalQty: 1,
  cart: [], lastScroll: 0
};

/* ===== SAFE DOM HELPERS ===== */
function $(id) { return document.getElementById(id); }
function safeSet(id, prop, value) {
  const el = $(id);
  if (el) el[prop] = value;
}
function safeText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}
function safeHtml(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}
function safeStyle(id, prop, value) {
  const el = $(id);
  if (el) el.style[prop] = value;
}
function safeShow(id, show) {
  const el = $(id);
  if (el) el.style.display = show ? '' : 'none';
}
function safeAddClass(id, className) {
  const el = $(id);
  if (el) el.classList.add(className);
}
function safeRemoveClass(id, className) {
  const el = $(id);
  if (el) el.classList.remove(className);
}
function safeToggleClass(id, className, force) {
  const el = $(id);
  if (el) el.classList.toggle(className, force);
}

/* ===== HTML SANITIZATION ===== */
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function sanitizeUrl(url) {
  if (!url) return '';
  const allowedProtocols = ['http:', 'https:', 'data:'];
  try {
    const parsed = new URL(url, window.location.href);
    if (!allowedProtocols.includes(parsed.protocol)) return '';
    return url;
  } catch (e) {
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('./')) return url;
    return '';
  }
}

function getProductImage(p) {
  const url = sanitizeUrl(p.image);
  if (url) return url;
  // Fallback por categoría
  const fallbacks = {
    'guayo-corto': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
    'guayo-bota': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop',
    'sintetica-corta': 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=300&fit=crop',
    'sintetica-bota': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
    'futsal-corto': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop',
    'futsal-bota': 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=300&fit=crop',
    'zapatillas-urbanas': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
    'zapatillas-running': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
    'zapatillas-casual': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
    'canilleras': 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&h=300&fit=crop',
    'medias': 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&h=300&fit=crop',
    'bolsos': 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&h=300&fit=crop'
  };
  return fallbacks[p.category] || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&h=300&fit=crop';
}

function sanitizeNumber(num, defaultVal) {
  const n = Number(num);
  return isNaN(n) ? defaultVal : n;
}


/* ===== CONFIG DE TIENDA ===== */
function loadStoreConfig() {
  try {
    const saved = localStorage.getItem('khaos_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      storeConfig = { ...storeConfig, ...parsed };
      // Actualizar WhatsApp en el catálogo
      const waLinks = document.querySelectorAll('a[href*="wa.me"]');
      waLinks.forEach(link => {
        link.href = 'https://wa.me/' + storeConfig.whatsapp;
      });
    }
  } catch(e) {}
}

/* ===== PRODUCTOS ===== */
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/khaosdeportivo/khaosdeportivo/main/productos.json';
const GITHUB_API_URL = 'https://api.github.com/repos/khaosdeportivo/khaosdeportivo/contents/productos.json?ref=main';

function loadProducts() {
    return fetchFromGithub().then(ok => {
        if (!ok || products.length === 0) {
            products = fallbackProducts;
            console.log('ℹ️ Usando catálogo de demostración');
            return true;
        }
        return ok;
    });
}

async function fetchFromGithub() {
    try {
        // Usar fetch con cache-buster para evitar caché del navegador
        const response = await fetch(GITHUB_RAW_URL + '?t=' + Date.now(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('GitHub respondió ' + response.status);
        }

        const datos = await response.json();

        if (datos.productos && Array.isArray(datos.productos) && datos.productos.length > 0) {
            products = datos.productos;

            // También cargar cupones si existen
            if (datos.cupones && Array.isArray(datos.cupones)) {
                availableCoupons = datos.cupones;
            }

            // Guardar en localStorage como caché local
            try {
                localStorage.setItem('khaos_admin_products', JSON.stringify(products));
                if (datos.cupones) {
                    localStorage.setItem('khaos_admin_coupons', JSON.stringify(datos.cupones));
                }
            } catch(e) {}

            console.log('✅ Productos cargados desde GitHub:', products.length);
            return true;
        }
    } catch(e) {
        console.log('⚠️ No se pudo cargar desde GitHub:', e.message);
    }

    // Fallback: intentar localStorage
    try {
        const saved = localStorage.getItem('khaos_admin_products');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
                console.log('✅ Productos cargados desde localStorage:', products.length);
                return true;
            }
        }
    } catch(e) {}

    // Si no hay nada, array vacío
    products = [];
    console.log('ℹ️ Sin productos disponibles');
    return false;
}

// Función para forzar recarga desde GitHub
async function recargarDesdeGithub() {
    showToast('🔄 Actualizando catálogo...', 'info');
    const ok = await fetchFromGithub();
    if (ok) {
        renderProducts();
        updateHeroStats();
        updateFavButtons();
        showToast('✅ Catálogo actualizado', 'success');
    } else {
        showToast('❌ No se pudo actualizar', 'error');
    }
}


/* ===== CARRITO ===== */
function loadCart() {
  try {
    const saved = localStorage.getItem('khaos_cart');
    if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) state.cart = parsed; }
  } catch(e) { 
    state.cart = []; 
    try { localStorage.removeItem('khaos_cart'); } catch(e2) {}
  }
}

function saveCart() {
  try { 
    localStorage.setItem('khaos_cart', JSON.stringify(state.cart)); 
  } catch(e) {
    if (e.name === 'QuotaExceededError') {
      showToast('Almacenamiento lleno. Elimina algunos favoritos.', 'warning');
    }
  }
}

/* ===== FAVORITOS ===== */
function loadFavorites() {
  try {
    const saved = localStorage.getItem('khaos_favorites');
    if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) favorites = parsed; }
  } catch(e) { 
    favorites = []; 
    try { localStorage.removeItem('khaos_favorites'); } catch(e2) {}
  }
}

function saveFavorites() {
  try { 
    localStorage.setItem('khaos_favorites', JSON.stringify(favorites)); 
  } catch(e) {
    if (e.name === 'QuotaExceededError') {
      showToast('Almacenamiento lleno. Elimina algunos favoritos.', 'warning');
    }
  }
}

function toggleFavorite(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const idx = favorites.findIndex(f => f.id === productId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    showToast(product.name + ' eliminado de favoritos', 'info');
  } else {
    favorites.push({ id: product.id, name: product.name, price: product.price, category: product.category, code: product.code || '' });
    showToast(product.name + ' agregado a favoritos ❤️', 'success');
  }
  saveFavorites();
  updateFavButtons();
  updateFavBadge();
}

function updateFavButtons() {
  document.querySelectorAll('.btn-fav').forEach(btn => {
    const match = btn.id.match(/favBtn-(\d+)/);
    if (match) {
      const pid = parseInt(match[1]);
      const isFav = favorites.some(f => f.id === pid);
      btn.textContent = isFav ? '❤️' : '🤍';
      btn.classList.toggle('active', isFav);
    }
  });
}

function updateFavBadge() {
  const badge = document.getElementById('navFavBadge');
  if (!badge) return;
  badge.textContent = favorites.length;
  badge.style.display = favorites.length > 0 ? 'flex' : 'none';
}

function toggleFavPanel() {
  const panel = document.getElementById('favPanel');
  const overlay = document.getElementById('cartOverlay');
  const cartPanel = document.getElementById('cartPanel');
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    if (!cartPanel.classList.contains('open')) {
      overlay.classList.remove('active');
      document.body.classList.remove('cart-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  } else {
    overlay.classList.add('active');
    panel.classList.add('open');
    document.body.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
}

function updateFavPanel() {
  const container = document.getElementById('favItems');
  if (!container) return;
  if (favorites.length === 0) {
    container.innerHTML = '<div class="fav-empty"><div class="fav-empty-icon">🤍</div><h3>No tienes favoritos</h3><p>Guarda los productos que te gusten para verlos después</p></div>';
    return;
  }
  container.innerHTML = favorites.map((item, index) =>
    '<div class="fav-item"><div class="fav-item-img" style="background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;font-size:28px;opacity:0.6">⚽</div><div class="fav-item-info"><div class="fav-item-name">' + item.name + '</div><div class="fav-item-meta">' + getCategoryName(item.category) + ' | Ref: ' + (item.code || '') + '</div><div class="fav-item-price">' + formatPrice(item.price) + '</div><div class="fav-item-actions"><button class="fav-btn-cart" onclick="openModal(' + item.id + ');toggleFavPanel();"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver Detalles</button></div></div><button class="fav-item-remove" onclick="removeFavorite(' + index + ')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>'
  ).join('');
}

function removeFavorite(index) {
  if (index < 0 || index >= favorites.length) return;
  const name = favorites[index].name;
  favorites.splice(index, 1);
  saveFavorites();
  updateFavButtons();
  updateFavPanel();
  updateFavBadge();
  showToast(name + ' eliminado de favoritos', 'info');
}

/* ===== THEME ===== */
function loadTheme() {
  try {
    const theme = localStorage.getItem('khaos_theme');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      updateThemeIcon();
    }
  } catch(e) {}
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', 'light');
  try { localStorage.setItem('khaos_theme', isLight ? 'dark' : 'light'); } catch(e) {}
  updateThemeIcon();
}

function updateThemeIcon() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const icon = document.getElementById('themeToggle');
  if (!icon) return;
  icon.innerHTML = isLight 
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

/* ===== HELPERS ===== */
function formatPrice(price) {
  return '$' + price.toLocaleString('es-CO');
}

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

function getDiscountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

/* ===== BADGES ===== */
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

function getBadgeHTML(badge) {
  if (!badge || !badgeConfig[badge]) return '';
  const b = badgeConfig[badge];
  return '<span class="product-card-badge ' + badge + '" style="background:' + b.bg + ';color:white;">' + b.icon + ' ' + b.label + '</span>';
}

/* ===== RENDER PRODUCTS ===== */
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const info = document.getElementById('resultsInfo');

  let filtered = [...products];

  // Filtro por categoría
  if (state.currentFilter !== 'todos') {
    if (state.currentFilter === 'nino') {
      filtered = filtered.filter(p => p.category.startsWith('nino-'));
    } else if (state.currentFilter === 'adulto') {
      filtered = filtered.filter(p => !p.category.startsWith('nino-'));
    } else if (state.currentFilter === 'zapatillas') {
      filtered = filtered.filter(p => p.category.startsWith('zapatillas-'));
    } else if (state.currentFilter === 'accesorios') {
      filtered = filtered.filter(p => ['canilleras','medias','bolsos'].includes(p.category));
    } else {
      filtered = filtered.filter(p => p.category === state.currentFilter || p.category.includes(state.currentFilter));
    }
  }

  // Búsqueda
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.code && p.code.toLowerCase().includes(q)) ||
      getCategoryName(p.category).toLowerCase().includes(q)
    );
  }

  // Ordenamiento
  if (state.sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  info.innerHTML = filtered.length > 0 
    ? 'Mostrando <span>' + filtered.length + '</span> producto' + (filtered.length !== 1 ? 's' : '')
    : 'No se encontraron productos';

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No hay productos</h3><p>Intenta con otra búsqueda o filtro</p></div>';
    return;
  }

  grid.innerHTML = filtered.map((p, i) => {
    const discount = getDiscountPercent(p.price, p.oldPrice);
    const sizesHtml = (p.sizes || []).slice(0, 6).map(s => {
      const isOut = p.outOfStock && p.outOfStock.includes(s);
      return '<span class="size-pill ' + (isOut ? 'out' : 'available') + '">' + s + '</span>';
    }).join('');
    const moreSizes = (p.sizes || []).length > 6 ? '<span class="size-pill available">+' + (p.sizes.length - 6) + '</span>' : '';
    const isFav = favorites.some(f => f.id === p.id);

    return '<div class="product-card" style="animation-delay:' + (i * 0.05) + 's">' +
      getBadgeHTML(p.badge) +
      '<div class="product-card-img-wrap" onclick="openModal(' + p.id + ')">' +
        '<img class="product-card-img" loading="lazy" width="400" height="300" src="' + getProductImage(p) + '" alt="' + escapeHtml(p.name) + '" onerror="this.style.display=\'none\';this.parentElement.querySelector(\'.img-placeholder\').style.display=\'flex\';">' +
        '<div class="product-card-img-overlay">' +
          '<button class="product-card-quick-btn" onclick="event.stopPropagation();openModal(' + p.id + ')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Ver detalles</button>' +
        '</div>' +
      '</div>' +
      '<div class="product-card-info">' +
        '<div class="product-card-category">' + getCategoryName(p.category) + '</div>' +
        '<div class="product-card-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="product-card-code">Ref: ' + escapeHtml(p.code || 'N/A') + '</div>' +
        '<div class="product-card-price-row">' +
          '<div class="product-card-price">' + formatPrice(p.price) + '</div>' +
          (p.oldPrice ? '<div class="product-card-old-price">' + formatPrice(p.oldPrice) + '</div>' : '') +
          (discount > 0 ? '<div class="product-card-discount">-' + discount + '%</div>' : '') +
        '</div>' +
        '<div class="product-card-sizes">' + sizesHtml + moreSizes + '</div>' +
        '<div class="product-card-actions">' +
          '<button class="btn-card-primary" onclick="openModal(' + p.id + ')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Comprar</button>' +
          '<button class="btn-card-icon btn-fav ' + (isFav ? 'active' : '') + '" id="favBtn-' + p.id + '" onclick="event.stopPropagation();toggleFavorite(' + p.id + ')">' + (isFav ? '❤️' : '🤍') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ===== MODAL ===== */
function openModal(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;

  state.modalProduct = p;
  state.modalSize = null;
  state.modalQty = 1;

  const modalImg = document.getElementById('modalImg');
  const modalImgUrl = getProductImage(p);
  if (modalImgUrl) {
    modalImg.src = modalImgUrl;
    modalImg.style.display = 'block';
  } else {
    modalImg.removeAttribute('src');
    modalImg.style.display = 'none';
  }
  safeText('modalCategory', getCategoryName(p.category));
  safeText('modalTitle', p.name);
  safeText('modalCode', 'Ref: ' + (p.code || 'N/A'));
  document.getElementById('modalPrice').textContent = formatPrice(p.price);
  document.getElementById('modalOldPrice').textContent = p.oldPrice ? formatPrice(p.oldPrice) : '';
  document.getElementById('modalOldPrice').style.display = p.oldPrice ? 'block' : 'none';

  const discount = getDiscountPercent(p.price, p.oldPrice);
  document.getElementById('modalDiscount').textContent = discount > 0 ? '-' + discount + '%' : '';
  document.getElementById('modalDiscount').style.display = discount > 0 ? 'inline-flex' : 'none';

  safeText('modalDesc', p.desc || 'Sin descripción disponible.');
  document.getElementById('modalQtyDisplay').textContent = '1';

  // Badge en modal
  const badgeEl = document.getElementById('modalImgWrap').querySelector('.modal-img-badge');
  if (badgeEl) badgeEl.remove();
  if (p.badge && badgeConfig[p.badge]) {
    const b = document.createElement('div');
    b.className = 'modal-img-badge ' + p.badge;
    b.textContent = badgeConfig[p.badge].label;
    b.style.cssText = 'background:' + badgeConfig[p.badge].bg + ';color:white;';
    document.getElementById('modalImgWrap').appendChild(b);
  }

  // Stock counter
  const availableCount = (p.sizes || []).filter(s => !p.outOfStock || !p.outOfStock.includes(s)).length;
  const stockEl = document.getElementById('stockCounter');
  if (availableCount <= 3 && availableCount > 0) {
    stockEl.style.display = 'flex';
    document.getElementById('stockText').textContent = '¡Solo quedan ' + availableCount + ' tallas disponibles!';
  } else {
    stockEl.style.display = 'none';
  }

  // Render sizes - BLOQUEAR LAS AGOTADAS
  const sizeSelector = document.getElementById('sizeSelector');
  sizeSelector.innerHTML = (p.sizes || []).map(s => {
    const isOut = p.outOfStock && p.outOfStock.includes(s);
    return '<div class="size-option ' + (isOut ? 'out-of-stock' : '') + '" ' + 
           (isOut ? '' : 'onclick="selectSize(\'' + s + '\')"') + '>' +
           s + 
           (isOut ? '<br><small>Agotada</small>' : '') +
           '</div>';
  }).join('');

  updateModalAddButton();
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden'; document.body.style.touchAction = 'none';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = ''; document.body.style.touchAction = '';
  state.modalProduct = null;
  state.modalSize = null;
  state.modalQty = 1;
}

function selectSize(size) {
  state.modalSize = size;
  document.querySelectorAll('.size-option').forEach(el => {
    el.classList.remove('selected');
    if (el.textContent.trim().startsWith(size)) el.classList.add('selected');
  });
  updateModalAddButton();
}

function changeModalQty(delta) {
  state.modalQty = Math.max(1, Math.min(10, state.modalQty + delta));
  document.getElementById('modalQtyDisplay').textContent = state.modalQty;
}

function updateModalAddButton() {
  const btn = document.getElementById('modalAddBtn');
  const btnText = document.getElementById('modalAddBtnText');
  if (!state.modalSize) {
    btn.disabled = true;
    btnText.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 9.5-5 5"/><path d="m11.5 11.5 3-3"/><path d="m8.5 8.5 3-3"/><path d="m17.5 15.5 3-3"/><path d="m14.5 18.5 3-3"/></svg>Selecciona una talla disponible';
  } else {
    btn.disabled = false;
    btnText.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Agregar ' + state.modalQty + ' al carrito — ' + formatPrice(state.modalProduct.price * state.modalQty);
  }
}

function addToCartFromModal() {
  if (!state.modalProduct || !state.modalSize) return;

  // Verificar que la talla NO esté agotada (doble seguridad)
  if (state.modalProduct.outOfStock && state.modalProduct.outOfStock.includes(state.modalSize)) {
    showToast('Esta talla está agotada', 'error');
    return;
  }

  const existing = state.cart.find(item => item.id === state.modalProduct.id && item.size === state.modalSize);
  if (existing) {
    existing.qty += state.modalQty;
  } else {
    state.cart.push({
      id: state.modalProduct.id,
      name: state.modalProduct.name,
      price: state.modalProduct.price,
      size: state.modalSize,
      qty: state.modalQty,
      image: state.modalProduct.image,
      category: state.modalProduct.category,
      code: state.modalProduct.code || ''
    });
  }

  saveCart();
  updateCartUI();
  closeModal();

  // Animación del carrito
  const cartFloat = document.getElementById('cartFloat');
  cartFloat.classList.add('bounce');
  setTimeout(() => cartFloat.classList.remove('bounce'), 600);

  showToast(state.modalProduct.name + ' (talla ' + state.modalSize + ') agregado al carrito', 'success');
}

/* ===== CART ===== */
function toggleCart() {
  const panel = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  const favPanel = document.getElementById('favPanel');
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    if (!favPanel.classList.contains('open')) {
      overlay.classList.remove('active');
      document.body.classList.remove('cart-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  } else {
    overlay.classList.add('active');
    panel.classList.add('open');
    document.body.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
}

function updateCartUI() {
  const itemsContainer = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const countBadge = document.getElementById('cartCount');
  const navBadge = document.getElementById('navCartBadge');
  const navText = document.getElementById('navCartText');

  const totalItems = state.cart.reduce((s, item) => s + item.qty, 0);

  countBadge.textContent = totalItems;
  countBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  navBadge.textContent = totalItems;
  navBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  navText.textContent = totalItems > 0 ? 'Carrito (' + totalItems + ')' : 'Carrito';

  if (state.cart.length === 0) {
    itemsContainer.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><h3>Tu carrito está vacío</h3><p>Agrega productos para empezar tu pedido</p></div>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';

  itemsContainer.innerHTML = state.cart.map((item, i) => 
    '<div class="cart-item">' +
      '<img class="cart-item-img" src="' + getProductImage(item) + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + escapeHtml(item.name) + '</div>' +
        '<div class="cart-item-meta">Talla ' + item.size + ' | ' + formatPrice(item.price) + ' c/u</div>' +
        '<div class="cart-item-controls">' +
          '<button class="qty-btn" onclick="updateCartQty(' + i + ', -1)">−</button>' +
          '<span class="qty-value">' + item.qty + '</span>' +
          '<button class="qty-btn" onclick="updateCartQty(' + i + ', 1)">+</button>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
        '<div class="cart-item-price">' + formatPrice(item.price * item.qty) + '</div>' +
        '<button class="cart-item-remove" onclick="removeFromCart(' + i + ')">🗑️</button>' +
      '</div>' +
    '</div>'
  ).join('');

  // Subtotal y descuento
  const subtotal = getCartSubtotal();
  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);

  let discount = 0;
  if (currentCoupon) {
    discount = currentCoupon.discount || 0;
    document.getElementById('cartDiscountRow').classList.add('show');
    document.getElementById('cartDiscountLabel').textContent = 'Descuento (' + currentCoupon.code + ')';
    document.getElementById('cartDiscountValue').textContent = '-' + formatPrice(discount);
  } else {
    document.getElementById('cartDiscountRow').classList.remove('show');
  }

  const total = subtotal - discount;
  document.getElementById('cartTotal').textContent = formatPrice(total);

  // Actualizar botón de WhatsApp
  updateWhatsAppButton();

  // Actualizar visibilidad de la sección de cupones
  updateCouponSectionVisibility();
}

function updateCartQty(index, delta) {
  if (index < 0 || index >= state.cart.length) return;
  state.cart[index].qty = Math.max(1, Math.min(10, state.cart[index].qty + delta));
  saveCart();
  updateCartUI();
}

function removeFromCart(index) {
  if (index < 0 || index >= state.cart.length) return;
  const name = state.cart[index].name;
  state.cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showToast(name + ' eliminado del carrito', 'info');
}

function getCartSubtotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/* ===== WHATSAPP & GUARDAR PEDIDO ===== */
function updateWhatsAppButton() {
  const btn = document.getElementById('cartWaBtn');
  if (!btn || state.cart.length === 0) return;

  const subtotal = getCartSubtotal();
  let discount = 0;
  if (currentCoupon) discount = currentCoupon.discount || 0;
  const total = subtotal - discount;

  let msg = '¡Hola! 👋 Quiero hacer un pedido de Khaos Deportivo:%0A%0A';
  state.cart.forEach(item => {
    msg += '• ' + item.name + '%0A';
    msg += '  Talla: ' + item.size + ' x' + item.qty + '%0A';
    msg += '  Precio: ' + formatPrice(item.price) + ' c/u%0A%0A';
  });

  msg += 'Subtotal: ' + formatPrice(subtotal) + '%0A';
  if (discount > 0) msg += 'Descuento (' + currentCoupon.code + '): -' + formatPrice(discount) + '%0A';
  msg += '*Total: ' + formatPrice(total) + '*%0A%0A';
  msg += 'Por favor confirmame disponibilidad y método de pago. ¡Gracias! 🙏';

  btn.href = 'https://wa.me/' + storeConfig.whatsapp + '?text=' + msg;

  // Guardar pedido en localStorage para el admin
  saveOrderToLocalStorage();
}

function copyCartToClipboard() {
  const subtotal = getCartSubtotal();
  let discount = 0;
  if (currentCoupon) discount = currentCoupon.discount || 0;
  const total = subtotal - discount;

  let text = '🛒 Pedido Khaos Deportivo\n\n';
  state.cart.forEach(item => {
    text += '• ' + item.name + '\n';
    text += '  Talla ' + item.size + ' x' + item.qty + ' = ' + formatPrice(item.price * item.qty) + '\n\n';
  });
  text += 'Subtotal: ' + formatPrice(subtotal) + '\n';
  if (discount > 0) text += 'Descuento: -' + formatPrice(discount) + '\n';
  text += 'TOTAL: ' + formatPrice(total) + '\n';

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('cartCopyBtn');
    if (!btn) return;
    btn.classList.add('copied');
    btn.innerHTML = '✅ ¡Copiado!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2"/></svg> Copiar pedido';
    }, 2000);
    showToast('Pedido copiado al portapapeles', 'success');
  }).catch(() => {
    showToast('No se pudo copiar automáticamente. Copia manualmente.', 'warning');
  });
}

/* ===== GUARDAR PEDIDO EN LOCALSTORAGE ===== */
function saveOrderToLocalStorage() {
  if (state.cart.length === 0) return;

  const subtotal = getCartSubtotal();
  let discount = 0;
  if (currentCoupon) discount = currentCoupon.discount || 0;
  const total = subtotal - discount;

  const order = {
    id: Date.now(),
    customer: 'Cliente Web',
    phone: '',
    address: '',
    items: state.cart.map(item => ({
      productId: item.id,
      name: item.name,
      size: item.size,
      price: item.price,
      qty: item.qty
    })),
    subtotal: subtotal,
    discount: discount,
    coupon: currentCoupon ? currentCoupon.code : null,
    total: total,
    status: 'pending',
    date: new Date().toISOString(),
    source: 'web'
  };

  // Guardar en el mismo formato que el admin usa
  try {
    let orders = [];
    const saved = localStorage.getItem('khaos_admin_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) orders = parsed;
    }
    orders.unshift(order);
    localStorage.setItem('khaos_admin_orders', JSON.stringify(orders));

    // Disparar evento para notificar al admin (si está abierto en otra pestaña)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'khaos_admin_orders',
      newValue: JSON.stringify(orders),
      oldValue: saved,
      storageArea: localStorage
    }));

    /* Pedido guardado silenciosamente */
  } catch(e) {
    /* console.error('Error guardando pedido:', e); */
  }
}

/* ===== FILTROS ===== */
function filterProducts(filter) {
  state.currentFilter = filter;
  state.searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClear').classList.remove('show');

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === filter);
  });

  renderProducts();
  document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
}

function sortProducts(sortBy) {
  state.sortBy = sortBy;
  document.querySelectorAll('.sort-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.sort === sortBy);
  });
  document.getElementById('sortDropdown').classList.remove('open');

  const labels = { 'default': 'Ordenar', 'price-asc': 'Precio: menor a mayor', 'price-desc': 'Precio: mayor a menor', 'name-asc': 'Nombre: A-Z' };
  document.getElementById('sortLabel').textContent = labels[sortBy] || 'Ordenar';

  renderProducts();
}

function toggleSortMenu() {
  document.getElementById('sortDropdown').classList.toggle('open');
}

/* ===== MEGA MENU ===== */
function showMegaMenu() {
  document.getElementById('megaMenu').classList.add('active');
}
function hideMegaMenu() {
  document.getElementById('megaMenu').classList.remove('active');
}

/* ===== MOBILE ===== */
function toggleMobileDrawer() {
  document.getElementById('mobileDrawer').classList.toggle('open');
  document.getElementById('mobileDrawerOverlay').classList.toggle('active');
}
function openSearchMobile() {
  document.getElementById('searchInput').focus();
  document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
}

/* ===== PARTICLES ===== */
function createParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = (6 + Math.random() * 6) + 's';
    p.style.width = (1 + Math.random() * 2) + 'px';
    p.style.height = p.style.width;
    container.appendChild(p);
  }
}

/* ===== HERO STATS ===== */
function updateHeroStats() {
  document.getElementById('heroStatProducts').textContent = products.length;
}

/* ===== SCROLL ===== */
function initScrollEffects() {
  const nav = document.getElementById('navHeader');
  const indicator = document.getElementById('scrollIndicator');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 50);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    indicator.style.width = docHeight > 0 ? (y / docHeight * 100) + '%' : '0%';
  });
}

/* ===== TOAST ===== */
function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'success');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = '<div class="toast-icon">' + (icons[type] || icons.success) + '</div><span>' + escapeHtml(message) + '</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>';
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

/* ===== INIT ===== */
let searchDebounceTimer;

async function init() {
  loadStoreConfig();
  await loadProducts();
  loadCart();
  loadFavorites();
  loadTheme();
  loadCouponsFromAdmin();
  updateCouponSectionVisibility();
  loadAppliedCoupon();
  createParticles();
  updateHeroStats();
  renderProducts();
  updateCartUI();
  updateFavButtons();
  updateFavBadge();
  updateFavPanel();
  initEventListeners();
  initScrollEffects();
  showToast('¡Bienvenido a Khaos Deportivo!', 'success');
}

function initEventListeners() {
  // Bloquear scroll del fondo cuando el input del cupón tiene foco (móvil)
  const couponInput = document.getElementById('couponInput');
  if (couponInput) {
    couponInput.addEventListener('focus', function() {
      // Asegurar que el panel del carrito sea el único scrollable
      document.getElementById('cartPanel').style.overscrollBehavior = 'contain';
    });
    couponInput.addEventListener('blur', function() {
      document.getElementById('cartPanel').style.overscrollBehavior = '';
    });
  }

  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');

  searchInput.addEventListener('input', function() {
    state.searchQuery = this.value;
    searchClear.classList.toggle('show', this.value.length > 0);
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => renderProducts(), 250);
  });

  searchClear.addEventListener('click', function() {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.classList.remove('show');
    renderProducts();
    searchInput.focus();
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.sort-dropdown')) document.getElementById('sortDropdown').classList.remove('open');
  });

  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
      if (document.getElementById('cartPanel').classList.contains('open')) toggleCart();
      if (document.getElementById('favPanel').classList.contains('open')) toggleFavPanel();
      document.getElementById('mobileDrawer').classList.remove('open');
      document.getElementById('mobileDrawerOverlay').classList.remove('active');
    }
  });

  // Escuchar cambios en productos del admin
  window.addEventListener('storage', function(e) {
    if (e.key === 'khaos_admin_products') {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          products = parsed;
          renderProducts();
          updateHeroStats();
          showToast('Catálogo actualizado desde el admin', 'info');
        }
      } catch(err) {}
    }
  });
}

/* ===== SISTEMA DE CUPONES ===== */
let currentCoupon = null;  // Cupón aplicado actualmente
let availableCoupons = []; // Cupones cargados del admin

function loadCouponsFromAdmin() {
  try {
    const saved = localStorage.getItem('khaos_admin_coupons');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        availableCoupons = parsed;
        /* console.log('Cupones cargados del admin:', availableCoupons.length); */
        return;
      }
    }
  } catch(e) {}
  // Sin cupones del admin: lista vacía
  availableCoupons = [];
}
function isCouponValid(coupon) {
  if (!coupon || !coupon.active) return { valid: false, reason: 'Cupón inactivo' };

  // Verificar usos máximos
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: 'Cupón agotado (usos máximos alcanzados)' };
  }

  // Verificar fechas (usando UTC para consistencia entre zonas horarias)
  const now = new Date();
  if (coupon.startDate) {
    const start = new Date(coupon.startDate + 'T00:00:00Z');
    if (now < start) return { valid: false, reason: 'Cupón aún no está activo' };
  }
  if (coupon.endDate) {
    const end = new Date(coupon.endDate + 'T23:59:59Z');
    if (now > end) return { valid: false, reason: 'Cupón vencido' };
  }

  return { valid: true };
}

function isCouponApplicable(coupon, cartItems) {
  // Si aplica a todos los productos
  if (coupon.appliesTo === 'all' && (!coupon.productIds || coupon.productIds.length === 0)) {
    return { applicable: true, eligibleSubtotal: getCartSubtotal() };
  }

  let eligibleSubtotal = 0;
  let hasEligibleItems = false;

  // Verificar por categoría
  if (coupon.appliesTo && coupon.appliesTo !== 'all') {
    for (const item of cartItems) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        const meta = getCategoryMeta(product.category);
        const isEligible = 
          coupon.appliesTo === 'guayo' && meta.family === 'guayo' ||
          coupon.appliesTo === 'sintetica' && meta.family === 'sintetica' ||
          coupon.appliesTo === 'futsal' && meta.family === 'futsal' ||
          coupon.appliesTo === 'zapatillas' && meta.family === 'zapatillas' ||
          coupon.appliesTo === 'accesorios' && meta.family === 'accesorios' ||
          coupon.appliesTo === 'nino' && meta.group === 'nino';

        if (isEligible) {
          eligibleSubtotal += item.price * item.qty;
          hasEligibleItems = true;
        }
      }
    }
  }

  // Verificar por productos específicos
  if (coupon.productIds && coupon.productIds.length > 0) {
    for (const item of cartItems) {
      if (coupon.productIds.includes(item.id)) {
        eligibleSubtotal += item.price * item.qty;
        hasEligibleItems = true;
      }
    }
  }

  if (!hasEligibleItems) {
    return { applicable: false, reason: 'Este cupón no aplica a los productos de tu carrito' };
  }

  return { applicable: true, eligibleSubtotal: eligibleSubtotal };
}




function calculateDiscount(coupon, eligibleSubtotal) {
  if (!coupon || eligibleSubtotal <= 0) return 0;

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round(eligibleSubtotal * coupon.value / 100);
  } else {
    discount = coupon.value;
  }

  // El descuento no puede superar el subtotal elegible
  if (discount > eligibleSubtotal) discount = eligibleSubtotal;

  return discount;
}

function toggleCouponSection() {
  const body = document.getElementById('couponBody');
  const arrow = document.getElementById('couponArrow');
  const isOpen = body.style.display !== 'none';

  if (isOpen) {
    body.style.display = 'none';
    arrow.classList.remove('open');
  } else {
    body.style.display = 'block';
    arrow.classList.add('open');
    // Mostrar cupones aplicables si hay productos en el carrito
    updateCouponHint();
  }
}

function updateCouponSectionVisibility() {
  const section = document.getElementById('couponSection');
  if (!section) return;

  // Cargar cupones del admin
  loadCouponsFromAdmin();

  // Si no hay cupones activos en el admin, ocultar toda la sección
  if (availableCoupons.length === 0) {
    section.style.display = 'none';
    return;
  }

  // Filtrar solo cupones válidos (activos, no vencidos, con usos disponibles)
  const validCoupons = availableCoupons.filter(c => {
    const validation = isCouponValid(c);
    return validation.valid;
  });

  if (validCoupons.length === 0) {
    section.style.display = 'none';
    return;
  }

  // Hay cupones válidos: mostrar la sección
  section.style.display = '';
}

function updateCouponHint() {
  const hint = document.getElementById('couponHint');
  if (!hint) return;

  // Asegurar visibilidad de la sección primero
  updateCouponSectionVisibility();

  // Si la sección está oculta, no mostrar hint
  const section = document.getElementById('couponSection');
  if (section && section.style.display === 'none') {
    hint.style.display = 'none';
    return;
  }

  // Filtrar cupones aplicables al carrito actual
  const applicable = availableCoupons.filter(c => {
    const valid = isCouponValid(c);
    if (!valid.valid) return false;
    const app = isCouponApplicable(c, state.cart);
    return app.applicable;
  });

  if (applicable.length > 0) {
    const codes = applicable.map(c => c.code).join(', ');
    hint.innerHTML = '💡 Cupones disponibles: <strong>' + codes + '</strong>';
    hint.classList.add('show');
  } else if (state.cart.length > 0) {
    hint.innerHTML = '💡 No hay cupones aplicables a tu carrito actual';
    hint.classList.add('show');
  } else {
    hint.style.display = 'none';
  }
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const info = document.getElementById('couponInfo');
  const code = input.value.trim().toUpperCase();

  if (!code) {
    showCouponMessage('Ingresa un código de cupón', 'warning');
    return;
  }

  // Verificar si ya hay un cupón aplicado
  if (currentCoupon && currentCoupon.code === code) {
    showCouponMessage('Este cupón ya está aplicado', 'warning');
    return;
  }

  // Recargar cupones por si el admin los actualizó
  loadCouponsFromAdmin();

  const coupon = availableCoupons.find(c => c.code === code);

  if (!coupon) {
    showCouponMessage('Cupón no encontrado', 'error');
    return;
  }

  // Validar estado del cupón
  const validation = isCouponValid(coupon);
  if (!validation.valid) {
    showCouponMessage(validation.reason, 'error');
    return;
  }

  // Verificar mínimo de compra
  const subtotal = getCartSubtotal();
  if (subtotal < (coupon.minPurchase || 0)) {
    showCouponMessage('Mínimo de compra: ' + formatPrice(coupon.minPurchase), 'warning');
    return;
  }

  // Verificar si aplica a productos del carrito
  const applicability = isCouponApplicable(coupon, state.cart);
  if (!applicability.applicable) {
    showCouponMessage(applicability.reason, 'warning');
    return;
  }

  // Calcular descuento
  const discount = calculateDiscount(coupon, applicability.eligibleSubtotal);

  if (discount <= 0) {
    showCouponMessage('Este cupón no genera descuento para tu carrito', 'warning');
    return;
  }

  // Aplicar cupón
  currentCoupon = {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: discount,
    eligibleSubtotal: applicability.eligibleSubtotal
  };

  // Guardar en localStorage para persistencia
  try {
    localStorage.setItem('khaos_cart_coupon', JSON.stringify(currentCoupon));
  } catch(e) {}

  // Actualizar UI
  showCouponApplied(coupon, discount);
  updateCartUI();
  showToast('Cupón ' + coupon.code + ' aplicado: -' + formatPrice(discount), 'success');
}

function showCouponMessage(message, type) {
  const info = document.getElementById('couponInfo');
  info.textContent = message;
  info.className = 'coupon-info show ' + type;
  setTimeout(() => {
    info.classList.remove('show');
  }, 4000);
}

function showCouponApplied(coupon, discount) {
  const inputWrap = document.getElementById('couponInputWrap');
  const applied = document.getElementById('couponApplied');
  const codeEl = document.getElementById('couponAppliedCode');
  const valueEl = document.getElementById('couponAppliedValue');

  inputWrap.style.display = 'none';
  applied.style.display = 'flex';
  codeEl.textContent = coupon.code;
  valueEl.textContent = coupon.type === 'percentage' ? '-' + coupon.value + '%' : '-' + formatPrice(discount);
}

function removeCoupon() {
  currentCoupon = null;
  try { localStorage.removeItem('khaos_cart_coupon'); } catch(e) {}

  const inputWrap = document.getElementById('couponInputWrap');
  const applied = document.getElementById('couponApplied');
  const input = document.getElementById('couponInput');

  inputWrap.style.display = 'flex';
  applied.style.display = 'none';
  input.value = '';

  updateCartUI();
  showToast('Cupón removido', 'info');
}

function loadAppliedCoupon() {
  try {
    const saved = localStorage.getItem('khaos_cart_coupon');
    if (saved) {
      currentCoupon = JSON.parse(saved);
      // Recalcular descuento con precios actuales
      loadCouponsFromAdmin();
      const couponData = availableCoupons.find(c => c.code === currentCoupon.code);
      if (couponData) {
        const applicability = isCouponApplicable(couponData, state.cart);
        if (applicability.applicable) {
          const discount = calculateDiscount(couponData, applicability.eligibleSubtotal);
          currentCoupon.discount = discount;
          showCouponApplied(couponData, discount);
        } else {
          removeCoupon();
        }
      } else {
        removeCoupon();
      }
    }
  } catch(e) {
    currentCoupon = null;
  }
}

// Escuchar cambios en cupones del admin
window.addEventListener('storage', function(e) {
  if (e.key === 'khaos_admin_coupons') {
    loadCouponsFromAdmin();
    // Revalidar cupón aplicado
    if (currentCoupon) {
      const coupon = availableCoupons.find(c => c.code === currentCoupon.code);
      if (!coupon || !isCouponValid(coupon).valid) {
        showToast('El cupón aplicado ya no está disponible', 'warning');
        removeCoupon();
      }
    }
  }
});



document.addEventListener('DOMContentLoaded', init);

/* Cleanup on page unload */
window.addEventListener('beforeunload', () => {
  clearTimeout(searchDebounceTimer);
});

/* ===== MOBILE ACCORDION ===== */
function toggleMobileAccordion(btn) {
  const panel = btn.nextElementSibling;
  const isOpen = btn.getAttribute('aria-expanded') === 'true';

  // Toggle current accordion only (allow multiple open)
  btn.setAttribute('aria-expanded', !isOpen);
  panel.style.display = isOpen ? 'none' : 'flex';
}

// Manejador global de errores de imagen - muestra placeholder en lugar de ocultar
document.addEventListener('error', function(e) {
  if (e.target.tagName === 'IMG') {
    const img = e.target;
    // No ocultar logos o iconos importantes, ni imágenes ya procesadas
    if (img.classList.contains('nav-logo-mark')) return;
    if (img.dataset.errorHandled === 'true') return;
    img.dataset.errorHandled = 'true';
    // Para productos, mostrar un placeholder con emoji
    img.style.display = 'none';
    const wrap = img.closest('.product-card-img-wrap, .modal-img-wrap, .cart-item-img');
    if (wrap && !wrap.querySelector('.img-placeholder')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'img-placeholder';
      placeholder.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:48px;opacity:0.3;pointer-events:none;';
      placeholder.textContent = '⚽';
      wrap.appendChild(placeholder);
    }
  }
}, true);
