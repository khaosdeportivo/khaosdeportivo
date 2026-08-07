/**
 * khaos-admin-core.js — Persistencia + tabla segura del admin
 */
(function () {
  'use strict';

  var syncLock = false;
  var syncQueued = false;

  function getToken() {
    try { return localStorage.getItem('khaos_github_token') || ''; } catch (e) { return ''; }
  }

  function getRev() {
    try { return localStorage.getItem('khaos_local_revision') || '0'; } catch (e) { return '0'; }
  }

  function currentProducts() {
    // Preferir la lista con datos (window suele ser la fuente fiable)
    if (Array.isArray(window.products) && window.products.length) return window.products;
    try {
      if (typeof products !== 'undefined' && Array.isArray(products) && products.length) {
        window.products = products;
        return products;
      }
    } catch (e) {}
    if (Array.isArray(window.products)) return window.products;
    try {
      if (typeof products !== 'undefined' && Array.isArray(products)) return products;
    } catch (e) {}
    return [];
  }

  function currentCoupons() {
    try {
      if (typeof coupons !== 'undefined' && Array.isArray(coupons) && coupons.length) {
        window.coupons = coupons;
        return coupons;
      }
    } catch (e) {}
    if (Array.isArray(window.coupons)) return window.coupons;
    return [];
  }

  function normalizeProduct(p) {
    if (!p || typeof p !== 'object') return null;
    if (!Array.isArray(p.sizes)) p.sizes = [];
    if (!Array.isArray(p.outOfStock)) p.outOfStock = [];
    p.price = Number(p.price);
    if (isNaN(p.price)) p.price = 0;
    if (p.oldPrice != null && p.oldPrice !== '') {
      p.oldPrice = Number(p.oldPrice);
      if (isNaN(p.oldPrice) || p.oldPrice <= 0) p.oldPrice = null;
    } else {
      p.oldPrice = null;
    }
    if (typeof p.name !== 'string') p.name = String(p.name || '');
    if (typeof p.code !== 'string') p.code = String(p.code || '');
    if (typeof p.category !== 'string') p.category = '';
    if (typeof p.image !== 'string') p.image = '';
    return p;
  }

  function applyList(list) {
    list = (Array.isArray(list) ? list : []).map(normalizeProduct).filter(Boolean);
    window.products = list;
    try { products = list; } catch (e) {}
    try {
      var maxId = 0;
      for (var i = 0; i < list.length; i++) {
        var idn = Number(list[i].id) || 0;
        if (idn > maxId) maxId = idn;
      }
      nextId = maxId + 1;
      window.nextId = nextId;
    } catch (e) {
      window.nextId = list.length + 1;
    }
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(list));
    } catch (e) {}
    return list.length;
  }

  function refreshAfterLoad() {
    try { if (typeof window.renderTable === 'function') window.renderTable(); } catch (e) {}
    try { if (typeof updateAllStats === 'function') updateAllStats(); } catch (e) {}
    try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
    try { if (typeof renderInventory === 'function') renderInventory(); } catch (e) {}
    try { if (typeof renderCategoriesView === 'function') renderCategoriesView(); } catch (e) {}
    try { if (typeof renderSidebarCategories === 'function') renderSidebarCategories(); } catch (e) {}
  }

  function markDirty() {
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(currentProducts()));
      localStorage.setItem('khaos_local_revision', String(Date.now()));
      localStorage.setItem('khaos_pending_sync', '1');
    } catch (e) {}
  }

  window.renderTable = function renderTable() {
    var tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    var list = currentProducts();
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>No hay productos</h3><p>Los productos se estan cargando...</p></div></td></tr>';
      return;
    }

    var filtered;
    try {
      filtered = typeof getFilteredProducts === 'function' ? getFilteredProducts() : list.slice();
    } catch (e) {
      console.warn('[Khaos] getFilteredProducts', e);
      filtered = list.slice();
    }

    var total = filtered.length;
    var perPage = typeof itemsPerPage !== 'undefined' ? itemsPerPage : 20;
    var page = typeof currentPage !== 'undefined' ? currentPage : 1;
    var totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;
    var start = (page - 1) * perPage;
    var end = start + perPage;
    var pageItems = filtered.slice(start, end);

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"');
    }

    tbody.innerHTML = pageItems.map(function (p) {
      var sizes = Array.isArray(p.sizes) ? p.sizes : [];
      var oos = Array.isArray(p.outOfStock) ? p.outOfStock : [];
      var available = sizes.filter(function (s) { return oos.indexOf(s) < 0; });
      var img = p.image
        ? '<img src="' + esc(p.image) + '" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;" onerror="this.style.display=\'none\'">'
        : '<div style="width:40px;height:40px;border-radius:8px;background:var(--stone);"></div>';
      return (
        '<tr>' +
        '<td>' + img + '</td>' +
        '<td><strong>' + esc(p.name) + '</strong><div style="font-size:11px;color:var(--fog);">' + esc(p.code) + '</div></td>' +
        '<td>' + esc(p.category) + '</td>' +
        '<td>$' + Number(p.price || 0).toLocaleString('es-CO') + '</td>' +
        '<td style="font-size:12px;">' + available.join(', ') + '</td>' +
        '<td style="font-size:12px;color:#ef4444;">' + (oos.length ? oos.join(', ') : '—') + '</td>' +
        '<td>' +
        '<button type="button" class="btn btn-secondary" style="font-size:12px;padding:4px 8px;" onclick="editProduct(' + p.id + ')">Editar</button> ' +
        '<button type="button" class="btn btn-secondary" style="font-size:12px;padding:4px 8px;color:#ef4444;" onclick="deleteProduct(' + p.id + ')">Borrar</button>' +
        '</td>' +
        '</tr>'
      );
    }).join('');

    try {
      var info = document.getElementById('productsPageInfo');
      if (info) info.textContent = total ? (start + 1) + '–' + Math.min(end, total) + ' de ' + total : '0';
    } catch (e) {}
  };

  window.saveProducts = function saveProducts() {
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(currentProducts()));
    } catch (e) {}
    try { if (typeof updateAllStats === 'function') updateAllStats(); } catch (e) {}
    try { window.renderTable(); } catch (e) {}
    try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
    try { if (typeof renderCategoriesView === 'function') renderCategoriesView(); } catch (e) {}
    try { if (typeof renderInventory === 'function') renderInventory(); } catch (e) {}
  };

  window.loadProducts = async function loadProducts() {
    try {
      if (localStorage.getItem('khaos_pending_sync') === '1') {
        var saved = localStorage.getItem('khaos_admin_products');
        if (saved) {
          var parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= 10) {
            var n = applyList(parsed);
            console.log('[Khaos] load: local pendiente', n);
            refreshAfterLoad();
            setTimeout(function () { window.syncToGithub().catch(function () {}); }, 600);
            return;
          }
        }
      }
    } catch (e) {}

    try {
      var res = await fetch(
        'https://raw.githubusercontent.com/khaosdeportivo/khaosdeportivo/main/productos.json?t=' + Date.now(),
        { cache: 'no-store' }
      );
      if (res.ok) {
        var data = await res.json();
        var list = Array.isArray(data) ? data : (data.productos || []);
        if (list.length) {
          var n2 = applyList(list);
          if (data.cupones && Array.isArray(data.cupones)) {
            try { coupons = data.cupones; } catch (e) {
              try { window.coupons = data.cupones; } catch (e2) {}
            }
            window.coupons = data.cupones;
          }
          try { localStorage.setItem('khaos_pending_sync', '0'); } catch (e) {}
          console.log('[Khaos] load: github', n2);
          refreshAfterLoad();
          return;
        }
      }
    } catch (e) {
      console.warn('[Khaos] github load fail', e);
    }

    try {
      var s2 = localStorage.getItem('khaos_admin_products');
      if (s2) {
        var p2 = JSON.parse(s2);
        if (Array.isArray(p2) && p2.length) {
          console.log('[Khaos] load: localStorage', applyList(p2));
          refreshAfterLoad();
          return;
        }
      }
    } catch (e) {}

    applyList([]);
    refreshAfterLoad();
  };

  window.syncToGithub = async function syncToGithub() {
    var token = getToken();
    if (!token) {
      if (typeof showToast === 'function') showToast('Token no configurado. Ve a Ajustes.', 'error');
      return;
    }
    if (syncLock) { syncQueued = true; return; }
    syncLock = true;
    syncQueued = false;
    if (typeof showLoading === 'function') showLoading('Sincronizando con GitHub...');
    var startedRev = getRev();
    var cfg = window.GITHUB_CONFIG || {
      owner: 'khaosdeportivo',
      repo: 'khaosdeportivo',
      branch: 'main',
      path: 'productos.json',
      apiBase: 'https://api.github.com'
    };
    try {
      var list = currentProducts();
      var cups = currentCoupons();
      var sha = null;
      try {
        var getRes = await fetch(
          cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path + '?ref=' + cfg.branch,
          { headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' } }
        );
        if (getRes.ok) {
          var meta = await getRes.json();
          sha = meta.sha;
        }
      } catch (e) {}

      var content = {
        productos: list,
        cupones: cups,
        fechaActualizacion: new Date().toISOString(),
        version: 1
      };
      var base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
      var body = {
        message: 'Actualización catálogo — ' + new Date().toLocaleString('es-CO'),
        content: base64Content,
        branch: cfg.branch
      };
      if (sha) body.sha = sha;

      var putRes = await fetch(
        cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path,
        {
          method: 'PUT',
          headers: {
            Authorization: 'token ' + token,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (putRes.ok || putRes.status === 201) {
        try {
          localStorage.setItem('khaos_last_sync', new Date().toISOString());
          localStorage.setItem('khaos_pending_sync', '0');
        } catch (e) {}
        if (typeof showToast === 'function') showToast('Catálogo sincronizado con GitHub', 'success');
      } else {
        var err = await putRes.json().catch(function () { return {}; });
        if (typeof showToast === 'function') showToast('Error GitHub: ' + (err.message || putRes.status), 'error');
      }
    } catch (e) {
      if (typeof showToast === 'function') showToast('Error al sincronizar: ' + e.message, 'error');
    } finally {
      syncLock = false;
      if (typeof hideLoading === 'function') hideLoading();
      if (syncQueued) {
        syncQueued = false;
        setTimeout(function () { window.syncToGithub().catch(function () {}); }, 400);
      }
    }
  };

  function patchSaveProduct() {
    if (typeof window.saveProduct !== 'function') return;
    if (window.saveProduct.__khaosPatched) return;
    window.__khaosSaveProductCore = window.saveProduct;
    window.saveProduct = function () {
      var r = window.__khaosSaveProductCore.apply(this, arguments);
      markDirty();
      try { window.renderTable(); } catch (e) {}
      return r;
    };
    window.saveProduct.__khaosPatched = true;
  }

  window.deleteProduct = function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    var list = currentProducts().filter(function (p) { return Number(p.id) !== Number(id); });
    applyList(list);
    markDirty();
    refreshAfterLoad();
  };

  function placeSaveBtn() {}
  function hideCategoriasBtn() {}
  function refreshUI() {
    refreshAfterLoad();
  }

  function boot() {
    patchSaveProduct();
    placeSaveBtn();
    hideCategoriasBtn();
    Promise.resolve(window.loadProducts()).then(function () {
      refreshUI();
      console.log('[Khaos] core boot — productos:', currentProducts().length);
      if (typeof showToast === 'function') {
        showToast('Catalogo: ' + currentProducts().length + ' productos', 'success');
      }
    }).catch(function (err) {
      console.error('[Khaos] boot load error', err);
    });
  }

  var tries = 0;
  (function wait() {
    if (typeof window.saveProduct === 'function' || tries > 50) {
      boot();
      setInterval(function () {
        placeSaveBtn();
        patchSaveProduct();
        hideCategoriasBtn();
      }, 1500);
      return;
    }
    tries++;
    setTimeout(wait, 200);
  })();

  console.log('[Khaos] khaos-admin-core.js listo (tabla segura + load GitHub)');
})();
