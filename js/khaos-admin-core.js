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
    try {
      if (typeof products !== 'undefined' && Array.isArray(products)) return products;
    } catch (e) {}
    if (Array.isArray(window.products)) return window.products;
    return [];
  }

  function currentCoupons() {
    try {
      if (typeof coupons !== 'undefined' && Array.isArray(coupons)) return coupons;
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
    try {
      products = list;
    } catch (e) {
      window.products = list;
    }
    try {
      nextId = list.length
        ? Math.max.apply(null, list.map(function (p) { return Number(p.id) || 0; }).concat([0])) + 1
        : 1;
    } catch (e) {
      try { window.nextId = 1; } catch (e2) {}
    }
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(list));
    } catch (e) {}
    return list.length;
  }

  function markDirty() {
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(currentProducts()));
      localStorage.setItem('khaos_local_revision', String(Date.now()));
      localStorage.setItem('khaos_pending_sync', '1');
    } catch (e) {}
  }

  // ===== TABLA SEGURA (evita crash por sizes/oldPrice) =====
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
    var perPage = typeof itemsPerPage !== 'undefined' ? itemsPerPage : 10;
    var page = typeof currentPage !== 'undefined' ? currentPage : 1;
    var totalPages = Math.max(1, Math.ceil(total / perPage) || 1);
    if (page > totalPages) page = totalPages;
    try { currentPage = page; } catch (e) {}

    var start = (page - 1) * perPage;
    var pageItems = filtered.slice(start, start + perPage);

    try {
      var el;
      el = document.getElementById('pageStart'); if (el) el.textContent = total > 0 ? start + 1 : 0;
      el = document.getElementById('pageEnd'); if (el) el.textContent = Math.min(start + perPage, total);
      el = document.getElementById('pageTotal'); if (el) el.textContent = total;
    } catch (e) {}

    try { if (typeof renderPagination === 'function') renderPagination(totalPages); } catch (e) {}
    try { if (typeof updateBulkBar === 'function') updateBulkBar(); } catch (e) {}

    if (!pageItems.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>No hay productos</h3><p>Ajusta los filtros</p></div></td></tr>';
      return;
    }

    var bc = (typeof badgeConfig !== 'undefined' && badgeConfig) ? badgeConfig : {};
    var cn = (typeof categoryNames !== 'undefined' && categoryNames) ? categoryNames : {};
    var cc = (typeof categoryColors !== 'undefined' && categoryColors) ? categoryColors : {};

    tbody.innerHTML = pageItems.map(function (p) {
      p = normalizeProduct(p) || { id: 0, name: '', code: '', category: '', price: 0, sizes: [], outOfStock: [], image: '' };
      var sizes = p.sizes;
      var oos = p.outOfStock;
      var price = p.price;
      var oldPrice = p.oldPrice;

      var sizesHtml = sizes.slice(0, 6).map(function (s) {
        return '<span class="size-pill ' + (oos.indexOf(s) >= 0 ? 'out' : 'available') + '">' + s + '</span>';
      }).join('');
      var moreSizes = sizes.length > 6
        ? '<span class="size-pill available">+' + (sizes.length - 6) + '</span>'
        : '';

      var badgeHtml = (p.badge && bc[p.badge])
        ? '<span class="badge" style="background:' + bc[p.badge].bg + ';color:' + bc[p.badge].color + ';"><i class="fas ' + (bc[p.badge].icon || '') + '"></i> ' + bc[p.badge].label + '</span>'
        : '<span class="badge badge-gray">Normal</span>';

      var isSelected = false;
      try {
        isSelected = typeof selectedIds !== 'undefined' && selectedIds && selectedIds.has && selectedIds.has(p.id);
      } catch (e) {}

      var catColor = cc[p.category] || '#D4AF37';
      var catLabel = cn[p.category] || p.category || '';
      var meta = { groupLabel: '', familyLabel: '' };
      try {
        if (typeof getCategoryMeta === 'function') meta = getCategoryMeta(p.category) || meta;
      } catch (e) {}

      var oldHtml = (oldPrice && oldPrice > price)
        ? '<div style="font-size:11px;color:var(--fog);text-decoration:line-through;">$' + oldPrice.toLocaleString('es-CO') + '</div>'
        : '';

      return '<tr class="' + (isSelected ? 'selected' : '') + '">' +
        '<td data-label="Seleccionar"><div class="checkbox ' + (isSelected ? 'checked' : '') + '" onclick="toggleSelect(' + p.id + ', event)">' +
        (isSelected ? '<i class="fas fa-check"></i>' : '') + '</div></td>' +
        '<td data-label="Producto"><div class="product-cell">' +
        '<img class="product-thumb" src="' + (p.image || '') + '" onerror="this.style.opacity=\'0.3\'">' +
        '<div class="product-cell-info"><div class="product-cell-name">' + (p.name || '') + '</div>' +
        '<div class="product-cell-code">' + (p.code || '') + '</div></div></div></td>' +
        '<td data-label="Categoria"><div style="display:flex;flex-direction:column;gap:2px;">' +
        '<span class="badge" style="background:' + catColor + '15;color:' + catColor + ';border-color:' + catColor + '30;font-size:11px;padding:3px 10px;">' + catLabel + '</span>' +
        '<span style="font-size:10px;color:var(--fog);">' + (meta.groupLabel || '') + ' > ' + (meta.familyLabel || '') + '</span></div></td>' +
        '<td data-label="Precio"><div style="font-weight:900;color:var(--gold-light);font-size:15px;">$' + price.toLocaleString('es-CO') + '</div>' + oldHtml + '</td>' +
        '<td data-label="Tallas"><div class="size-pills">' + sizesHtml + moreSizes + '</div></td>' +
        '<td data-label="Estado">' + badgeHtml + '</td>' +
        '<td data-label="Acciones"><div class="action-btns">' +
        '<button class="action-btn view" onclick="viewProduct(' + p.id + ')" title="Ver"><i class="fas fa-eye"></i></button>' +
        '<button class="action-btn edit" onclick="editProduct(' + p.id + ')" title="Editar"><i class="fas fa-pen"></i></button>' +
        '<button class="action-btn delete" onclick="deleteProduct(' + p.id + ')" title="Eliminar"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');
  };

  window.saveProducts = function saveProducts() {
    markDirty();
    try { if (typeof updateAllStats === 'function') updateAllStats(); } catch (e) {}
    try { window.renderTable(); } catch (e) {}
    try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
    try { if (typeof renderCategoriesView === 'function') renderCategoriesView(); } catch (e) {}
    try { if (typeof renderInventory === 'function') renderInventory(); } catch (e) {}
    try { if (typeof updateCharts === 'function') updateCharts(); } catch (e) {}
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
          }
          try { localStorage.setItem('khaos_pending_sync', '0'); } catch (e) {}
          console.log('[Khaos] load: github', n2);
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
          return;
        }
      }
    } catch (e) {}

    applyList([]);
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
      owner: 'khaosdeportivo', repo: 'khaosdeportivo', branch: 'main',
      path: 'productos.json', apiBase: 'https://api.github.com'
    };

    try {
      var lastError = null;
      for (var attempt = 1; attempt <= 4; attempt++) {
        var prods = currentProducts().slice();
        var cups = currentCoupons().slice();
        try { localStorage.setItem('khaos_admin_products', JSON.stringify(prods)); } catch (e) {}
        var content = {
          productos: prods,
          cupones: cups,
          fechaActualizacion: new Date().toISOString(),
          version: 1
        };
        var base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
        var sha = null;
        try {
          var getRes = await fetch(
            cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path +
              '?ref=' + cfg.branch + '&t=' + Date.now(),
            { headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' }, cache: 'no-store' }
          );
          if (getRes.ok) {
            var meta = await getRes.json();
            sha = meta.sha;
          }
        } catch (e) {}
        var body = {
          message: 'Actualizacion catalogo — ' + new Date().toLocaleString('es-CO') + ' (' + prods.length + ' productos)',
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
          var endRev = getRev();
          try { localStorage.setItem('khaos_last_sync', new Date().toISOString()); } catch (e) {}
          if (endRev === startedRev) {
            try { localStorage.setItem('khaos_pending_sync', '0'); } catch (e) {}
            if (typeof showToast === 'function') showToast('Guardado en GitHub (' + prods.length + ' productos)', 'success');
          } else {
            try { localStorage.setItem('khaos_pending_sync', '1'); } catch (e) {}
            syncQueued = true;
          }
          return true;
        }
        var err = {};
        try { err = await putRes.json(); } catch (e) {}
        lastError = err.message || ('HTTP ' + putRes.status);
        if (putRes.status === 409 || /does not match/i.test(String(lastError))) {
          await new Promise(function (r) { setTimeout(r, 350 * attempt); });
          continue;
        }
        break;
      }
      try { localStorage.setItem('khaos_pending_sync', '1'); } catch (e) {}
      if (typeof showToast === 'function') showToast('Error GitHub: ' + (lastError || '?'), 'error');
      throw new Error(lastError || 'Sync fallo');
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
    if (typeof window.saveProduct !== 'function' || window.__khaosSaveProductCore) return;
    window.__khaosSaveProductCore = true;
    var orig = window.saveProduct;
    window.saveProduct = function () {
      var r = orig.apply(this, arguments);
      markDirty();
      setTimeout(function () { window.syncToGithub().catch(function () {}); }, 200);
      return r;
    };
  }

  window.deleteProduct = function deleteProduct(id) {
    function doDel() {
      id = Number(id);
      var before = currentProducts().length;
      var next = currentProducts().filter(function (p) { return Number(p.id) !== id; });
      applyList(next);
      try {
        if (typeof selectedIds !== 'undefined' && selectedIds && selectedIds.delete) selectedIds.delete(id);
      } catch (e) {}
      window.saveProducts();
      if (typeof showToast === 'function') {
        showToast(next.length < before ? 'Producto eliminado. Guardando...' : 'No encontrado', 'info');
      }
      if (next.length < before) window.syncToGithub().catch(function () {});
    }
    if (typeof showConfirm === 'function') {
      try {
        showConfirm('Eliminar producto', 'Eliminar este producto? Se guardara en GitHub.', doDel);
        return;
      } catch (e) {}
    }
    if (window.confirm('Eliminar este producto?')) doDel();
  };

  function placeSaveBtn() {
    var view = document.getElementById('view-products');
    if (!view) return;
    var toolbar = view.querySelector('.toolbar');
    if (!toolbar || document.getElementById('btnGuardarCambios')) return;
    var btn = document.createElement('button');
    btn.id = 'btnGuardarCambios';
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.style.cssText = 'background:linear-gradient(135deg,#22c55e,#16a34a);border:none;color:#fff;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;';
    btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
    btn.onclick = function () {
      markDirty();
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      Promise.resolve(window.syncToGithub()).then(function () {
        btn.innerHTML = '<i class="fas fa-check"></i> Guardado!';
        setTimeout(function () {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
        }, 2000);
      }).catch(function () {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
        setTimeout(function () {
          btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
        }, 2500);
      });
    };
    toolbar.insertBefore(btn, toolbar.firstChild);
  }

  function hideCategoriasBtn() {
    ['catFilterBtn', 'catFilterDropdown', 'activeFilterPill', 'categoryChips', 'prodMaestroFilterRow'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    // Botones con texto Categorias en la toolbar de productos
    try {
      var view = document.getElementById('view-products');
      if (!view) return;
      view.querySelectorAll('button, .cat-filter-btn').forEach(function (btn) {
        var t = (btn.textContent || '').trim();
        if (/^Categor/i.test(t) || (btn.id && btn.id.indexOf('catFilter') === 0)) {
          btn.style.display = 'none';
        }
      });
    } catch (e) {}
  }

  function refreshUI() {
    hideCategoriasBtn();
    try { window.renderTable(); } catch (e) { console.error(e); }
    try { if (typeof updateAllStats === 'function') updateAllStats(); } catch (e) {}
    try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
    try { if (typeof renderSidebarCategories === 'function') renderSidebarCategories(); } catch (e) {}
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

  console.log('[Khaos] khaos-admin-core.js listo (tabla segura)');
})();
