/**
 * admin-fix.js — Parches admin estable
 * Sync sin carrera: siempre sube el array ACTUAL y no marca
 * pending=0 si hubo cambios mientras sincronizaba.
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
      setText('couponTotal', list.length);
      var active = list.filter(function (c) {
        return typeof isCouponActive === 'function' ? isCouponActive(c) : !!c.active;
      }).length;
      setText('couponActive', active);
      setText('couponUsed', list.reduce(function (s, c) { return s + (c.usedCount || 0); }, 0));
      setText('couponSaved', '$' + list.reduce(function (s, c) { return s + (c.totalSaved || 0); }, 0).toLocaleString('es-CO'));
      setText('sidebarCouponCount', active);
      setDisplay('sidebarCouponCount', active > 0 ? 'flex' : 'none');
      setText('tabCouponAll', list.length);
      setText('tabCouponActive', active);
    } catch (e) {}
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
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>No hay productos</h3></div></td></tr>';
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
          ? '<span class="badge" style="background:' + badgeConfig[p.badge].bg + ';color:' + badgeConfig[p.badge].color + ';">' + badgeConfig[p.badge].label + '</span>'
          : '<span class="badge badge-gray">Normal</span>';
        var isSelected = selected && selected.has && selected.has(p.id);
        var meta = typeof getCategoryMeta === 'function' ? getCategoryMeta(p.category) : { groupLabel: '', familyLabel: '' };
        var catColor = categoryColors[p.category] || '#D4AF37';
        var catLabel = categoryNames[p.category] || p.category || '';
        var oldHtml = oldPrice ? '<div style="font-size:11px;text-decoration:line-through;color:var(--fog);">$' + oldPrice.toLocaleString('es-CO') + '</div>' : '';
        var pid = p.id;
        return '<tr class="' + (isSelected ? 'selected' : '') + '">' +
          '<td><div class="checkbox ' + (isSelected ? 'checked' : '') + '" onclick="toggleSelect(' + pid + ', event)">' + (isSelected ? '✓' : '') + '</div></td>' +
          '<td><div class="product-cell"><img class="product-thumb" src="' + (p.image || '') + '" onerror="this.style.opacity=\'0.3\'"><div class="product-cell-info"><div class="product-cell-name">' + (p.name || '') + '</div><div class="product-cell-code">' + (p.code || '') + '</div></div></div></td>' +
          '<td><span class="badge" style="background:' + catColor + '15;color:' + catColor + ';">' + catLabel + '</span><div style="font-size:10px;color:var(--fog);">' + (meta.groupLabel || '') + ' > ' + (meta.familyLabel || '') + '</div></td>' +
          '<td><div style="font-weight:900;color:var(--gold-light);">$' + price.toLocaleString('es-CO') + '</div>' + oldHtml + '</td>' +
          '<td><div class="size-pills">' + sizesHtml + moreSizes + '</div></td>' +
          '<td>' + badgeHtml + '</td>' +
          '<td><div class="action-btns">' +
          '<button class="action-btn view" onclick="viewProduct(' + pid + ')" title="Ver"><i class="fas fa-eye"></i></button>' +
          '<button class="action-btn edit" onclick="editProduct(' + pid + ')" title="Editar"><i class="fas fa-pen"></i></button>' +
          '<button class="action-btn delete" onclick="event.preventDefault();event.stopPropagation();window.deleteProduct(' + pid + ')" title="Eliminar"><i class="fas fa-trash"></i></button>' +
          '</div></td></tr>';
      }).join('');
    } catch (e) {
      console.error('[Khaos] renderTable:', e);
      if (typeof _origRenderTable === 'function') try { _origRenderTable(); } catch (e2) {}
    }
  };

  var _origUpdateAllStats = window.updateAllStats;
  window.updateAllStats = function () {
    try {
      if (typeof _origUpdateAllStats === 'function') try { _origUpdateAllStats(); } catch (e) {}
      var prods = Array.isArray(window.products) ? window.products : [];
      setText('tabAll', prods.length);
      setText('sidebarProductCount', prods.length);
    } catch (e) {}
  };

  // ========== SYNC SIN CARRERA ==========
  var _syncLock = false;
  var _syncQueued = false;

  function getToken() {
    try { return localStorage.getItem('khaos_github_token') || ''; } catch (e) { return ''; }
  }

  function getRev() {
    try { return localStorage.getItem('khaos_local_revision') || '0'; } catch (e) { return '0'; }
  }

  function markLocalDirty() {
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(window.products || []));
      localStorage.setItem('khaos_local_revision', String(Date.now()));
      localStorage.setItem('khaos_pending_sync', '1');
    } catch (e) {}
  }

  async function fetchFileSha(token) {
    var cfg = window.GITHUB_CONFIG || { owner: 'khaosdeportivo', repo: 'khaosdeportivo', branch: 'main', path: 'productos.json', apiBase: 'https://api.github.com' };
    var res = await fetch(cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path + '?ref=' + cfg.branch + '&t=' + Date.now(), {
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }, cache: 'no-store'
    });
    if (!res.ok) return null;
    var data = await res.json();
    return data.sha || null;
  }

  window.syncToGithub = async function () {
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

    var cfg = window.GITHUB_CONFIG || { owner: 'khaosdeportivo', repo: 'khaosdeportivo', branch: 'main', path: 'productos.json', apiBase: 'https://api.github.com' };
    if (typeof showLoading === 'function') showLoading('Sincronizando…');

    var startedRev = getRev();
    var lastError = null;

    try {
      // Siempre leer el array MÁS RECIENTE justo antes de subir
      var prods = Array.isArray(window.products) ? window.products.slice() : [];
      var cups = Array.isArray(window.coupons) ? window.coupons.slice() : [];

      // Persistir local antes de subir
      try {
        localStorage.setItem('khaos_admin_products', JSON.stringify(prods));
      } catch (e) {}

      var content = {
        productos: prods,
        cupones: cups,
        fechaActualizacion: new Date().toISOString(),
        version: 1
      };
      var base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

      for (var attempt = 1; attempt <= 4; attempt++) {
        // Si el usuario cambió algo mientras reintentábamos, re-snapshot
        var nowRev = getRev();
        if (nowRev !== startedRev) {
          prods = Array.isArray(window.products) ? window.products.slice() : [];
          cups = Array.isArray(window.coupons) ? window.coupons.slice() : [];
          content = {
            productos: prods,
            cupones: cups,
            fechaActualizacion: new Date().toISOString(),
            version: 1
          };
          base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
          startedRev = nowRev;
          console.log('[Khaos] Snapshot actualizado por cambios locales:', prods.length);
        }

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
            var endRev = getRev();
            try { localStorage.setItem('khaos_last_sync', new Date().toISOString()); } catch (e) {}

            // Solo marcar como sincronizado si NO hubo cambios nuevos mientras subíamos
            if (endRev === startedRev) {
              try { localStorage.setItem('khaos_pending_sync', '0'); } catch (e) {}
              if (typeof showToast === 'function') {
                showToast('Guardado en GitHub (' + prods.length + ' productos)', 'success');
              }
              console.log('[Khaos] Sync OK definitivo:', prods.length);
            } else {
              // Hubo cambios nuevos → dejar pending y re-sincronizar
              try { localStorage.setItem('khaos_pending_sync', '1'); } catch (e) {}
              _syncQueued = true;
              if (typeof showToast === 'function') {
                showToast('Guardado parcial. Hay cambios nuevos, re-sincronizando…', 'info');
              }
              console.log('[Khaos] Sync OK pero hay cambios más nuevos → cola');
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
        } catch (e) {
          lastError = e.message || String(e);
          await new Promise(function (r) { setTimeout(r, 350 * attempt); });
        }
      }

      if (typeof showToast === 'function') {
        showToast('Error GitHub: ' + (lastError || '?') + '. Tus productos siguen en este navegador.', 'error');
      }
      try { localStorage.setItem('khaos_pending_sync', '1'); } catch (e) {}
      throw new Error(lastError || 'Sync falló');
    } finally {
      _syncLock = false;
      if (typeof hideLoading === 'function') hideLoading();
      if (_syncQueued) {
        _syncQueued = false;
        setTimeout(function () {
          window.syncToGithub().catch(function () {});
        }, 500);
      }
    }
  };

  function syncNow() {
    markLocalDirty();
    if (typeof window.syncToGithub === 'function') {
      return window.syncToGithub().catch(function (e) { console.warn(e); });
    }
  }

  // --- Parche saveProduct: tras crear/editar, forzar sync del array actual ---
  function patchSaveProduct() {
    if (typeof window.saveProduct !== 'function' || window.__khaosSaveProductPatched) return false;
    window.__khaosSaveProductPatched = true;
    var _orig = window.saveProduct;
    window.saveProduct = function () {
      var before = (window.products || []).length;
      var r = _orig.apply(this, arguments);
      var after = (window.products || []).length;
      console.log('[Khaos] saveProduct', before, '→', after);
      markLocalDirty();
      // Sync inmediato con el array actual (incluye el nuevo producto)
      setTimeout(function () { syncNow(); }, 300);
      return r;
    };
    return true;
  }

  // ========== DELETE ==========
  function doDeleteProduct(id) {
    id = Number(id);
    var before = (window.products || []).length;
    window.products = (window.products || []).filter(function (p) { return Number(p.id) !== id; });
    var after = window.products.length;
    console.log('[Khaos] delete', id, before, '→', after);
    try {
      if (window.selectedIds && window.selectedIds.delete) window.selectedIds.delete(id);
    } catch (e) {}
    markLocalDirty();
    try {
      if (typeof updateAllStats === 'function') updateAllStats();
      if (typeof renderTable === 'function') renderTable();
      if (typeof updateDashboard === 'function') updateDashboard();
    } catch (e) {}
    if (typeof showToast === 'function') {
      showToast(after < before ? 'Producto eliminado. Guardando…' : 'No se encontró el producto', after < before ? 'info' : 'warning');
    }
    if (after < before) syncNow();
  }

  function safeConfirm(title, message, onYes) {
    try {
      if (typeof showConfirm === 'function' &&
          document.getElementById('confirmTitle') &&
          document.getElementById('confirmMessage') &&
          document.getElementById('confirmBtn') &&
          document.getElementById('confirmModalOverlay')) {
        showConfirm(title, message, onYes);
        return;
      }
    } catch (e) {}
    if (window.confirm(title + '\n\n' + message)) onYes();
  }

  window.deleteProduct = function (id) {
    console.log('[Khaos] deleteProduct llamado', id);
    safeConfirm('Eliminar producto', '¿Eliminar este producto? Se guardará en GitHub.', function () {
      doDeleteProduct(id);
    });
  };

  var tries = 0;
  (function keepPatch() {
    patchSaveProduct();
    var src = '';
    try { src = window.deleteProduct.toString(); } catch (e) {}
    if (src.indexOf('[Khaos] deleteProduct llamado') === -1) {
      window.deleteProduct = function (id) {
        console.log('[Khaos] deleteProduct llamado', id);
        safeConfirm('Eliminar producto', '¿Eliminar este producto? Se guardará en GitHub.', function () {
          doDeleteProduct(id);
        });
      };
    }
    if (++tries < 40) setTimeout(keepPatch, 250);
  })();

  setTimeout(function () {
    try {
      if (Array.isArray(window.products) && window.products.length && typeof window.renderTable === 'function') {
        window.renderTable();
        if (typeof window.updateAllStats === 'function') window.updateAllStats();
      }
    } catch (e) {}
  }, 400);

  console.log('[Khaos] admin-fix.js aplicado (sync sin carrera)');
})();
