/**
 * admin-fix.js — Parches sobre el admin estable (CDN)
 * - renderTable / couponStats / updateAllStats seguros
 * - syncToGithub con reintento SHA + cola
 * - deleteProduct y saveProducts sincronizan de inmediato
 */
(function () {
  'use strict';

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setDisplay(id, disp) {
    var el = document.getElementById(id);
    if (el) el.style.display = disp;
  }

  window.formatPrice = function (n) {
    n = Number(n);
    if (isNaN(n)) n = 0;
    return '$' + n.toLocaleString('es-CO');
  };

  window.updateCouponStats = function () {
    try {
      var list = Array.isArray(window.coupons) ? window.coupons : [];
      var total = list.length;
      var active = list.filter(function (c) {
        return typeof isCouponActive === 'function' ? isCouponActive(c) : !!c.active;
      }).length;
      var used = list.reduce(function (s, c) { return s + (c.usedCount || 0); }, 0);
      var saved = list.reduce(function (s, c) { return s + (c.totalSaved || 0); }, 0);
      setText('couponTotal', total);
      setText('couponActive', active);
      setText('couponUsed', used);
      setText('couponSaved', '$' + saved.toLocaleString('es-CO'));
      setText('sidebarCouponCount', active);
      setDisplay('sidebarCouponCount', active > 0 ? 'flex' : 'none');
      setText('tabCouponAll', total);
      setText('tabCouponActive', active);
      setText('tabCouponExpired', list.filter(function (c) {
        return typeof isCouponActive === 'function' && typeof isCouponExpired === 'function'
          ? (!isCouponActive(c) && isCouponExpired(c)) : false;
      }).length);
      setText('tabCouponPct', list.filter(function (c) { return c.type === 'percentage'; }).length);
      setText('tabCouponFixed', list.filter(function (c) { return c.type === 'fixed'; }).length);
    } catch (e) {
      console.warn('[Khaos] updateCouponStats:', e.message);
    }
  };

  var _origRenderTable = window.renderTable;
  window.renderTable = function () {
    try {
      var tbody = document.getElementById('productsTableBody');
      if (!tbody) {
        if (typeof _origRenderTable === 'function') return _origRenderTable.apply(this, arguments);
        return;
      }
      var filtered = typeof getFilteredProducts === 'function' ? getFilteredProducts() : (window.products || []);
      var total = filtered.length;
      var perPage = typeof itemsPerPage !== 'undefined' ? itemsPerPage : 10;
      var page = typeof currentPage !== 'undefined' ? currentPage : 1;
      var totalPages = Math.max(1, Math.ceil(total / perPage) || 1);
      if (page > totalPages) page = totalPages;
      if (typeof currentPage !== 'undefined') currentPage = page;
      var start = (page - 1) * perPage;
      var pageItems = filtered.slice(start, start + perPage);
      setText('pageStart', total === 0 ? 0 : start + 1);
      setText('pageEnd', Math.min(start + perPage, total));
      setText('pageTotal', total);
      if (typeof renderPagination === 'function') renderPagination(totalPages);
      if (!pageItems.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-box-open"></i></div><h3>No hay productos</h3><p>Agrega productos o ajusta los filtros</p></div></td></tr>';
        return;
      }
      var badgeConfig = window.badgeConfig || {};
      var categoryNames = window.categoryNames || {};
      var categoryColors = window.categoryColors || {};
      var selected = window.selectedIds;
      tbody.innerHTML = pageItems.map(function (p) {
        var sizes = Array.isArray(p.sizes) ? p.sizes : [];
        var oos = Array.isArray(p.outOfStock) ? p.outOfStock : [];
        var price = Number(p.price); if (isNaN(price)) price = 0;
        var oldPrice = p.oldPrice != null ? Number(p.oldPrice) : null;
        if (oldPrice != null && (isNaN(oldPrice) || oldPrice <= price)) oldPrice = null;
        var sizesHtml = sizes.slice(0, 6).map(function (s) {
          return '<span class="size-pill ' + (oos.indexOf(s) >= 0 ? 'out' : 'available') + '">' + s + '</span>';
        }).join('');
        var moreSizes = sizes.length > 6 ? '<span class="size-pill available">+' + (sizes.length - 6) + '</span>' : '';
        var badgeHtml = (p.badge && badgeConfig[p.badge])
          ? '<span class="badge" style="background:' + badgeConfig[p.badge].bg + ';color:' + badgeConfig[p.badge].color + ';border-color:' + badgeConfig[p.badge].border + ';"><i class="fas ' + badgeConfig[p.badge].icon + '"></i> ' + badgeConfig[p.badge].label + '</span>'
          : '<span class="badge badge-gray">Normal</span>';
        var isSelected = selected && typeof selected.has === 'function' && selected.has(p.id);
        var meta = typeof getCategoryMeta === 'function' ? getCategoryMeta(p.category) : { groupLabel: '', familyLabel: '' };
        var catColor = categoryColors[p.category] || '#D4AF37';
        var catLabel = categoryNames[p.category] || p.category || '';
        var oldPriceHtml = oldPrice ? '<div style="font-size:11px;color:var(--fog);text-decoration:line-through;">$' + oldPrice.toLocaleString('es-CO') + '</div>' : '';
        return '<tr class="' + (isSelected ? 'selected' : '') + '">' +
          '<td data-label="Seleccionar"><div class="checkbox ' + (isSelected ? 'checked' : '') + '" onclick="toggleSelect(' + p.id + ', event)">' + (isSelected ? '<i class="fas fa-check"></i>' : '') + '</div></td>' +
          '<td data-label="Producto"><div class="product-cell"><img class="product-thumb" src="' + (p.image || '') + '" onerror="this.style.opacity=\'0.3\'"><div class="product-cell-info"><div class="product-cell-name">' + (p.name || '') + '</div><div class="product-cell-code">' + (p.code || '') + '</div></div></div></td>' +
          '<td data-label="Categoría"><div style="display:flex;flex-direction:column;gap:2px;"><span class="badge" style="background:' + catColor + '15;color:' + catColor + ';border-color:' + catColor + '30;font-size:11px;padding:3px 10px;">' + catLabel + '</span><span style="font-size:10px;color:var(--fog);">' + (meta.groupLabel || '') + ' > ' + (meta.familyLabel || '') + '</span></div></td>' +
          '<td data-label="Precio"><div style="font-weight:900;color:var(--gold-light);font-size:15px;">$' + price.toLocaleString('es-CO') + '</div>' + oldPriceHtml + '</td>' +
          '<td data-label="Tallas"><div class="size-pills">' + sizesHtml + moreSizes + '</div></td>' +
          '<td data-label="Estado">' + badgeHtml + '</td>' +
          '<td data-label="Acciones"><div class="action-btns"><button class="action-btn view" onclick="viewProduct(' + p.id + ')" title="Ver"><i class="fas fa-eye"></i></button><button class="action-btn edit" onclick="editProduct(' + p.id + ')" title="Editar"><i class="fas fa-pen"></i></button><button class="action-btn delete" onclick="deleteProduct(' + p.id + ')" title="Eliminar"><i class="fas fa-trash"></i></button></div></td></tr>';
      }).join('');
    } catch (e) {
      console.error('[Khaos] renderTable fix:', e);
      if (typeof _origRenderTable === 'function') {
        try { return _origRenderTable.apply(this, arguments); } catch (e2) {}
      }
    }
  };

  var _origUpdateAllStats = window.updateAllStats;
  window.updateAllStats = function () {
    try {
      if (typeof _origUpdateAllStats === 'function') {
        try { _origUpdateAllStats.apply(this, arguments); } catch (e) {}
      }
      var prods = Array.isArray(window.products) ? window.products : [];
      setText('tabAll', prods.length);
      setText('sidebarProductCount', prods.length);
      var badgeKeys = { bestseller: 'tabBestseller', 'new': 'tabNew', promo: 'tabPromo', lastunits: 'tabLastunits', limited: 'tabLimited', recommended: 'tabRecommended', clearance: 'tabClearance', preorder: 'tabPreorder' };
      Object.keys(badgeKeys).forEach(function (b) {
        setText(badgeKeys[b], prods.filter(function (p) { return p.badge === b; }).length);
      });
      var outCount = prods.filter(function (p) {
        var sizes = Array.isArray(p.sizes) ? p.sizes : [];
        var oos = Array.isArray(p.outOfStock) ? p.outOfStock : [];
        return sizes.length > 0 && oos.length >= sizes.length;
      }).length;
      setText('tabOutOfStock', outCount);
      var nino = prods.filter(function (p) { return (p.category || '').indexOf('nino-') === 0; }).length;
      setText('sidebarAdultoCount', prods.length - nino);
      setText('sidebarNinoCount', nino);
    } catch (e) {}
  };

  // ========== SYNC CON COLA + REINTENTO ==========
  var _syncLock = false;
  var _syncQueued = false;

  function getToken() {
    try { return localStorage.getItem('khaos_github_token') || ''; } catch (e) { return ''; }
  }

  async function fetchFileSha(token) {
    var cfg = window.GITHUB_CONFIG || {
      owner: 'khaosdeportivo', repo: 'khaosdeportivo', branch: 'main',
      path: 'productos.json', apiBase: 'https://api.github.com'
    };
    var res = await fetch(
      cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path + '?ref=' + cfg.branch + '&t=' + Date.now(),
      { headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    var data = await res.json();
    return data.sha || null;
  }

  function markLocalDirty() {
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(window.products || []));
      localStorage.setItem('khaos_local_revision', String(Date.now()));
    } catch (e) {}
  }

  window.syncToGithub = async function syncToGithubFixed() {
    var token = getToken();
    if (!token) {
      if (typeof showToast === 'function') showToast('Configura el token de GitHub en Ajustes', 'warning');
      throw new Error('Sin token');
    }

    if (_syncLock) {
      _syncQueued = true;
      console.log('[Khaos] Sync en cola');
      return;
    }
    _syncLock = true;
    _syncQueued = false;

    var cfg = window.GITHUB_CONFIG || {
      owner: 'khaosdeportivo', repo: 'khaosdeportivo', branch: 'main',
      path: 'productos.json', apiBase: 'https://api.github.com'
    };

    if (typeof showLoading === 'function') showLoading('Sincronizando con GitHub…');

    try {
      // Snapshot actual de productos al momento del sync
      var prods = Array.isArray(window.products) ? window.products : [];
      var cups = Array.isArray(window.coupons) ? window.coupons : [];
      var content = {
        productos: prods,
        cupones: cups,
        fechaActualizacion: new Date().toISOString(),
        version: 1
      };
      var base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

      var maxAttempts = 4;
      var lastError = null;

      for (var attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          var sha = await fetchFileSha(token);
          var body = {
            message: 'Actualización catálogo — ' + new Date().toLocaleString('es-CO') + ' (' + prods.length + ' productos)',
            content: base64Content,
            branch: cfg.branch
          };
          if (sha) body.sha = sha;

          var putRes = await fetch(
            cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path,
            {
              method: 'PUT',
              headers: {
                'Authorization': 'token ' + token,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(body)
            }
          );

          if (putRes.ok || putRes.status === 201) {
            var now = new Date().toISOString();
            try {
              localStorage.setItem('khaos_last_sync', now);
              localStorage.setItem('khaos_local_revision', String(Date.now()));
            } catch (e) {}
            setText('githubLastSync', new Date(now).toLocaleString('es-CO'));
            if (typeof showToast === 'function') {
              showToast('Guardado en GitHub (' + prods.length + ' productos)', 'success');
            }
            if (typeof addNotification === 'function') addNotification('system', 'Catálogo sincronizado exitosamente');
            console.log('[Khaos] Sync OK —', prods.length, 'productos');
            return true;
          }

          var err = {};
          try { err = await putRes.json(); } catch (e) {}
          lastError = err.message || ('HTTP ' + putRes.status);

          if (putRes.status === 409 || /does not match/i.test(lastError)) {
            console.warn('[Khaos] Conflicto SHA, reintento', attempt);
            await new Promise(function (r) { setTimeout(r, 350 * attempt); });
            continue;
          }
          break;
        } catch (e) {
          lastError = e.message || String(e);
          await new Promise(function (r) { setTimeout(r, 350 * attempt); });
        }
      }

      if (typeof showToast === 'function') {
        showToast('Error al guardar en GitHub: ' + (lastError || 'Desconocido') + '. Tus cambios están solo en este navegador.', 'error');
      }
      throw new Error(lastError || 'Sync falló');
    } finally {
      _syncLock = false;
      if (typeof hideLoading === 'function') hideLoading();
      // Si hubo otra petición mientras tanto, sincronizar de nuevo con el estado actual
      if (_syncQueued) {
        _syncQueued = false;
        setTimeout(function () {
          window.syncToGithub().catch(function () {});
        }, 300);
      }
    }
  };

  // Forzar sync inmediato (borra debounce)
  function syncNow() {
    markLocalDirty();
    if (typeof window.syncToGithub === 'function') {
      return window.syncToGithub().catch(function (e) {
        console.warn('[Khaos] syncNow:', e && e.message);
      });
    }
  }

  // --- Parche deleteProduct: borrar + sync ya ---
  function patchDelete() {
    if (typeof window.deleteProduct !== 'function' || window.__khaosDeletePatched) return false;
    window.__khaosDeletePatched = true;
    window.deleteProduct = function (id) {
      var doDelete = function () {
        window.products = (window.products || []).filter(function (p) { return p.id !== id; });
        try {
          if (typeof selectedIds !== 'undefined' && selectedIds.delete) selectedIds.delete(id);
        } catch (e) {}
        markLocalDirty();
        try { if (typeof updateAllStats === 'function') updateAllStats(); } catch (e) {}
        try { if (typeof renderTable === 'function') renderTable(); } catch (e) {}
        try { if (typeof renderCategoryChips === 'function') renderCategoryChips(); } catch (e) {}
        try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
        if (typeof showToast === 'function') showToast('Producto eliminado. Guardando en GitHub…', 'info');
        syncNow();
      };
      if (typeof showConfirm === 'function') {
        showConfirm('Eliminar producto', '¿Eliminar este producto? Se guardará en GitHub.', doDelete);
      } else if (window.confirm('¿Eliminar este producto?')) {
        doDelete();
      }
    };
    return true;
  }

  // --- Parche saveProducts: marcar dirty ---
  function patchSave() {
    if (typeof window.saveProducts !== 'function' || window.__khaosSaveDirtyPatched) return false;
    window.__khaosSaveDirtyPatched = true;
    var _orig = window.saveProducts;
    window.saveProducts = function () {
      var r = _orig.apply(this, arguments);
      try { localStorage.setItem('khaos_local_revision', String(Date.now())); } catch (e) {}
      return r;
    };
    return true;
  }

  // Instalar parches cuando existan las funciones
  var tries = 0;
  (function waitPatch() {
    patchDelete();
    patchSave();
    if ((window.__khaosDeletePatched && window.__khaosSaveDirtyPatched) || ++tries > 50) return;
    setTimeout(waitPatch, 200);
  })();

  setTimeout(function () {
    try {
      if (Array.isArray(window.products) && window.products.length) {
        if (typeof window.renderTable === 'function') window.renderTable();
        if (typeof window.updateAllStats === 'function') window.updateAllStats();
      }
    } catch (e) {}
  }, 300);

  console.log('[Khaos] admin-fix.js aplicado (delete→sync inmediato)');
})();
