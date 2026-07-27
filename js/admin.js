
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
const categoryColors = {
    "nino-sintetica-corta": "#f39c12", "sintetica-corta": "#e67e22",
    "nino-sintetica-bota": "#1abc9c", "sintetica-bota": "#16a085",
    "gc-tache-aluminio": "#c0392b", "nino-guayo-corto": "#8e44ad",
    "guayo-corto": "#e74c3c", "gb-tache-aluminio": "#d35400",
    "nino-guayo-bota": "#27ae60", "guayo-bota": "#2980b9",
    "nino-futsal-corto": "#f1c40f", "futsal-corto": "#9b59b6",
    "nino-futsal-bota": "#3498db", "futsal-bota": "#7f8c8d"
};

const categoryHierarchy = {
    adulto: {
        label: 'Adulto',
        icon: 'fa-user',
        color: '#3b82f6',
        families: {
            sintetica: {
                label: 'Sintética',
                icon: 'fa-leaf',
                color: '#22c55e',
                categories: ['sintetica-corta', 'sintetica-bota']
            },
            guayo: {
                label: 'Guayo',
                icon: 'fa-futbol',
                color: '#ef4444',
                categories: ['guayo-corto', 'guayo-bota', 'gc-tache-aluminio', 'gb-tache-aluminio']
            },
            futsal: {
                label: 'Futsal',
                icon: 'fa-home',
                color: '#f59e0b',
                categories: ['futsal-corto', 'futsal-bota']
            }
        }
    },
    nino: {
        label: 'Niño',
        icon: 'fa-child',
        color: '#a855f7',
        families: {
            sintetica: {
                label: 'Sintética',
                icon: 'fa-leaf',
                color: '#22c55e',
                categories: ['nino-sintetica-corta', 'nino-sintetica-bota']
            },
            guayo: {
                label: 'Guayo',
                icon: 'fa-futbol',
                color: '#ef4444',
                categories: ['nino-guayo-corto', 'nino-guayo-bota']
            },
            futsal: {
                label: 'Futsal',
                icon: 'fa-home',
                color: '#f59e0b',
                categories: ['nino-futsal-corto', 'nino-futsal-bota']
            }
        }
    }
};

// Helper: get group and family for a category
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

// Helper: get all categories under a group or family
function getCategoriesByScope(scope, scopeId, groupKey) {
    if (scope === 'group') {
        const group = categoryHierarchy[scopeId];
        if (!group) return [];
        return Object.values(group.families).flatMap(f => f.categories);
    }
    if (scope === 'family') {
        // Si se proporciona groupKey, buscar SOLO en ese grupo
        if (groupKey && categoryHierarchy[groupKey]) {
            const family = categoryHierarchy[groupKey].families[scopeId];
            if (family) return family.categories;
            return [];
        }
        // Fallback: buscar en todos los grupos (para compatibilidad)
        for (const group of Object.values(categoryHierarchy)) {
            const family = group.families[scopeId];
            if (family) return family.categories;
        }
    }
    return [];
}


const badgeConfig = {
    bestseller:  { label: 'Más vendido',   icon: 'fa-fire',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', emoji: '🔥' },
    new:         { label: 'Nuevo',         icon: 'fa-star',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', emoji: '⭐' },
    promo:       { label: 'Promoción',     icon: 'fa-tag',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', emoji: '🏷️' },
    lastunits:   { label: 'Últimas unidades', icon: 'fa-bolt',   color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', emoji: '⚡' },
    limited:     { label: 'Edición limitada', icon: 'fa-gem',    color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)', emoji: '💎' },
    recommended: { label: 'Recomendado',   icon: 'fa-crown',     color: '#D4AF37', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.2)', emoji: '👑' },
    clearance:   { label: 'Liquidación',   icon: 'fa-broom',     color: '#ec4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.2)', emoji: '🧹' },
    preorder:    { label: 'Preventa',      icon: 'fa-calendar',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', emoji: '📅' },
    webonly:     { label: 'Exclusivo web',  icon: 'fa-globe',    color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', emoji: '🌐' }
};
// defaultProducts removed - admin starts with empty product list

// ===== STATE =====
let products = [];
let orders = [];
let nextId = 9;
let nextOrderId = 1;
let currentSizes = {};
let selectedIds = new Set();
let currentTab = 'all';
let currentCategoryFilter = 'all';
let currentSort = { field: null, dir: 'asc' };
let currentPage = 1;
let currentOrderFilter = 'all';
const itemsPerPage = 10;
let confirmCallback = null;
let charts = {};
let notifications = [];
const allSizes = ["30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45"];

// ===== SECURITY MODULE =====
const Security = {
    maxAttempts: 5,
    lockoutDuration: 5 * 60 * 1000,
    defaultHash: 'f0bdce7f3ab50bc2a10a9bb69ef2d05c24edfe56d40a3d023d8bad95a9f4ac5a',

    getAttempts() {
        try {
            const data = JSON.parse(sessionStorage.getItem('khaos_login_attempts') || '{}');
            if (data.lockedUntil && Date.now() > data.lockedUntil) {
                sessionStorage.removeItem('khaos_login_attempts');
                return { count: 0, lockedUntil: null };
            }
            return data;
        } catch(e) { return { count: 0, lockedUntil: null }; }
    },

    recordAttempt() {
        const data = this.getAttempts();
        data.count = (data.count || 0) + 1;
        if (data.count >= this.maxAttempts) {
            data.lockedUntil = Date.now() + this.lockoutDuration;
        }
        try { sessionStorage.setItem('khaos_login_attempts', JSON.stringify(data)); } catch(e) {}
        return data;
    },

    isLocked() {
        const data = this.getAttempts();
        return data.lockedUntil && Date.now() < data.lockedUntil;
    },

    getLockoutTime() {
        const data = this.getAttempts();
        return data.lockedUntil ? Math.ceil((data.lockedUntil - Date.now()) / 1000) : 0;
    },

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'khaos-salt-v1');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async verifyPassword(password) {
        const hash = await this.hashPassword(password);
        let storedHash;
        try { storedHash = localStorage.getItem('khaos_admin_hash'); } catch(e) {}
        return hash === (storedHash || this.defaultHash);
    },

    async storePassword(password) {
        const hash = await this.hashPassword(password);
        try { localStorage.setItem('khaos_admin_hash', hash); } catch(e) {}
    },

    sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    sanitizeAttr(str) {
        if (!str) return '';
        return String(str).replace(/["&<>]/g, c => ({'"':'&quot;','&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    },

    generateToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    },

    createSession() {
        const sessionId = this.generateToken();
        const expiry = Date.now() + 24 * 60 * 60 * 1000;
        try {
            localStorage.setItem('khaos_session_id', sessionId);
            localStorage.setItem('khaos_session_expiry', expiry.toString());
        } catch(e) {}
        return { sessionId, expiry };
    },

    validateSession() {
        try {
            const sessionId = localStorage.getItem('khaos_session_id');
            const expiry = parseInt(localStorage.getItem('khaos_session_expiry') || '0');
            return sessionId && Date.now() < expiry;
        } catch(e) { return false; }
    },

    clearSession() {
        try {
            localStorage.removeItem('khaos_session_id');
            localStorage.removeItem('khaos_session_expiry');
            localStorage.removeItem('khaos_admin_loggedin');
            localStorage.removeItem('khaos_admin_session');
        } catch(e) {}
    }
};

// ===== AUTH =====
function checkAuth() {
    try {
        if (Security.validateSession()) {
            showApp();
            return true;
        }
    } catch(e) {}
    showLogin();
    return false;
}
function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appLayout').style.display = 'none';
}
function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appLayout').style.display = 'flex';
}
function doLogin() {
    if (Security.isLocked()) {
        const seconds = Security.getLockoutTime();
        document.getElementById('loginError').textContent = 'Demasiados intentos. Espera ' + seconds + ' segundos.';
        document.getElementById('loginError').classList.add('show');
        return;
    }

    const password = document.getElementById('loginPassword').value;

    Security.verifyPassword(password).then(function(valid) {
        if (valid) {
            try {
                Security.createSession();
                sessionStorage.removeItem('khaos_login_attempts');
            } catch(e) {}
            document.getElementById('loginError').classList.remove('show');
            document.getElementById('loginPassword').value = '';
            showApp();
            init();
            showToast('Bienvenido al Panel de Administración', 'success');
        } else {
            Security.recordAttempt();
            var attempts = Security.getAttempts();
            var remaining = Security.maxAttempts - attempts.count;
            document.getElementById('loginError').textContent = remaining > 0 
                ? 'Contraseña incorrecta. ' + remaining + ' intentos restantes.' 
                : 'Cuenta bloqueada por 5 minutos.';
            document.getElementById('loginError').classList.add('show');
            document.getElementById('loginPassword').value = '';
            document.getElementById('loginPassword').focus();
        }
    }).catch(function(err) {
        console.error('Login error:', err);
        document.getElementById('loginError').textContent = 'Error al verificar credenciales.';
        document.getElementById('loginError').classList.add('show');
    });
}
function logout() {
    Security.clearSession();
    showLogin();
    showToast('Sesión cerrada', 'info');
}
function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    Security.verifyPassword(current).then(function(valid) {
        if (!valid) { showToast('Contraseña actual incorrecta', 'error'); return; }
        if (newPass.length < 8) { showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error'); return; }
        if (!/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
            showToast('La contraseña debe incluir mayúscula, minúscula y número', 'error'); return;
        }
        if (newPass !== confirm) { showToast('Las contraseñas no coinciden', 'error'); return; }

        Security.storePassword(newPass).then(function() {
            closeModal('passwordModalOverlay');
            showToast('Contraseña actualizada correctamente', 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        });
    });
}
function showChangePasswordModal() { openModal('passwordModalOverlay'); }

// ===== THEME =====
function loadTheme() {
    try {
        const theme = localStorage.getItem('khaos_theme');
        if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
        updateThemeIcon();
    } catch(e) {}
}
function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'light');
    try { localStorage.setItem('khaos_theme', isLight ? 'dark' : 'light'); } catch(e) {}
    updateThemeIcon();
    showToast(isLight ? 'Modo oscuro activado' : 'Modo claro activado', 'info');
}
function updateThemeIcon() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.getElementById('themeIcon').className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    // Actualizar también el menú "más opciones"
    const moreIcon = document.getElementById('moreThemeIcon');
    const moreLabel = document.getElementById('moreThemeLabel');
    if (moreIcon) moreIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    if (moreLabel) moreLabel.textContent = isLight ? 'Modo claro' : 'Modo oscuro';
}
function toggleSettingDark() {
    const el = document.getElementById('settingDarkMode');
    el.classList.toggle('active');
    toggleTheme();
}

// ===== INIT =====

// ===== HIERARCHICAL SIDEBAR RENDER =====
function renderSidebarCategories() {
    const container = document.getElementById('sidebarCategories');
    if (!container) return;
    let html = '';
    for (const [groupKey, group] of Object.entries(categoryHierarchy)) {
        const groupCount = products.filter(p => {
            const meta = getCategoryMeta(p.category);
            return meta.group === groupKey;
        }).length;
        html += `<div class="sidebar-group" id="sidebar-group-${groupKey}">
            <div class="sidebar-group-header" onclick="toggleSidebarGroup('${groupKey}')">
                <i class="fas ${group.icon} group-icon" style="color:${group.color};"></i>
                <span class="sidebar-text">${group.label}</span>
                <span class="badge" style="margin-left:auto;background:${group.color}20;color:${group.color};border:1px solid ${group.color}30;">${groupCount}</span>
                <i class="fas fa-chevron-right chevron"></i>
            </div>
            <div class="sidebar-group-children">
                <button class="sidebar-family ${currentCategoryFilter === 'group:' + groupKey ? 'active' : ''}" onclick="filterByFamily('group:${groupKey}')">
                    <i class="fas fa-th-large"></i> Todo ${group.label}
                </button>`;
        for (const [familyKey, family] of Object.entries(group.families)) {
            const familyCount = products.filter(p => {
                const meta = getCategoryMeta(p.category);
                return meta.group === groupKey && meta.family === familyKey;
            }).length;
            html += `<button class="sidebar-family ${currentCategoryFilter === 'family:' + familyKey + ':' + groupKey ? 'active' : ''}" onclick="filterByFamily('family:${familyKey}:${groupKey}')">
                <i class="fas ${family.icon}" style="color:${family.color};"></i> ${family.label}
                <span class="count">${familyCount}</span>
            </button>`;
        }
        html += `</div></div>`;
    }
    container.innerHTML = html;
}

function toggleSidebarGroup(groupKey) {
    const group = document.getElementById('sidebar-group-' + groupKey);
    group.classList.toggle('open');
}

function filterByFamily(filter) {
    currentCategoryFilter = filter;
    currentPage = 1;
    currentTab = 'all'; // Reset tab when changing family
    // Reset tab visuals
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab')?.classList.add('active'); // Set first tab (Todos) as active
    renderSidebarCategories();
    renderCategoryChips();
    renderTable();
    // If not on products view, switch to it
    const productsView = document.getElementById('view-products');
    if (productsView && productsView.style.display === 'none') {
        switchView('products');
    }
}

// Override getFilteredProducts to handle hierarchical filters



function init() {
    loadProducts();
    loadOrders();
    loadCoupons();
    loadTheme();
    loadSidebarState();
    loadSettings();
    updateGithubUI();
    loadOrientation();
    initAutoHideSidebar();
    createLoginParticles();
    updateAllStats();
    renderSidebarCategories();
    renderCategoryChips();
    renderTable();
    updateDashboard();
    renderCategoriesView();
    renderInventory();
    renderOrders();
    initCharts();
    initStorageListener();
    initEventListeners();
    initScrollEffects();
    startRealtimeSimulation();
    showToast('Panel cargado correctamente', 'success');
    // Delayed re-render to ensure everything is ready
    setTimeout(() => { renderTable(); renderSidebarCategories(); renderCategoryChips(); }, 100);
}

function createLoginParticles() {
    const container = document.getElementById('loginParticles');
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

function initScrollEffects() {
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                const scrollTop = window.pageYOffset;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                document.getElementById('scrollIndicator').style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
                ticking = false;
            });
            ticking = true;
        }
    });
}

function loadProducts() {
    try {
        const saved = localStorage.getItem('khaos_admin_products');
        if (saved) { 
            const parsed = JSON.parse(saved); 
            if (Array.isArray(parsed) && parsed.length > 0) { 
                products = parsed; 
                nextId = Math.max(...products.map(p => p.id), 0) + 1; 
                return; 
            }
        }
    } catch(e) {}
    // Sin productos por defecto - iniciar vacío
    products = [];
    nextId = 1;
    saveProducts();
}
function saveProducts() { try { localStorage.setItem('khaos_admin_products', JSON.stringify(products)); } catch(e) {} updateAllStats(); renderTable(); updateDashboard(); renderCategoriesView(); renderInventory(); updateCharts(); }

function loadOrders() {
    try {
        const saved = localStorage.getItem('khaos_admin_orders');
        if (saved) { 
            const parsed = JSON.parse(saved); 
            if (Array.isArray(parsed)) { 
                orders = parsed; 
                nextOrderId = Math.max(...orders.map(o => o.id), 0) + 1;
                return;
            }
        }
    } catch(e) {}
    // Sin pedidos de muestra - iniciar vacío
    orders = [];
    nextOrderId = 1;
    saveOrders();
}
function saveOrders() { try { localStorage.setItem('khaos_admin_orders', JSON.stringify(orders)); } catch(e) {} renderOrders(); updateOrderStats(); }
function generateSampleOrders() {
    // Pedidos de muestra desactivados - solo pedidos manuales
    orders = [];
    nextOrderId = 1;
    saveOrders();
}

function loadSidebarState() {
    try { const collapsed = localStorage.getItem('khaos_sidebar_collapsed') === 'true'; if (collapsed) toggleSidebar(false); } catch(e) {}
}

// ===== STATS =====
function updateAllStats() {
    document.getElementById('dashTotalProducts').textContent = products.length;
    document.getElementById('dashActiveProducts').textContent = products.filter(p => p.sizes.some(s => !p.outOfStock.includes(s))).length;
    document.getElementById('dashBestsellers').textContent = products.filter(p => p.badge === 'bestseller').length;
    document.getElementById('dashNewProducts').textContent = products.filter(p => p.badge === 'new').length;
    document.getElementById('dashAdulto').textContent = products.filter(p => getCategoryMeta(p.category).group === 'adulto').length;
    document.getElementById('dashNino').textContent = products.filter(p => getCategoryMeta(p.category).group === 'nino').length;
    document.getElementById('dashSintetica').textContent = products.filter(p => getCategoryMeta(p.category).family === 'sintetica').length;
    document.getElementById('dashGuayo').textContent = products.filter(p => getCategoryMeta(p.category).family === 'guayo').length;
    document.getElementById('dashFutsal').textContent = products.filter(p => getCategoryMeta(p.category).family === 'futsal').length;
    // Auto-badge: últimas unidades si quedan <= 2 tallas
    products.forEach(p => {
        const availableCount = p.sizes.filter(s => !p.outOfStock.includes(s)).length;
        if (availableCount <= 2 && availableCount > 0 && !p.badge) {
            // No sobrescribir badges manuales, solo sugerir visualmente
        }
    });
    document.getElementById('sidebarProductCount').textContent = products.length;
    document.getElementById('statTotal').textContent = products.length;
    document.getElementById('statGuayo').textContent = products.filter(p => {
        const meta = getCategoryMeta(p.category);
        return meta.family === 'guayo';
    }).length;
    document.getElementById('statSintetica').textContent = products.filter(p => {
        const meta = getCategoryMeta(p.category);
        return meta.family === 'sintetica';
    }).length;
    document.getElementById('statFutsal').textContent = products.filter(p => {
        const meta = getCategoryMeta(p.category);
        return meta.family === 'futsal';
    }).length;
    document.getElementById('statNino').textContent = products.filter(p => {
        const meta = getCategoryMeta(p.category);
        return meta.group === 'nino';
    }).length;
    document.getElementById('statAgotados').textContent = products.filter(p => p.sizes.every(s => p.outOfStock.includes(s))).length;
    document.getElementById('tabAll').textContent = products.length;
    document.getElementById('tabBest').textContent = products.filter(p => p.badge === 'bestseller').length;
    document.getElementById('tabNew').textContent = products.filter(p => p.badge === 'new').length;
    document.getElementById('tabPromo').textContent = products.filter(p => p.badge === 'promo').length;
    document.getElementById('tabLastUnits').textContent = products.filter(p => p.badge === 'lastunits').length;
    document.getElementById('tabLimited').textContent = products.filter(p => p.badge === 'limited').length;
    document.getElementById('tabPreorder').textContent = products.filter(p => p.badge === 'preorder').length;
    document.getElementById('tabOut').textContent = products.filter(p => p.sizes.every(s => p.outOfStock.includes(s))).length;
    updateOrderStats();
    // Update sidebar categories
    renderSidebarCategories();
}

function updateOrderStats() {
    document.getElementById('orderTotal').textContent = orders.length;
    document.getElementById('orderPending').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('orderDelivered').textContent = orders.filter(o => o.status === 'delivered').length;
    document.getElementById('orderRevenue').textContent = '$' + orders.reduce((s, o) => s + o.total, 0).toLocaleString('es-CO');
    const badge = document.getElementById('sidebarOrderCount');
    const pending = orders.filter(o => o.status === 'pending').length;
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'flex' : 'none';
}

function updateDashboard() {
    const tbody = document.getElementById('activityTableBody');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state" style="padding:40px 20px;"><div class="empty-state-icon" style="width:60px;height:60px;font-size:24px;"><i class="fas fa-history"></i></div><h3 style="font-size:16px;">Sin actividad reciente</h3></div></td></tr>';
        return;
    }
    const recent = [...products].reverse().slice(0, 5);
    tbody.innerHTML = recent.map(p => {
        const badge = p.badge && badgeConfig[p.badge] 
            ? `<span class="badge" style="background:${badgeConfig[p.badge].bg};color:${badgeConfig[p.badge].color};border-color:${badgeConfig[p.badge].border};"><i class="fas ${badgeConfig[p.badge].icon}"></i> ${badgeConfig[p.badge].label}</span>`
            : '<span class="badge badge-gray">Normal</span>';
        return `<tr><td><div class="product-cell"><img class="product-thumb" src="${p.image || ''}" onerror="this.style.opacity='0.3'"><div class="product-cell-info"><div class="product-cell-name">${p.name}</div><div class="product-cell-code">${p.code}</div></div></div></td><td><span class="badge badge-blue">Creado</span></td><td style="color:var(--fog);font-size:12px;">Reciente</td><td>${badge}</td></tr>`;
    }).join('');
}

// ===== CHARTS =====
function initCharts() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLight ? '#495057' : '#888888';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)';
    
    const catCounts = {};
    products.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
    const catLabels = Object.keys(catCounts).map(c => categoryNames[c] || c);
    const catData = Object.values(catCounts);
    const catColors = Object.keys(catCounts).map(c => categoryColors[c] || '#888');
    
    const ctxCat = document.getElementById('chartCategories');
    if (ctxCat) {
        charts.categories = new Chart(ctxCat, {
            type: 'bar',
            data: { labels: catLabels, datasets: [{ label: 'Productos', data: catData, backgroundColor: catColors, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor } } } }
        });
    }
    
    const available = products.reduce((s, p) => s + p.sizes.filter(sz => !p.outOfStock.includes(sz)).length, 0);
    const outStock = products.reduce((s, p) => s + p.outOfStock.length, 0);
    const ctxStock = document.getElementById('chartStock');
    if (ctxStock) {
        charts.stock = new Chart(ctxStock, {
            type: 'doughnut',
            data: { labels: ['Disponible', 'Agotado'], datasets: [{ data: [available, outStock], backgroundColor: ['#22c55e', '#ef4444'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } }, cutout: '65%' }
        });
    }
    
    const ctxTrend = document.getElementById('chartTrend');
    if (ctxTrend) {
        charts.trend = new Chart(ctxTrend, {
            type: 'line',
            data: { labels: ['Ene','Feb','Mar','Abr','May','Jun'], datasets: [{ label: 'Productos', data: [4,5,6,6,7,products.length], borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#D4AF37', pointBorderColor: '#fff', pointBorderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor } } } }
        });
    }
    
    const adultCount = products.filter(p => !p.category.startsWith('nino-')).length;
    const ninoCount = products.filter(p => p.category.startsWith('nino-')).length;
    const ctxLine = document.getElementById('chartLine');
    if (ctxLine) {
        charts.line = new Chart(ctxLine, {
            type: 'pie',
            data: { labels: ['Adulto', 'Niño'], datasets: [{ data: [adultCount, ninoCount], backgroundColor: ['#3b82f6', '#f59e0b'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } }
        });
    }
    
    const priceCats = [...new Set(products.map(p => p.category))];
    const avgPrices = priceCats.map(c => {
        const catProds = products.filter(p => p.category === c);
        return Math.round(catProds.reduce((s, p) => s + p.price, 0) / catProds.length);
    });
    const ctxPrices = document.getElementById('chartPrices');
    if (ctxPrices) {
        charts.prices = new Chart(ctxPrices, {
            type: 'bar',
            data: { labels: priceCats.map(c => categoryNames[c] || c), datasets: [{ label: 'Precio promedio', data: avgPrices, backgroundColor: priceCats.map(c => categoryColors[c] || '#888'), borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, callback: v => '$' + v.toLocaleString() } }, x: { grid: { display: false }, ticks: { color: textColor } } } }
        });
    }
}

function updateCharts() {
    Object.values(charts).forEach(c => { if (c && typeof c.destroy === 'function') { c.destroy(); c = null; } });
    charts = {};
    initCharts();
}

// ===== CATEGORY CHIPS =====
// ===== CATEGORY FILTER DROPDOWN =====
function toggleCatFilter() {
    const wrap = document.getElementById('catFilterWrap');
    wrap.classList.toggle('open');
    const chevron = document.getElementById('catFilterChevron');
    chevron.style.transform = wrap.classList.contains('open') ? 'rotate(180deg)' : '';
    if (wrap.classList.contains('open')) renderCatFilterContent();
}

function renderCatFilterContent() {
    const container = document.getElementById('catFilterContent');
    let html = '<div class="cat-filter-tree">';

    for (const [groupKey, group] of Object.entries(categoryHierarchy)) {
        const groupCount = products.filter(p => {
            const meta = getCategoryMeta(p.category);
            return meta.group === groupKey;
        }).length;
        if (groupCount === 0) continue;

        const isGroupActive = currentCategoryFilter === 'group:' + groupKey;

        html += `<div class="cat-tree-group">
            <div class="cat-tree-group-header ${isGroupActive ? 'active' : ''}" 
                 onclick="filterByFamily('group:${groupKey}'); toggleCatFilter();"
                 style="${isGroupActive ? 'border-left-color:' + group.color + ';' : ''}">
                <span class="group-icon" style="background:${group.color}20;color:${group.color};">
                    <i class="fas ${group.icon}"></i>
                </span>
                <span>${group.label}</span>
                <span class="group-count">${groupCount}</span>
            </div>
            <div class="cat-tree-children">`;

        for (const [familyKey, family] of Object.entries(group.families)) {
            const familyCount = products.filter(p => {
                const meta = getCategoryMeta(p.category);
                return meta.group === groupKey && meta.family === familyKey;
            }).length;
            if (familyCount === 0) continue;

            const isFamilyActive = currentCategoryFilter === 'family:' + familyKey + ':' + groupKey;

            html += `<div class="cat-tree-child ${isFamilyActive ? 'active' : ''}" 
                     onclick="filterByFamily('family:${familyKey}:${groupKey}'); toggleCatFilter();">
                <span class="child-icon" style="background:${family.color}15;color:${family.color};">
                    <i class="fas ${family.icon}"></i>
                </span>
                <span>${family.label}</span>
                <span class="child-count">${familyCount}</span>
            </div>`;
        }

        html += `</div></div>`;
    }

    html += '</div>';
    container.innerHTML = html || '<div style="color:var(--fog);font-size:12px;padding:16px;text-align:center;">Sin categorías</div>';
}

function updateActiveFilterPill() {
    const container = document.getElementById('activeFilterPill');
    if (!container) return;

    if (currentCategoryFilter === 'all' || !currentCategoryFilter) {
        container.innerHTML = '';
        const label = document.getElementById('catFilterLabel');
        const btn = document.getElementById('catFilterBtn');
        if (label) label.textContent = 'Categorías';
        if (btn) btn.classList.remove('active');
        return;
    }

    let label = '';
    let icon = 'fa-filter';
    let color = 'var(--gold)';

    if (currentCategoryFilter.startsWith('group:')) {
        const groupKey = currentCategoryFilter.replace('group:', '');
        const group = categoryHierarchy[groupKey];
        if (group) {
            label = group.label;
            icon = group.icon;
            color = group.color;
        }
    } else if (currentCategoryFilter.startsWith('family:')) {
        const parts = currentCategoryFilter.split(':');
        const familyKey = parts[1];
        const groupKey = parts[2];
        const group = categoryHierarchy[groupKey];
        if (group && group.families[familyKey]) {
            label = group.families[familyKey].label;
            icon = group.families[familyKey].icon;
            color = group.families[familyKey].color;
        }
    } else {
        label = categoryNames[currentCategoryFilter] || currentCategoryFilter;
    }

    const lbl = document.getElementById('catFilterLabel');
    const btn = document.getElementById('catFilterBtn');
    if (lbl) lbl.textContent = label;
    if (btn) btn.classList.add('active');

    container.innerHTML = `<div class="active-filter-pill" style="border-color:${color}40;background:${color}10;color:${color};">
        <i class="fas ${icon}"></i>
        <span>${label}</span>
        <button onclick="event.stopPropagation(); filterByCategory('all');" title="Quitar filtro"><i class="fas fa-times"></i></button>
    </div>`;
}

function renderCategoryChips() {
    updateActiveFilterPill();
}

function filterByCategory(cat) {
    currentCategoryFilter = cat;
    currentPage = 1;
    currentTab = 'all';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const firstTab = document.querySelector('.tab');
    if (firstTab) firstTab.classList.add('active');
    updateActiveFilterPill();
    renderSidebarCategories();
    renderTable();
}

// ===== TABLE =====
function getFilteredProducts() {
    if (!products || !Array.isArray(products)) return [];
    let result = [...products];
    if (currentTab === 'bestseller') result = result.filter(p => p.badge === 'bestseller');
    else if (currentTab === 'new') result = result.filter(p => p.badge === 'new');
    else if (currentTab === 'promo') result = result.filter(p => p.badge === 'promo');
    else if (currentTab === 'lastunits') result = result.filter(p => p.badge === 'lastunits');
    else if (currentTab === 'limited') result = result.filter(p => p.badge === 'limited');
    else if (currentTab === 'recommended') result = result.filter(p => p.badge === 'recommended');
    else if (currentTab === 'clearance') result = result.filter(p => p.badge === 'clearance');
    else if (currentTab === 'preorder') result = result.filter(p => p.badge === 'preorder');
    else if (currentTab === 'webonly') result = result.filter(p => p.badge === 'webonly');
    else if (currentTab === 'outofstock') result = result.filter(p => p.sizes.every(s => p.outOfStock.includes(s)));

    // Hierarchical category filtering
    if (currentCategoryFilter && currentCategoryFilter !== 'all') {
        if (currentCategoryFilter.startsWith('group:')) {
            const groupKey = currentCategoryFilter.replace('group:', '');
            const allowedCats = getCategoriesByScope('group', groupKey);
            result = result.filter(p => allowedCats.includes(p.category));
        } else if (currentCategoryFilter.startsWith('family:')) {
            const parts = currentCategoryFilter.split(':');
            const familyKey = parts[1];
            const groupKey = parts[2]; // Extraer el grupo (adulto o nino)
            const allowedCats = getCategoriesByScope('family', familyKey, groupKey);
            result = result.filter(p => allowedCats.includes(p.category));
        } else {
            result = result.filter(p => p.category === currentCategoryFilter);
        }
    }

    const search = document.getElementById('searchBox').value.toLowerCase().trim();
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search) || (p.code && p.code.toLowerCase().includes(search)) || (categoryNames[p.category] || p.category).toLowerCase().includes(search));
    if (currentSort.field) {
        result.sort((a, b) => {
            let va = a[currentSort.field], vb = b[currentSort.field];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return currentSort.dir === 'asc' ? -1 : 1;
            if (va > vb) return currentSort.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function renderTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-box-open"></i></div><h3>No hay productos</h3><p>Los productos se están cargando...</p></div></td></tr>`;
        return;
    }

    let filtered, total, totalPages, start, end, pageItems;

    try {
        filtered = getFilteredProducts();
        total = filtered.length;
        totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;
        start = (currentPage - 1) * itemsPerPage;
        end = Math.min(start + itemsPerPage, total);
        pageItems = filtered.slice(start, end);
        document.getElementById('pageStart').textContent = total > 0 ? start + 1 : 0;
        document.getElementById('pageEnd').textContent = end;
        document.getElementById('pageTotal').textContent = total;
        renderPagination(totalPages);
        updateBulkBar();
    } catch (err) {
        console.error('Error en renderTable:', err);
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>Error al cargar productos</h3><p>${err.message}</p><button class="btn btn-primary" onclick="location.reload()" style="margin-top:10px;"><i class="fas fa-redo"></i> Recargar</button></div></td></tr>`;
        return;
    }

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-box-open"></i></div><h3>No hay productos</h3><p>Agrega productos o ajusta los filtros</p><button class="btn btn-primary" onclick="openProductModal()" style="margin-top:10px;"><i class="fas fa-plus"></i> Nuevo Producto</button></div></td></tr>`;
        return;
    }

    tbody.innerHTML = pageItems.map(p => {
        const sizesHtml = p.sizes.slice(0, 6).map(s => `<span class="size-pill ${p.outOfStock.includes(s) ? 'out' : 'available'}">${s}</span>`).join('');
        const moreSizes = p.sizes.length > 6 ? `<span class="size-pill available">+${p.sizes.length - 6}</span>` : '';
        const badgeHtml = p.badge && badgeConfig[p.badge] 
            ? `<span class="badge" style="background:${badgeConfig[p.badge].bg};color:${badgeConfig[p.badge].color};border-color:${badgeConfig[p.badge].border};"><i class="fas ${badgeConfig[p.badge].icon}"></i> ${badgeConfig[p.badge].label}</span>`
            : '<span class="badge badge-gray">Normal</span>';
        const isSelected = selectedIds.has(p.id);
        const catColor = categoryColors[p.category] || '#888';
        const meta = getCategoryMeta(p.category);
        return `<tr class="${isSelected ? 'selected' : ''}"><td data-label="Seleccionar"><div class="checkbox ${isSelected ? 'checked' : ''}" onclick="toggleSelect(${p.id}, event)">${isSelected ? '<i class="fas fa-check"></i>' : ''}</div></td><td data-label="Producto"><div class="product-cell"><img class="product-thumb" src="${p.image || ''}" onerror="this.style.opacity='0.3'"><div class="product-cell-info"><div class="product-cell-name">${p.name}</div><div class="product-cell-code">${p.code}</div></div></div></td><td data-label="Categoría"><div style="display:flex;flex-direction:column;gap:2px;"><span class="badge" style="background:${catColor}15;color:${catColor};border-color:${catColor}30;font-size:11px;padding:3px 10px;">${categoryNames[p.category] || p.category}</span><span style="font-size:10px;color:var(--fog);">${meta.groupLabel} > ${meta.familyLabel}</span></div></td><td data-label="Precio"><div style="font-weight:900;color:var(--gold-light);font-size:15px;">$${p.price.toLocaleString('es-CO')}</div><div style="font-size:11px;color:var(--fog);text-decoration:line-through;">$${p.oldPrice.toLocaleString('es-CO')}</div></td><td data-label="Tallas"><div class="size-pills">${sizesHtml}${moreSizes}</div></td><td data-label="Estado">${badgeHtml}</td><td data-label="Acciones"><div class="action-btns"><button class="action-btn view" onclick="viewProduct(${p.id})" title="Ver"><i class="fas fa-eye"></i></button><button class="action-btn edit" onclick="editProduct(${p.id})" title="Editar"><i class="fas fa-pen"></i></button><button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button></div></td></tr>`;
    }).join('');
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationControls');
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) { if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`; else if (i === currentPage - 2 || i === currentPage + 2) html += `<span style="color:var(--fog);padding:0 4px;">...</span>`; }
    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}
function goToPage(page) { currentPage = page; renderTable(); }

function sortTable(field) {
    if (currentSort.field === field) currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    else { currentSort.field = field; currentSort.dir = 'asc'; }
    document.querySelectorAll('.sort-icon').forEach(el => el.innerHTML = '<i class="fas fa-sort"></i>');
    const iconEl = document.getElementById('sort-' + field);
    if (iconEl) { iconEl.innerHTML = currentSort.dir === 'asc' ? '<i class="fas fa-sort-up"></i>' : '<i class="fas fa-sort-down"></i>'; iconEl.parentElement.classList.add('sorted'); }
    renderTable();
}

function filterByTab(tab, btn) {
    currentTab = tab; currentPage = 1;
    currentCategoryFilter = 'all'; // Reset category filter when changing tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderSidebarCategories(); // Update sidebar to show none selected
    renderCategoryChips(); // Update chips to show none selected
    renderTable();
}

function toggleSelect(id, event) { if (event) event.stopPropagation(); if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id); renderTable(); }
function toggleSelectAll() {
    const filtered = getFilteredProducts();
    const allSelected = filtered.every(p => selectedIds.has(p.id));
    if (allSelected) filtered.forEach(p => selectedIds.delete(p.id)); else filtered.forEach(p => selectedIds.add(p.id));
    renderTable();
}
function updateBulkBar() { const bar = document.getElementById('bulkBar'); const count = selectedIds.size; if (count > 0) { bar.classList.add('active'); document.getElementById('selectedCount').textContent = count; } else bar.classList.remove('active'); }
function clearSelection() { selectedIds.clear(); renderTable(); }
function bulkDelete() {
    if (selectedIds.size === 0) return;
    showConfirm('Eliminar productos', `¿Eliminar ${selectedIds.size} producto(s)? No se puede deshacer.`, () => {
        products = products.filter(p => !selectedIds.has(p.id)); selectedIds.clear(); saveProducts(); renderCategoryChips(); showToast('Productos eliminados', 'success');
    });
}

// ===== PRODUCT MODAL =====
function openProductModal() {
    document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Producto';
    document.getElementById('editId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodCode').value = '';
    document.getElementById('prodCategory').value = 'nino-sintetica-corta';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodOldPrice').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodBadge').value = '';
    initSizesEditor([], []);
    openModal('productModalOverlay');
}
function editProduct(id) {
    const p = products.find(x => x.id === id); if (!p) return;
    document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
    document.getElementById('editId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCode').value = p.code || '';
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodOldPrice').value = p.oldPrice || '';
    document.getElementById('prodImage').value = p.image || '';
    document.getElementById('prodDesc').value = p.desc || '';
    document.getElementById('prodBadge').value = p.badge || '';
    initSizesEditor(p.sizes || [], p.outOfStock || []);
    openModal('productModalOverlay');
}
function viewProduct(id) { const p = products.find(x => x.id === id); if (p) showToast(`${p.name} — $${p.price.toLocaleString('es-CO')}`, 'info'); }
function saveProduct() {
    const editId = document.getElementById('editId').value;
    const name = document.getElementById('prodName').value.trim();
    const code = document.getElementById('prodCode').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseInt(document.getElementById('prodPrice').value) || 0;
    const oldPrice = parseInt(document.getElementById('prodOldPrice').value) || 0;
    const image = document.getElementById('prodImage').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const badge = document.getElementById('prodBadge').value;
    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
    if (!code) { showToast('El código es obligatorio', 'error'); return; }
    if (price <= 0) { showToast('El precio debe ser mayor a 0', 'error'); return; }
    const sizes = []; const outOfStock = [];
    allSizes.forEach(s => { if (currentSizes[s].active) sizes.push(s); if (currentSizes[s].out) outOfStock.push(s); });
    if (sizes.length === 0) { showToast('Selecciona al menos una talla', 'error'); return; }
    if (editId) { const idx = products.findIndex(p => p.id == editId); if (idx >= 0) products[idx] = { id: parseInt(editId), name, code, category, price, oldPrice, image, sizes, outOfStock, desc, badge: badge || null }; showToast('Producto actualizado', 'success'); }
    else { products.push({ id: nextId++, name, code, category, price, oldPrice, image, sizes, outOfStock, desc, badge: badge || null }); showToast('Producto creado', 'success'); }
    saveProducts(); renderCategoryChips(); closeModal('productModalOverlay');
}
function deleteProduct(id) { showConfirm('Eliminar producto', '¿Eliminar este producto? No se puede deshacer.', () => { products = products.filter(p => p.id !== id); selectedIds.delete(id); saveProducts(); renderCategoryChips(); showToast('Producto eliminado', 'success'); }); }

function initSizesEditor(selectedSizes, outOfStock) {
    currentSizes = {};
    allSizes.forEach(s => { currentSizes[s] = { active: selectedSizes.includes(s), out: outOfStock.includes(s) }; });
    renderSizesEditor();
}
function renderSizesEditor() {
    const container = document.getElementById('sizesEditor');
    container.innerHTML = '';
    allSizes.forEach(s => {
        const btn = document.createElement('div');
        btn.className = 'size-toggle' + (currentSizes[s].active ? ' active' : '') + (currentSizes[s].out ? ' out' : '');
        btn.textContent = s;
        btn.onclick = function() { if (!currentSizes[s].active) { currentSizes[s].active = true; currentSizes[s].out = false; } else if (currentSizes[s].active && !currentSizes[s].out) { currentSizes[s].out = true; } else { currentSizes[s].active = false; currentSizes[s].out = false; } renderSizesEditor(); };
        container.appendChild(btn);
    });
}

// ===== ORDERS =====
function renderOrders() {
    const container = document.getElementById('ordersList');
    let filtered = orders;
    if (currentOrderFilter !== 'all') filtered = orders.filter(o => o.status === currentOrderFilter);
    if (filtered.length === 0) { container.innerHTML = '<div class="empty-state" style="padding:40px;"><div class="empty-state-icon" style="width:60px;height:60px;font-size:24px;"><i class="fas fa-shopping-bag"></i></div><h3 style="font-size:16px;">Sin pedidos</h3></div>'; return; }
    container.innerHTML = filtered.map(o => {
        const statusLabels = { pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
        const statusClass = o.status;
        const date = new Date(o.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `<div class="order-card">
            <div class="order-card-header">
                <div><span class="order-id">#${String(o.id).padStart(4,'0')}</span> <span style="color:var(--fog);font-size:12px;margin-left:8px;">${date}</span></div>
                <span class="order-status ${statusClass}">${statusLabels[o.status] || o.status}</span>
            </div>
            <div class="order-items">${o.items.map(i => `<div class="order-item"><img src="${products.find(p=>p.id===i.productId)?.image || ''}" onerror="this.style.display='none'" alt=""><div style="flex:1;"><div style="font-weight:800;font-size:13px;">${i.name}</div><div style="font-size:11px;color:var(--fog);">Talla ${i.size} x${i.qty}</div></div><div style="font-weight:900;color:var(--gold-light);">$${i.price.toLocaleString('es-CO')}</div></div>`).join('')}</div>
            <div class="order-footer">
                <div style="font-size:12px;color:var(--fog);"><i class="fas fa-user" style="margin-right:6px;"></i>${o.customer} · ${o.phone}</div>
                <div style="text-align:right;">
                    ${o.discount > 0 ? `<div style="font-size:11px;color:var(--success);text-decoration:line-through;">$${o.subtotal.toLocaleString('es-CO')}</div>` : ''}
                    <div class="order-total">$${o.total.toLocaleString('es-CO')}</div>
                    ${o.coupon ? `<div style="font-size:11px;color:var(--gold);"><i class="fas fa-ticket-alt"></i> ${o.coupon}</div>` : ''}
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--stone);">
                ${o.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="updateOrderStatus(${o.id},'processing')"><i class="fas fa-check"></i> Procesar</button>` : ''}
                ${o.status === 'processing' ? `<button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${o.id},'shipped')"><i class="fas fa-shipping-fast"></i> Enviar</button>` : ''}
                ${o.status === 'shipped' ? `<button class="btn btn-success btn-sm" onclick="updateOrderStatus(${o.id},'delivered')"><i class="fas fa-check-double"></i> Entregar</button>` : ''}
                <button class="btn btn-ghost btn-sm" onclick="deleteOrder(${o.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}
function updateOrderStatus(id, status) { const o = orders.find(x => x.id === id); if (o) { o.status = status; saveOrders(); showToast(`Pedido #${String(id).padStart(4,'0')} actualizado`, 'success'); addNotification('order', `Pedido #${String(id).padStart(4,'0')} marcado como ${status}`); } }
function deleteOrder(id) { showConfirm('Eliminar pedido', '¿Eliminar este pedido?', () => { orders = orders.filter(o => o.id !== id); saveOrders(); showToast('Pedido eliminado', 'success'); }); }
function filterOrders(status) { currentOrderFilter = status; renderOrders(); toggleDropdown('orderFilterDropdown'); }
// ===== PEDIDO MANUAL =====
let orderItems = [];

function openOrderModal() {
    document.getElementById('orderCustomer').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderAddress').value = '';
    document.getElementById('orderStatus').value = 'pending';
    orderItems = [];
    renderOrderItems();
    updateOrderTotal();
    openModal('orderModalOverlay');
}

function addOrderItem() {
    orderItems.push({ productId: '', size: '', qty: 1 });
    renderOrderItems();
}

function removeOrderItem(index) {
    orderItems.splice(index, 1);
    renderOrderItems();
    updateOrderTotal();
}

function updateOrderItemProduct(index, productId) {
    const product = products.find(p => p.id == productId);
    orderItems[index].productId = parseInt(productId);
    orderItems[index].name = product ? product.name : '';
    orderItems[index].price = product ? product.price : 0;
    orderItems[index].size = '';
    renderOrderItems();
    updateOrderTotal();
}

function updateOrderItemSize(index, size) {
    orderItems[index].size = size;
}

function updateOrderItemQty(index, qty) {
    orderItems[index].qty = parseInt(qty) || 1;
    updateOrderTotal();
}

function renderOrderItems() {
    const container = document.getElementById('orderItemsContainer');
    if (orderItems.length === 0) {
        container.innerHTML = '<div style="color:var(--fog);font-size:13px;padding:10px 0;">Agrega al menos un producto</div>';
        return;
    }
    container.innerHTML = orderItems.map((item, i) => {
        const product = products.find(p => p.id == item.productId);
        const availableSizes = product ? product.sizes.filter(s => !product.outOfStock.includes(s)) : [];
        const sizeOptions = availableSizes.map(s => `<option value="${s}" ${item.size === s ? 'selected' : ''}>${s}</option>`).join('');
        return `<div style="display:grid;grid-template-columns:2fr 1fr 80px 40px;gap:8px;align-items:end;margin-bottom:10px;" class="order-item-row">
            <div>
                <label style="font-size:10px;color:var(--fog);text-transform:uppercase;letter-spacing:1px;">Producto</label>
                <select class="form-select" style="padding:10px 12px;font-size:13px;" onchange="updateOrderItemProduct(${i}, this.value)">
                    <option value="">Seleccionar...</option>
                    ${products.map(p => `<option value="${p.id}" ${item.productId == p.id ? 'selected' : ''}>${p.name} — $${p.price.toLocaleString()}</option>`).join('')}
                </select>
            </div>
            <div>
                <label style="font-size:10px;color:var(--fog);text-transform:uppercase;letter-spacing:1px;">Talla</label>
                <select class="form-select" style="padding:10px 12px;font-size:13px;" onchange="updateOrderItemSize(${i}, this.value)" ${!product ? 'disabled' : ''}>
                    <option value="">Talla</option>
                    ${sizeOptions}
                </select>
            </div>
            <div>
                <label style="font-size:10px;color:var(--fog);text-transform:uppercase;letter-spacing:1px;">Cant.</label>
                <input type="number" class="form-input" style="padding:10px 12px;font-size:13px;" value="${item.qty}" min="1" max="10" onchange="updateOrderItemQty(${i}, this.value)">
            </div>
            <button class="action-btn delete" style="height:40px;" onclick="removeOrderItem(${i})" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>`;
    }).join('');
}

function saveOrder() {
    const customer = document.getElementById('orderCustomer').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const address = document.getElementById('orderAddress').value.trim();
    const status = document.getElementById('orderStatus').value;

    if (!customer) { showToast('El nombre del cliente es obligatorio', 'error'); return; }
    if (!phone) { showToast('El teléfono es obligatorio', 'error'); return; }
    if (!address) { showToast('La dirección es obligatoria', 'error'); return; }
    if (orderItems.length === 0) { showToast('Agrega al menos un producto', 'error'); return; }

    const invalidItems = orderItems.filter(i => !i.productId || !i.size);
    if (invalidItems.length > 0) { showToast('Completa todos los productos (producto y talla)', 'error'); return; }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
    let discount = 0;
    let couponCode = null;
    if (currentOrderCoupon && subtotal >= (currentOrderCoupon.minPurchase || 0)) {
        let eligibleSubtotal = subtotal;
        // If product-specific, calculate discount only on eligible products
        if (currentOrderCoupon.productIds && currentOrderCoupon.productIds.length > 0) {
            eligibleSubtotal = orderItems
                .filter(i => currentOrderCoupon.productIds.includes(i.productId))
                .reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
        }
        if (currentOrderCoupon.type === 'percentage') {
            discount = Math.round(eligibleSubtotal * currentOrderCoupon.value / 100);
        } else {
            discount = currentOrderCoupon.value;
        }
        if (discount > eligibleSubtotal) discount = eligibleSubtotal;
        if (discount > subtotal) discount = subtotal;
        couponCode = currentOrderCoupon.code;
        // Registrar uso del cupón
        const couponIdx = coupons.findIndex(c => c.id === currentOrderCoupon.id);
        if (couponIdx >= 0) {
            coupons[couponIdx].usedCount = (coupons[couponIdx].usedCount || 0) + 1;
            coupons[couponIdx].totalSaved = (coupons[couponIdx].totalSaved || 0) + discount;
            saveCoupons();
        }
    }
    const total = subtotal - discount;

    const order = {
        id: nextOrderId++,
        customer: customer,
        phone: phone,
        address: address,
        items: orderItems.map(i => ({ productId: i.productId, name: i.name, size: i.size, price: i.price, qty: i.qty })),
        subtotal: subtotal,
        discount: discount,
        coupon: couponCode,
        total: total,
        status: status,
        date: new Date().toISOString()
    };

    orders.unshift(order);
    saveOrders();
    closeModal('orderModalOverlay');
    showToast(`Pedido #${String(order.id).padStart(4,'0')} creado exitosamente`, 'success');
    addNotification('order', `Nuevo pedido de ${order.customer} — $${order.total.toLocaleString('es-CO')}${couponCode ? ' (Cupón: ' + couponCode + ')' : ''}`);
}

// ===== PEDIDO SIMULADO (deshabilitado - solo manual) =====
function simulateNewOrder() {
    showToast('Los pedidos automáticos están desactivados. Usa "Nuevo Pedido" para crear uno manualmente.', 'warning');
}
// generateSampleOrders removed - dead code, never called

// ===== CATEGORIES VIEW =====
function renderCategoriesView() {
    const tbody = document.getElementById('categoriesTableBody');
    if (products.length === 0) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state" style="padding:40px;"><h3>Sin categorías</h3></div></td></tr>'; return; }

    let html = '';
    let totalCats = 0;

    for (const [groupKey, group] of Object.entries(categoryHierarchy)) {
        const groupProds = products.filter(p => {
            const meta = getCategoryMeta(p.category);
            return meta.group === groupKey;
        });
        if (groupProds.length === 0) continue;

        html += `<tr style="background:var(--ink);"><td colspan="5" style="padding:12px 14px;font-weight:800;font-size:14px;color:var(--white);"><i class="fas ${group.icon}" style="color:${group.color};margin-right:8px;"></i> ${group.label} <span style="color:var(--fog);font-size:12px;font-weight:600;">(${groupProds.length} productos)</span></td></tr>`;

        for (const [familyKey, family] of Object.entries(group.families)) {
            const familyProds = products.filter(p => {
                const meta = getCategoryMeta(p.category);
                return meta.group === groupKey && meta.family === familyKey;
            });
            if (familyProds.length === 0) continue;

            const familyStock = familyProds.reduce((s, p) => s + p.sizes.filter(sz => !p.outOfStock.includes(sz)).length, 0);
            const familyAvgPrice = Math.round(familyProds.reduce((s, p) => s + p.price, 0) / familyProds.length);

            html += `<tr><td style="padding-left:30px;"><span class="badge" style="background:${family.color}15;color:${family.color};border-color:${family.color}30;font-size:12px;padding:4px 12px;"><i class="fas ${family.icon}" style="margin-right:4px;"></i> ${family.label}</span></td><td style="font-weight:900;font-size:16px;">${familyProds.length}</td><td style="color:var(--fog);">${familyStock} uds</td><td style="font-weight:800;color:var(--gold-light);">$${familyAvgPrice.toLocaleString('es-CO')}</td><td style="color:var(--fog);font-size:11px;">${familyProds.map(p => p.sizes.filter(s => !p.outOfStock.includes(s)).length).reduce((a,b)=>a+b,0)} en stock</td></tr>`;

            // Individual categories within family
            for (const catId of family.categories) {
                const catProds = products.filter(p => p.category === catId);
                if (catProds.length === 0) continue;
                totalCats++;
                const catStock = catProds.reduce((s, p) => s + p.sizes.filter(sz => !p.outOfStock.includes(sz)).length, 0);
                const catAvgPrice = Math.round(catProds.reduce((s, p) => s + p.price, 0) / catProds.length);
                const color = categoryColors[catId] || '#888';
                html += `<tr><td style="padding-left:50px;font-size:12px;color:var(--silver);">└ ${categoryNames[catId] || catId}</td><td style="font-weight:700;font-size:14px;">${catProds.length}</td><td style="color:var(--fog);font-size:12px;">${catStock} uds</td><td style="font-weight:700;color:var(--gold-light);font-size:13px;">$${catAvgPrice.toLocaleString('es-CO')}</td><td></td></tr>`;
            }
        }
    }

    document.getElementById('catCountTotal').textContent = totalCats;
    tbody.innerHTML = html || '<tr><td colspan="5"><div class="empty-state" style="padding:40px;"><h3>Sin categorías</h3></div></td></tr>';
}

// ===== INVENTORY =====
function renderInventory() {
    const alerts = document.getElementById('inventoryAlerts');
    const tbody = document.getElementById('inventoryTableBody');
    const lowStock = products.filter(p => p.sizes.filter(s => !p.outOfStock.includes(s)).length <= 2);
    alerts.innerHTML = lowStock.map(p => `<div class="inventory-alert"><i class="fas fa-exclamation-triangle"></i><p>Stock bajo: ${p.name} (${p.sizes.filter(s => !p.outOfStock.includes(s)).length} tallas)</p><button onclick="editProduct(${p.id})">Gestionar</button></div>`).join('');
    if (lowStock.length === 0) alerts.innerHTML = '';
    tbody.innerHTML = products.map(p => {
        const available = p.sizes.filter(s => !p.outOfStock.includes(s));
        const out = p.outOfStock;
        const status = available.length === 0 ? '<span class="badge badge-red">Sin stock</span>' : available.length <= 2 ? '<span class="badge badge-orange">Stock bajo</span>' : '<span class="badge badge-green">OK</span>';
        const meta = getCategoryMeta(p.category);
        return `<tr><td><div class="product-cell"><img class="product-thumb" src="${p.image || ''}" onerror="this.style.opacity='0.3'"><div class="product-cell-info"><div class="product-cell-name">${p.name}</div><div class="product-cell-code">${p.code}</div></div></div></td><td><div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:12px;font-weight:700;color:var(--ivory);">${categoryNames[p.category] || p.category}</span><span style="font-size:10px;color:var(--fog);">${meta.groupLabel} > ${meta.familyLabel}</span></div></td><td><div class="size-pills">${available.map(s => `<span class="size-pill available">${s}</span>`).join('')}</div></td><td><div class="size-pills">${out.map(s => `<span class="size-pill out">${s}</span>`).join('')}</div></td><td>${status}</td></tr>`;
    }).join('');
}

// ===== SETTINGS =====
function loadSettings() {
    try {
        const s = localStorage.getItem('khaos_settings');
        if (s) { const settings = JSON.parse(s); document.getElementById('settingStoreName').value = settings.storeName || 'Khaos Deportivo'; document.getElementById('settingWhatsapp').value = settings.whatsapp || '573105624563'; document.getElementById('settingInstagram').value = settings.instagram || ''; document.getElementById('settingFacebook').value = settings.facebook || ''; document.getElementById('settingColor').value = settings.color || '#D4AF37'; }
    } catch(e) {}
}
function saveSettings() {
    const settings = { storeName: document.getElementById('settingStoreName').value, whatsapp: document.getElementById('settingWhatsapp').value, instagram: document.getElementById('settingInstagram').value, facebook: document.getElementById('settingFacebook').value, color: document.getElementById('settingColor').value };
    try { localStorage.setItem('khaos_settings', JSON.stringify(settings)); } catch(e) {}
    showToast('Configuración guardada', 'success');
}
function resetSettings() {
    document.getElementById('settingStoreName').value = 'Khaos Deportivo';
    document.getElementById('settingWhatsapp').value = '573105624563';
    document.getElementById('settingInstagram').value = 'https://www.instagram.com/khaosdeportivo';
    document.getElementById('settingFacebook').value = 'https://www.facebook.com/share/1Bkqc7LWJW/';
    document.getElementById('settingColor').value = '#D4AF37';
    showToast('Valores restaurados', 'info');
}

// ===== CUPONES =====
let coupons = [];
let nextCouponId = 1;
let currentCouponFilter = 'all';
let currentOrderCoupon = null;
let selectedCouponProducts = []; // Product IDs selected for coupon

const defaultCoupons = [];

function loadCoupons() {
    try {
        const saved = localStorage.getItem('khaos_admin_coupons');
        if (saved) { 
            const parsed = JSON.parse(saved); 
            if (Array.isArray(parsed) && parsed.length > 0) { 
                coupons = parsed; 
                // Migrate old coupons without productIds
                coupons.forEach(c => {
                    if (c.productIds === undefined) c.productIds = [];
                });
                nextCouponId = Math.max(...coupons.map(c => c.id), 0) + 1;
                return;
            }
        }
    } catch(e) {}
    coupons = JSON.parse(JSON.stringify(defaultCoupons));
    nextCouponId = 11;
    saveCoupons();
}

function saveCoupons() { 
    try { localStorage.setItem('khaos_admin_coupons', JSON.stringify(coupons)); } catch(e) {} 
    updateCouponStats(); 
    renderCoupons();
}

function updateCouponStats() {
    const total = coupons.length;
    const active = coupons.filter(c => isCouponActive(c)).length;
    const used = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
    const saved = coupons.reduce((s, c) => s + ((c.totalSaved || 0)), 0);
    document.getElementById('couponTotal').textContent = total;
    document.getElementById('couponActive').textContent = active;
    document.getElementById('couponUsed').textContent = used;
    document.getElementById('couponSaved').textContent = '$' + saved.toLocaleString('es-CO');
    document.getElementById('sidebarCouponCount').textContent = active;
    document.getElementById('sidebarCouponCount').style.display = active > 0 ? 'flex' : 'none';
    document.getElementById('tabCouponAll').textContent = total;
    document.getElementById('tabCouponActive').textContent = active;
    document.getElementById('tabCouponExpired').textContent = coupons.filter(c => !isCouponActive(c) && isCouponExpired(c)).length;
    document.getElementById('tabCouponPct').textContent = coupons.filter(c => c.type === 'percentage').length;
    document.getElementById('tabCouponFixed').textContent = coupons.filter(c => c.type === 'fixed').length;
}

function isCouponExpired(c) {
    if (!c.endDate) return false;
    return new Date(c.endDate) < new Date();
}

function isCouponActive(c) {
    if (!c.active) return false;
    if (c.maxUses > 0 && c.usedCount >= c.maxUses) return false;
    if (c.startDate && new Date(c.startDate) > new Date()) return false;
    if (c.endDate && new Date(c.endDate) < new Date()) return false;
    return true;
}

function openCouponModal() {
    document.getElementById('couponModalTitle').innerHTML = '<i class="fas fa-ticket-alt"></i> Nuevo Cupón';
    document.getElementById('editCouponId').value = '';
    document.getElementById('couponCode').value = '';
    document.getElementById('couponType').value = 'percentage';
    document.getElementById('couponValue').value = '';
    document.getElementById('couponMinPurchase').value = '0';
    document.getElementById('couponMaxUses').value = '0';
    document.getElementById('couponStartDate').value = '';
    document.getElementById('couponEndDate').value = '';
    document.getElementById('couponAppliesTo').value = 'all';
    document.getElementById('couponActiveToggle').classList.add('active');
    // Reset scope to category
    document.getElementById('scopeCategory').checked = true;
    selectedCouponProducts = [];
    toggleCouponScope();
    renderProductSelector();
    renderProductSelectorTags();
    openModal('couponModalOverlay');
}

function editCoupon(id) {
    const c = coupons.find(x => x.id === id); if (!c) return;
    document.getElementById('couponModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Cupón';
    document.getElementById('editCouponId').value = c.id;
    document.getElementById('couponCode').value = c.code;
    document.getElementById('couponType').value = c.type;
    document.getElementById('couponValue').value = c.value;
    document.getElementById('couponMinPurchase').value = c.minPurchase || 0;
    document.getElementById('couponMaxUses').value = c.maxUses || 0;
    document.getElementById('couponStartDate').value = c.startDate || '';
    document.getElementById('couponEndDate').value = c.endDate || '';
    document.getElementById('couponAppliesTo').value = c.appliesTo || 'all';
    const toggle = document.getElementById('couponActiveToggle');
    if (c.active) toggle.classList.add('active'); else toggle.classList.remove('active');
    // Handle scope
    const hasProductIds = c.productIds && c.productIds.length > 0;
    if (hasProductIds) {
        document.getElementById('scopeProduct').checked = true;
        selectedCouponProducts = [...(c.productIds || [])];
    } else {
        document.getElementById('scopeCategory').checked = true;
        selectedCouponProducts = [];
    }
    toggleCouponScope();
    renderProductSelector();
    renderProductSelectorTags();
    openModal('couponModalOverlay');
}

function saveCoupon() {
    const editId = document.getElementById('editCouponId').value;
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseInt(document.getElementById('couponValue').value) || 0;
    const minPurchase = parseInt(document.getElementById('couponMinPurchase').value) || 0;
    const maxUses = parseInt(document.getElementById('couponMaxUses').value) || 0;
    const startDate = document.getElementById('couponStartDate').value;
    const endDate = document.getElementById('couponEndDate').value;
    const appliesTo = document.getElementById('couponAppliesTo').value;
    const active = document.getElementById('couponActiveToggle').classList.contains('active');
    const scopeType = document.querySelector('input[name="couponScope"]:checked').value;

    if (!code) { showToast('El código es obligatorio', 'error'); return; }
    if (value <= 0) { showToast('El valor debe ser mayor a 0', 'error'); return; }
    if (type === 'percentage' && value > 100) { showToast('El porcentaje no puede superar 100%', 'error'); return; }
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) { showToast('La fecha fin debe ser posterior a la inicio', 'error'); return; }

    const existing = coupons.find(c => c.code === code && c.id != (editId || 0));
    if (existing) { showToast('Ya existe un cupón con ese código', 'error'); return; }

    const productIds = scopeType === 'product' ? [...selectedCouponProducts] : [];

    if (editId) {
        const idx = coupons.findIndex(c => c.id == editId);
        if (idx >= 0) coupons[idx] = { ...coupons[idx], code, type, value, minPurchase, maxUses, usedCount: coupons[idx].usedCount || 0, totalSaved: coupons[idx].totalSaved || 0, startDate, endDate, appliesTo, productIds, active };
        showToast('Cupón actualizado', 'success');
    } else {
        coupons.push({ id: nextCouponId++, code, type, value, minPurchase, maxUses, usedCount: 0, totalSaved: 0, startDate, endDate, appliesTo, productIds, active });
        showToast('Cupón creado', 'success');
    }
    saveCoupons();
    closeModal('couponModalOverlay');
}

function deleteCoupon(id) {
    showConfirm('Eliminar cupón', '¿Eliminar este cupón permanentemente?', () => {
        coupons = coupons.filter(c => c.id !== id);
        saveCoupons();
        showToast('Cupón eliminado', 'success');
    });
}

function toggleCouponStatus(id) {
    const c = coupons.find(x => x.id === id);
    if (c) { c.active = !c.active; saveCoupons(); showToast(c.active ? 'Cupón activado' : 'Cupón desactivado', 'success'); }
}

function getFilteredCoupons() {
    let result = [...coupons];
    if (currentCouponFilter === 'active') result = result.filter(c => isCouponActive(c));
    else if (currentCouponFilter === 'expired') result = result.filter(c => isCouponExpired(c));
    else if (currentCouponFilter === 'percentage') result = result.filter(c => c.type === 'percentage');
    else if (currentCouponFilter === 'fixed') result = result.filter(c => c.type === 'fixed');
    const search = document.getElementById('couponSearchBox').value.toLowerCase().trim();
    if (search) result = result.filter(c => c.code.toLowerCase().includes(search));
    return result;
}

function renderCoupons() {
    const tbody = document.getElementById('couponsTableBody');
    const filtered = getFilteredCoupons();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:40px 20px;"><div class="empty-state-icon" style="width:60px;height:60px;font-size:24px;"><i class="fas fa-ticket-alt"></i></div><h3 style="font-size:16px;">Sin cupones</h3><p>Crea cupones para ofrecer descuentos</p><button class="btn btn-primary" onclick="openCouponModal()" style="margin-top:10px;"><i class="fas fa-plus"></i> Nuevo Cupón</button></div></td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(c => {
        const active = isCouponActive(c);
        const expired = isCouponExpired(c);
        const typeLabel = c.type === 'percentage' ? c.value + '%' : '$' + c.value.toLocaleString('es-CO');
        const usesText = c.maxUses > 0 ? `${c.usedCount}/${c.maxUses}` : `${c.usedCount} / ∞`;
        const vigencia = c.startDate && c.endDate ? `${c.startDate} → ${c.endDate}` : c.endDate ? `Hasta ${c.endDate}` : 'Sin vencimiento';
        const statusBadge = active ? '<span class="badge badge-green">Activo</span>' : expired ? '<span class="badge badge-red">Vencido</span>' : '<span class="badge badge-gray">Inactivo</span>';
        // Scope display
        let scopeInfo = '';
        if (c.productIds && c.productIds.length > 0) {
            const productNames = c.productIds.map(pid => {
                const p = products.find(prod => prod.id === pid);
                return p ? p.name : '#' + pid;
            }).slice(0, 2);
            const more = c.productIds.length > 2 ? ` +${c.productIds.length - 2}` : '';
            scopeInfo = `<div class="coupon-scope"><i class="fas fa-box"></i> ${productNames.join(', ')}${more}</div>`;
        } else {
            const scopeLabels = { all: 'Todos', guayo: 'Guayos', sintetica: 'Sintética', futsal: 'Futsal', nino: 'Niño' };
            scopeInfo = `<div class="coupon-scope"><i class="fas fa-layer-group"></i> ${scopeLabels[c.appliesTo] || c.appliesTo}</div>`;
        }
        return `<tr><td style="font-family:var(--font-mono);font-weight:800;color:var(--gold);font-size:14px;">${c.code}</td><td>${c.type === 'percentage' ? '<span class="badge badge-purple">%</span>' : '<span class="badge badge-blue">$</span>'}</td><td style="font-weight:900;">${typeLabel}</td><td style="color:var(--fog);">${c.minPurchase > 0 ? '$' + c.minPurchase.toLocaleString('es-CO') : 'Sin mínimo'}</td><td style="color:var(--fog);">${usesText}</td><td style="color:var(--fog);font-size:12px;">${vigencia}<br>${scopeInfo}</td><td>${statusBadge}</td><td><div class="action-btns"><button class="action-btn edit" onclick="editCoupon(${c.id})" title="Editar"><i class="fas fa-pen"></i></button><button class="action-btn ${active ? 'delete' : 'view'}" onclick="toggleCouponStatus(${c.id})" title="${active ? 'Desactivar' : 'Activar'}"><i class="fas fa-${active ? 'pause' : 'play'}"></i></button><button class="action-btn delete" onclick="deleteCoupon(${c.id})" title="Eliminar"><i class="fas fa-trash"></i></button></div></td></tr>`;
    }).join('');
}

function filterCoupons(filter, btn) {
    currentCouponFilter = filter;
    document.querySelectorAll('#view-coupons .tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderCoupons();
}

// ===== CUPÓN EN PEDIDO =====
function validateOrderCoupon() {
    const code = document.getElementById('orderCouponCode').value.trim().toUpperCase();
    const info = document.getElementById('orderCouponInfo');
    if (!code) { info.style.display = 'none'; currentOrderCoupon = null; updateOrderTotal(); return; }
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) { info.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> Cupón no encontrado</span>'; info.style.display = 'block'; currentOrderCoupon = null; updateOrderTotal(); return; }
    if (!isCouponActive(coupon)) { info.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> Cupón inactivo o vencido</span>'; info.style.display = 'block'; currentOrderCoupon = null; updateOrderTotal(); return; }
    // Check product-specific applicability
    if (coupon.productIds && coupon.productIds.length > 0) {
        const orderProductIds = orderItems.map(i => i.productId).filter(Boolean);
        const hasEligibleProduct = orderProductIds.some(pid => coupon.productIds.includes(pid));
        if (!hasEligibleProduct && orderProductIds.length > 0) {
            info.innerHTML = '<span style="color:var(--warning);"><i class="fas fa-exclamation-circle"></i> Cupón solo aplica a productos específicos</span>';
            info.style.display = 'block';
            currentOrderCoupon = null;
            updateOrderTotal();
            return;
        }
    }
    info.innerHTML = `<span style="color:var(--success);"><i class="fas fa-check-circle"></i> ${coupon.code} — ${coupon.type === 'percentage' ? coupon.value + '%' : '$' + coupon.value.toLocaleString('es-CO')} de descuento</span>`;
    info.style.display = 'block';
}

function applyOrderCoupon() {
    const code = document.getElementById('orderCouponCode').value.trim().toUpperCase();
    if (!code) { showToast('Ingresa un código de cupón', 'warning'); return; }
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) { showToast('Cupón no encontrado', 'error'); return; }
    if (!isCouponActive(coupon)) { showToast('Cupón inactivo o vencido', 'error'); return; }
    // Check product-specific applicability
    if (coupon.productIds && coupon.productIds.length > 0) {
        const orderProductIds = orderItems.map(i => i.productId).filter(Boolean);
        const hasEligibleProduct = orderProductIds.some(pid => coupon.productIds.includes(pid));
        if (!hasEligibleProduct && orderProductIds.length > 0) {
            showToast('Este cupón solo aplica a productos específicos', 'warning');
            return;
        }
    }
    currentOrderCoupon = coupon;
    updateOrderTotal();
    showToast(`Cupón ${coupon.code} aplicado`, 'success');
}

function updateOrderTotal() {
    let subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
    let eligibleSubtotal = subtotal;
    let discount = 0;
    let discountLabel = '';

    if (currentOrderCoupon && subtotal >= (currentOrderCoupon.minPurchase || 0)) {
        // If product-specific, calculate discount only on eligible products
        if (currentOrderCoupon.productIds && currentOrderCoupon.productIds.length > 0) {
            eligibleSubtotal = orderItems
                .filter(i => currentOrderCoupon.productIds.includes(i.productId))
                .reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
        }

        if (currentOrderCoupon.type === 'percentage') {
            discount = Math.round(eligibleSubtotal * currentOrderCoupon.value / 100);
            discountLabel = `${currentOrderCoupon.value}%`;
        } else {
            discount = currentOrderCoupon.value;
            discountLabel = `$${currentOrderCoupon.value.toLocaleString('es-CO')}`;
        }
        if (discount > eligibleSubtotal) discount = eligibleSubtotal;
        if (discount > subtotal) discount = subtotal;

        if (discount > 0) {
            document.getElementById('orderDiscountRow').style.display = 'flex';
            document.getElementById('orderDiscountLabel').textContent = `(${currentOrderCoupon.code} ${discountLabel})`;
            document.getElementById('orderDiscountDisplay').textContent = '-$' + discount.toLocaleString('es-CO');
        } else {
            document.getElementById('orderDiscountRow').style.display = 'none';
        }
    } else {
        document.getElementById('orderDiscountRow').style.display = 'none';
    }
    const total = subtotal - discount;
    document.getElementById('orderSubtotalDisplay').textContent = '$' + subtotal.toLocaleString('es-CO');
    document.getElementById('orderTotalDisplay').textContent = '$' + total.toLocaleString('es-CO');
}

// updateOrderTotal ahora delega a updateOrderTotal
// ===== PRODUCT SELECTOR FOR COUPONS =====
function toggleCouponScope() {
    const scopeType = document.querySelector('input[name="couponScope"]:checked').value;
    const catGroup = document.getElementById('categoryScopeGroup');
    const prodGroup = document.getElementById('productScopeGroup');
    if (scopeType === 'product') {
        catGroup.style.display = 'none';
        prodGroup.style.display = 'block';
    } else {
        catGroup.style.display = 'block';
        prodGroup.style.display = 'none';
    }
}

function toggleProductSelector() {
    const selector = document.getElementById('productSelector');
    selector.classList.toggle('open');
    if (selector.classList.contains('open')) {
        document.getElementById('productSelectorSearch').value = '';
        filterProductSelector();
        document.getElementById('productSelectorSearch').focus();
    }
}

function renderProductSelector() {
    const list = document.getElementById('productSelectorList');
    const searchTerm = (document.getElementById('productSelectorSearch')?.value || '').toLowerCase().trim();
    let filtered = [...products];
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.code.toLowerCase().includes(searchTerm));
    }
    if (filtered.length === 0) {
        list.innerHTML = '<div class="product-selector-empty"><i class="fas fa-search" style="margin-right:6px;"></i>No se encontraron productos</div>';
        return;
    }
    list.innerHTML = filtered.map(p => {
        const isSelected = selectedCouponProducts.includes(p.id);
        return `<div class="product-selector-item ${isSelected ? 'selected' : ''}" onclick="toggleProductSelection(${p.id})">
            <img src="${p.image || ''}" onerror="this.style.display='none'" alt="">
            <div class="product-selector-item-info">
                <div class="product-selector-item-name">${p.name}</div>
                <div class="product-selector-item-code">${p.code} · $${p.price.toLocaleString('es-CO')}</div>
            </div>
            <div class="product-selector-item-check"><i class="fas fa-check"></i></div>
        </div>`;
    }).join('');
}

function filterProductSelector() {
    renderProductSelector();
}

function toggleProductSelection(productId) {
    const idx = selectedCouponProducts.indexOf(productId);
    if (idx >= 0) {
        selectedCouponProducts.splice(idx, 1);
    } else {
        selectedCouponProducts.push(productId);
    }
    renderProductSelector();
    renderProductSelectorTags();
}

function renderProductSelectorTags() {
    const container = document.getElementById('productSelectorTags');
    if (selectedCouponProducts.length === 0) {
        container.innerHTML = '';
        document.getElementById('productSelectorLabel').textContent = 'Seleccionar productos...';
        return;
    }
    document.getElementById('productSelectorLabel').textContent = `${selectedCouponProducts.length} producto(s) seleccionado(s)`;
    container.innerHTML = selectedCouponProducts.map(pid => {
        const p = products.find(prod => prod.id === pid);
        if (!p) return '';
        return `<span class="product-selector-tag">${p.name}<button onclick="event.stopPropagation(); toggleProductSelection(${p.id});" title="Quitar"><i class="fas fa-times"></i></button></span>`;
    }).join('');
}

// Close product selector when clicking outside
document.addEventListener('click', function(e) {
    const selector = document.getElementById('productSelector');
    if (selector && !selector.contains(e.target)) {
        selector.classList.remove('open');
    }
});

// ===== MODALS =====
function openModal(id) {
    const overlay = document.getElementById(id);
    overlay.classList.add('active');
    lockScroll();
}
function closeModal(id) {
    const overlay = document.getElementById(id);
    overlay.classList.remove('active');
    unlockScroll();
}
function closeProductModal() { closeModal('productModalOverlay'); }
function closeImportModal() { closeModal('importModalOverlay'); }
function showImportModal() { document.getElementById('importText').value = ''; openModal('importModalOverlay'); }
function showConfirm(title, message, callback) { document.getElementById('confirmTitle').textContent = title; document.getElementById('confirmMessage').textContent = message; confirmCallback = callback; document.getElementById('confirmBtn').onclick = function() { closeModal('confirmModalOverlay'); if (confirmCallback) confirmCallback(); }; openModal('confirmModalOverlay'); }
function closeConfirmModal() { closeModal('confirmModalOverlay'); confirmCallback = null; }

// ===== EXPORT/IMPORT =====
function exportJSON() { const data = JSON.stringify(products, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'khaos-productos.json'; a.click(); URL.revokeObjectURL(url); showToast('JSON exportado', 'success'); }
function exportCSV() { const headers = ['ID','Nombre','Código','Categoría','Precio','Precio Anterior','Tallas','Agotadas','Badge','Descripción','Imagen']; const rows = products.map(p => [p.id, '"' + p.name + '"', p.code, p.category, p.price, p.oldPrice || '', (p.sizes || []).join(';'), (p.outOfStock || []).join(';'), p.badge || '', '"' + (p.desc || '').replace(/"/g, '""') + '"', p.image || '']); const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'khaos-productos.csv'; a.click(); URL.revokeObjectURL(url); showToast('CSV exportado', 'success'); }
function doImport() { const text = document.getElementById('importText').value.trim(); if (!text) { showToast('Pega los datos primero', 'warning'); return; } try { const parsed = JSON.parse(text); if (!Array.isArray(parsed)) throw new Error('No es array'); if (parsed.length > 0 && (!parsed[0].id || !parsed[0].name)) throw new Error('Formato inválido'); products = parsed; nextId = Math.max(...products.map(p => p.id), 0) + 1; saveProducts(); renderCategoryChips(); closeModal('importModalOverlay'); showToast(`Importados ${products.length} productos`, 'success'); } catch(e) { showToast('Error: formato inválido', 'error'); } }
function confirmReset() { showConfirm('Eliminar todos los productos', '¿Eliminar todos los productos? No se puede deshacer.', () => { products = []; nextId = 1; selectedIds.clear(); saveProducts(); renderCategoryChips(); showToast('Todos los productos eliminados', 'success'); }); }

// ===== SIDEBAR =====
function toggleSidebar(save = true) { const sidebar = document.getElementById('sidebar'); const main = document.getElementById('mainContent'); const icon = document.getElementById('sidebarToggleIcon'); const isCollapsed = sidebar.classList.toggle('collapsed'); main.classList.toggle('expanded'); icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'; if (save) { try { localStorage.setItem('khaos_sidebar_collapsed', isCollapsed); } catch(e) {} } }

// ===== AUTO-HIDE SIDEBAR =====
let lastScrollY = 0;
let scrollTimeout = null;
function initAutoHideSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || window.innerWidth <= 1024) return; // Solo en desktop

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = currentScrollY;

        // No ocultar si está colapsado o si el mouse está sobre el sidebar
        if (sidebar.classList.contains('collapsed')) return;
        if (sidebar.matches(':hover')) return;

        clearTimeout(scrollTimeout);

        if (scrollDirection === 'down' && currentScrollY > 100) {
            // Scrolleando hacia abajo: ocultar después de 500ms
            scrollTimeout = setTimeout(() => {
                sidebar.classList.add('auto-hide');
            }, 500);
        } else {
            // Scrolleando hacia arriba: mostrar inmediatamente
            sidebar.classList.remove('auto-hide');
        }
    }, { passive: true });

    // Mostrar sidebar cuando el mouse se acerca al borde izquierdo
    document.addEventListener('mousemove', function(e) {
        if (e.clientX < 20 && sidebar.classList.contains('auto-hide')) {
            sidebar.classList.remove('auto-hide');
        }
    });
}

// ===== ORIENTATION TOGGLE =====
let orientationForced = false;
function toggleOrientation() {
    orientationForced = !orientationForced;
    document.body.classList.toggle('orientation-forced', orientationForced);

    const icon = document.getElementById('orientationIcon');
    if (icon) {
        icon.className = orientationForced ? 'fas fa-mobile-alt fa-rotate-90' : 'fas fa-mobile-alt';
    }

    // Actualizar también el menú "más opciones"
    const moreIcon = document.getElementById('moreOrientationIcon');
    const moreLabel = document.getElementById('moreOrientationLabel');
    if (moreIcon) moreIcon.className = orientationForced ? 'fas fa-mobile-alt fa-rotate-90' : 'fas fa-mobile-alt';
    if (moreLabel) moreLabel.textContent = orientationForced ? 'Modo vertical' : 'Modo horizontal';

    // Guardar preferencia
    try {
        localStorage.setItem('khaos_orientation_forced', orientationForced);
    } catch(e) {}

    showToast(orientationForced ? 'Modo horizontal activado' : 'Modo vertical activado', 'info');

    // Re-renderizar charts si existen
    setTimeout(() => {
        Object.values(charts).forEach(c => { if (c && c.resize) c.resize(); });
    }, 300);
}

function loadOrientation() {
    try {
        const saved = localStorage.getItem('khaos_orientation_forced');
        if (saved === 'true') {
            orientationForced = true;
            document.body.classList.add('orientation-forced');
            const icon = document.getElementById('orientationIcon');
            if (icon) icon.className = 'fas fa-mobile-alt fa-rotate-90';
            const moreIcon = document.getElementById('moreOrientationIcon');
            const moreLabel = document.getElementById('moreOrientationLabel');
            if (moreIcon) moreIcon.className = 'fas fa-mobile-alt fa-rotate-90';
            if (moreLabel) moreLabel.textContent = 'Modo vertical';
        }
    } catch(e) {}
}
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const isOpen = sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
    if (isOpen) {
        lockScroll();
    } else {
        unlockScroll();
    }
}

// ===== VIEW SWITCHING =====
function switchView(view, el) {
    ['dashboard','products','categories','orders','coupons','inventory','analytics','settings'].forEach(v => { document.getElementById('view-' + v).style.display = 'none'; });
    document.getElementById('view-' + view).style.display = 'block';
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
    else { const link = document.querySelector(`.sidebar-nav a[onclick*="'${view}'"]`); if (link) link.classList.add('active'); }
    const titles = { dashboard: 'Dashboard', products: 'Productos', categories: 'Categorías', orders: 'Pedidos', coupons: 'Cupones', inventory: 'Inventario', analytics: 'Analíticas', settings: 'Ajustes' };
    document.getElementById('pageTitle').textContent = titles[view] || view;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarBackdrop').classList.remove('active');
    unlockScroll();
    if (view === 'analytics') setTimeout(updateCharts, 100);
    if (view === 'inventory') renderInventory();
    if (view === 'orders') renderOrders();
    if (view === 'categories') renderCategoriesView();
    if (view === 'products') { renderTable(); renderCategoryChips(); renderSidebarCategories(); }
}

// ===== DROPDOWN =====
function toggleDropdown(id) { document.querySelectorAll('.dropdown').forEach(d => { if (d.id !== id) d.classList.remove('open'); }); document.getElementById(id).classList.toggle('open'); }

// ===== SPOTLIGHT SEARCH =====
function openSpotlight() {
    document.getElementById('spotlightOverlay').classList.add('active');
    document.getElementById('spotlightInput').value = '';
    lockScroll();
    searchSpotlight();
    // Delay focus to allow overlay to render and keyboard to adjust viewport
    setTimeout(function() {
        var input = document.getElementById('spotlightInput');
        if (input) input.focus();
    }, 100);
}
function closeSpotlight(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('spotlightOverlay').classList.remove('active');
    unlockScroll();
}
function searchSpotlight() {
    const q = document.getElementById('spotlightInput').value.toLowerCase().trim();
    const results = document.getElementById('spotlightResults');
    if (!q) {
        results.innerHTML = `<div class="spotlight-group"><div class="spotlight-group-title">Navegación</div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('dashboard')"><i class="fas fa-chart-pie"></i><span>Dashboard</span><span class="shortcut">Ctrl+1</span></div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('products')"><i class="fas fa-box"></i><span>Productos</span><span class="shortcut">Ctrl+2</span></div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('orders')"><i class="fas fa-shopping-bag"></i><span>Pedidos</span><span class="shortcut">Ctrl+3</span></div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('analytics')"><i class="fas fa-chart-line"></i><span>Analíticas</span><span class="shortcut">Ctrl+4</span></div>
        </div>`;
        return;
    }
    const matchedProducts = products.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)).slice(0, 5);
    let html = '';
    if (matchedProducts.length > 0) {
        html += `<div class="spotlight-group"><div class="spotlight-group-title">Productos</div>`;
        matchedProducts.forEach(p => { html += `<div class="spotlight-item" onclick="closeSpotlight();switchView('products');editProduct(${p.id})"><i class="fas fa-box" style="color:${categoryColors[p.category]||'#888'}"></i><span>${p.name}</span><span class="shortcut">$${p.price.toLocaleString()}</span></div>`; });
        html += `</div>`;
    }
    const matchedOrders = orders.filter(o => o.customer.toLowerCase().includes(q) || String(o.id).includes(q)).slice(0, 3);
    if (matchedOrders.length > 0) {
        html += `<div class="spotlight-group"><div class="spotlight-group-title">Pedidos</div>`;
        matchedOrders.forEach(o => { html += `<div class="spotlight-item" onclick="closeSpotlight();switchView('orders')"><i class="fas fa-shopping-bag"></i><span>Pedido #${String(o.id).padStart(4,'0')} — ${o.customer}</span><span class="shortcut">$${o.total.toLocaleString()}</span></div>`; });
        html += `</div>`;
    }
    if (matchedProducts.length === 0 && matchedOrders.length === 0) html = `<div class="spotlight-group"><div class="spotlight-item" style="color:var(--fog);cursor:default;"><i class="fas fa-search"></i><span>No se encontraron resultados</span></div></div>`;
    results.innerHTML = html;
}
function navigateSpotlight(e) { if (e.key === 'Escape') closeSpotlight(); }

// ===== NOTIFICATIONS =====
function addNotification(type, message) {
    const notif = { id: Date.now(), type, message, time: new Date().toISOString(), read: false };
    notifications.unshift(notif);
    if (notifications.length > 20) notifications.pop();
    updateNotificationPanel();
    updateNotificationDot();
    showToast(message, type === 'order' ? 'success' : 'info');
}
function updateNotificationPanel() {
    const list = document.getElementById('notifList');
    if (notifications.length === 0) { list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--fog);font-size:13px;">Sin notificaciones</div>'; return; }
    list.innerHTML = notifications.map(n => {
        const time = new Date(n.time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const iconClass = n.type === 'order' ? 'order' : n.type === 'stock' ? 'stock' : 'system';
        const icon = n.type === 'order' ? 'fa-shopping-bag' : n.type === 'stock' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead(${n.id})"><div class="notif-item-icon ${iconClass}"><i class="fas ${icon}"></i></div><div class="notif-item-content"><p>${n.message}</p><span>${time}</span></div></div>`;
    }).join('');
}
function markRead(id) { const n = notifications.find(x => x.id === id); if (n) n.read = true; updateNotificationPanel(); updateNotificationDot(); }
function clearAllNotifications() { notifications.forEach(n => n.read = true); updateNotificationPanel(); updateNotificationDot(); }
function updateNotificationDot() { const dot = document.getElementById('notifDot'); const unread = notifications.filter(n => !n.read).length; dot.style.display = unread > 0 ? 'block' : 'none'; }
function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    const isActive = panel.classList.toggle('active');
    if (isActive) {
        lockScroll();
    } else {
        unlockScroll();
    }
}

// ===== REAL-TIME SIMULATION =====
let _simulationInterval = null;
function startRealtimeSimulation() {
    if (_simulationInterval) clearInterval(_simulationInterval);
    _simulationInterval = setInterval(() => {
        if (Math.random() > 0.7) {
            const types = ['stock', 'system'];
            const type = types[Math.floor(Math.random() * types.length)];
            const messages = {
                stock: ['Stock bajo detectado', 'Inventario actualizado'],
                system: ['Backup completado', 'Sincronización exitosa']
            };
            addNotification(type, messages[type][Math.floor(Math.random() * messages[type].length)]);
        }
    }, 60000);
}
window.addEventListener('beforeunload', () => {
    if (_simulationInterval) clearInterval(_simulationInterval);
});

// ===== TOAST =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation', info: 'fa-info' };
    toast.innerHTML = `<div class="toast-icon"><i class="fas ${icons[type] || icons.success}"></i></div><span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// ===== EVENT LISTENERS =====
let _hasUnsavedChanges = false;
function markUnsaved() { _hasUnsavedChanges = true; }
function clearUnsaved() { _hasUnsavedChanges = false; }

// Global scroll lock for overlays
let _scrollLockActive = false;
let _scrollPosition = 0;
let _touchMoveHandler = null;

function lockScroll() {
    if (_scrollLockActive) return;
    _scrollLockActive = true;
    _scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Prevent touch scrolling on body but allow on scrollable children
    _touchMoveHandler = function(e) {
        var target = e.target;
        var scrollable = false;
        // Check if the target or any parent is scrollable
        while (target && target !== document.body) {
            var style = window.getComputedStyle(target);
            if (style.overflow === 'auto' || style.overflow === 'scroll' || 
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
                // Check if there's actual scrollable content
                if (target.scrollHeight > target.clientHeight) {
                    scrollable = true;
                    break;
                }
            }
            target = target.parentElement;
        }
        if (!scrollable) {
            e.preventDefault();
        }
    };
    document.addEventListener('touchmove', _touchMoveHandler, { passive: false });
    document.addEventListener('wheel', _touchMoveHandler, { passive: false });
}

function unlockScroll() {
    if (!_scrollLockActive) return;
    _scrollLockActive = false;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    if (_touchMoveHandler) {
        document.removeEventListener('touchmove', _touchMoveHandler, { passive: false });
        document.removeEventListener('wheel', _touchMoveHandler, { passive: false });
        _touchMoveHandler = null;
    }
    window.scrollTo(0, _scrollPosition);
}

function initEventListeners() {
    window.addEventListener('beforeunload', function(e) {
        if (_hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    document.addEventListener('click', function(e) { 
    if (!e.target.closest('.dropdown')) document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open')); 
    if (!e.target.closest('.notif-panel') && !e.target.closest('[title="Notificaciones"]')) {
        var notifPanel = document.getElementById('notifPanel');
        if (notifPanel.classList.contains('active')) {
            notifPanel.classList.remove('active');
            unlockScroll();
        }
    }
    if (!e.target.closest('.cat-filter-wrap')) {
        const wrap = document.getElementById('catFilterWrap');
        if (wrap) {
            wrap.classList.remove('open');
            const chevron = document.getElementById('catFilterChevron');
            if (chevron) chevron.style.transform = '';
        }
    }
});
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); document.body.style.overflow = ''; closeSpotlight(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSpotlight(); }
        if (e.ctrlKey && e.key === '1') { e.preventDefault(); switchView('dashboard'); }
        if (e.ctrlKey && e.key === '2') { e.preventDefault(); switchView('products'); }
        if (e.ctrlKey && e.key === '3') { e.preventDefault(); switchView('orders'); }
        if (e.ctrlKey && e.key === '4') { e.preventDefault(); switchView('analytics'); }
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click', function(e) { if (e.target === this) { this.classList.remove('active'); document.body.style.overflow = ''; } }); });


// ===== STORAGE LISTENER: Pedidos desde catálogo =====
function initStorageListener() {
    window.addEventListener('storage', function(e) {
        if (e.key === 'khaos_admin_orders') {
            try {
                const newOrders = JSON.parse(e.newValue || '[]');
                const oldOrders = JSON.parse(e.oldValue || '[]');

                // Detectar pedidos nuevos
                if (newOrders.length > oldOrders.length) {
                    const newOrder = newOrders[0];
                    if (newOrder && newOrder.source === 'web') {
                        // Notificación toast
                        showToast(
                            '🔔 Nuevo pedido web: ' + (newOrder.customer || 'Cliente') + 
                            ' — $' + (newOrder.total || 0).toLocaleString('es-CO'),
                            'success'
                        );

                        // Notificación en panel
                        addNotification('order', 
                            'Nuevo pedido #' + String(newOrder.id).slice(-4) + 
                            ' desde catálogo — $' + (newOrder.total || 0).toLocaleString('es-CO')
                        );

                        // Actualizar datos locales
                        orders = newOrders;
                        nextOrderId = Math.max(...orders.map(o => o.id), 0) + 1;

                        // Actualizar UI si estamos en la vista de pedidos
                        renderOrders();
                        updateOrderStats();

                        // Actualizar dashboard
                        updateDashboard();

                        // Mostrar badge en sidebar
                        const badge = document.getElementById('sidebarOrderCount');
                        if (badge) {
                            const pending = orders.filter(o => o.status === 'pending').length;
                            badge.textContent = pending;
                            badge.style.display = pending > 0 ? 'flex' : 'none';
                        }
                    }
                }
            } catch(err) {
                console.error('Error procesando pedido nuevo:', err);
            }
        }

        // También escuchar cambios en productos del catálogo
        if (e.key === 'khaos_admin_products') {
            try {
                const parsed = JSON.parse(e.newValue);
                if (Array.isArray(parsed)) {
                    products = parsed;
                    nextId = Math.max(...products.map(p => p.id), 0) + 1;
                    saveProducts();
                    renderTable();
                    updateAllStats();
                    updateDashboard();
                    renderCategoriesView();
                    renderInventory();
                    updateCharts();
                    showToast('Catálogo actualizado desde tienda', 'info');
                }
            } catch(err) {}
        }
    });
}
}

// ===== START =====


/* ===== GITHUB SYNC MODULE ===== */
const GITHUB_CONFIG = {
    owner: 'khaosdeportivo',
    repo: 'khaosdeportivo',
    branch: 'main',
    path: 'productos.json',
    apiBase: 'https://api.github.com'
};

function getGithubToken() {
    try { return localStorage.getItem('khaos_github_token') || ''; } catch(e) { return ''; }
}

function saveGithubToken() {
    const token = document.getElementById('settingGithubToken').value.trim();
    if (!token) { showToast('Ingresa un token válido', 'warning'); return; }
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        showToast('El token debe empezar con ghp_ o github_pat_', 'error'); return;
    }
    try { localStorage.setItem('khaos_github_token', token); } catch(e) {}
    document.getElementById('settingGithubToken').value = '';
    updateGithubUI();
    showToast('Token guardado correctamente', 'success');
}

function updateGithubUI() {
    const token = getGithubToken();
    const btn = document.getElementById('githubSyncBtn');
    const status = document.getElementById('githubSyncStatus');

    if (token) {
        btn.disabled = false;
        status.innerHTML = '<span style="color:var(--success);"><i class="fas fa-check-circle"></i> Configurado</span>';
    } else {
        btn.disabled = true;
        status.textContent = 'No configurado — ingresa tu token en Ajustes';
    }

    // Cargar última sync
    try {
        const last = localStorage.getItem('khaos_last_sync');
        if (last) document.getElementById('githubLastSync').textContent = new Date(last).toLocaleString('es-CO');
    } catch(e) {}
}

async function testGithubConnection() {
    const token = getGithubToken();
    if (!token) { showToast('Primero guarda tu token en Ajustes', 'warning'); return; }

    showLoading('Probando conexión...');
    try {
        const res = await fetch(`${GITHUB_CONFIG.apiBase}/user`, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
            const user = await res.json();
            showToast(`✅ Conectado como ${user.login}`, 'success');
        } else {
            const err = await res.json();
            showToast(`❌ Error: ${err.message || 'Token inválido'}`, 'error');
        }
    } catch(e) {
        showToast('Error de red al conectar con GitHub', 'error');
    } finally {
        hideLoading();
    }
}

async function syncToGithub() {
    const token = getGithubToken();
    if (!token) { showToast('Token no configurado', 'error'); return; }
    if (products.length === 0) { showToast('No hay productos para sincronizar', 'warning'); return; }

    showLoading('Sincronizando con GitHub...');

    try {
        // 1. Obtener SHA del archivo actual (si existe)
        let sha = null;
        try {
            const getRes = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=${GITHUB_CONFIG.branch}`,
                { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
            );
            if (getRes.ok) {
                const data = await getRes.json();
                sha = data.sha;
            }
        } catch(e) {}

        // 2. Preparar contenido
        const content = {
            productos: products,
            cupones: coupons,
            fechaActualizacion: new Date().toISOString(),
            version: 1
        };
        const base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

        // 3. Subir archivo
        const body = {
            message: `Actualización catálogo — ${new Date().toLocaleString('es-CO')}`,
            content: base64Content,
            branch: GITHUB_CONFIG.branch
        };
        if (sha) body.sha = sha;

        const putRes = await fetch(
            `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );

        if (putRes.ok || putRes.status === 201) {
            const now = new Date().toISOString();
            try { localStorage.setItem('khaos_last_sync', now); } catch(e) {}
            document.getElementById('githubLastSync').textContent = new Date(now).toLocaleString('es-CO');
            showToast('✅ Catálogo sincronizado con GitHub', 'success');
            addNotification('system', 'Catálogo sincronizado exitosamente');
        } else {
            const err = await putRes.json();
            showToast(`❌ Error GitHub: ${err.message || 'Desconocido'}`, 'error');
        }
    } catch(e) {
        showToast('Error al sincronizar: ' + e.message, 'error');
    } finally {
        hideLoading();
    }
}

// Auto-sincronizar al guardar productos (opcional, desactivado por defecto)
let autoSyncEnabled = false;
function toggleAutoSync() {
    autoSyncEnabled = !autoSyncEnabled;
    showToast(autoSyncEnabled ? 'Auto-sync activado' : 'Auto-sync desactivado', 'info');
}

document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    if (!checkAuth()) return;
    init();
});
