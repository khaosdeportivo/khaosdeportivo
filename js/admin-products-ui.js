/* ===== Productos UI: estética, buscadores y botón Guardar ===== */
(function () {
  'use strict';

  var catFilter = 'all';
  var _saving = false;

  function ensureUI() {
    var view = document.getElementById('view-products');
    if (!view) return;

    var search = document.getElementById('searchBox');
    if (search) {
      search.placeholder = 'Buscar nombre o código…';
      search.style.width = '280px';
      search.setAttribute('oninput', 'renderTable()');
    }

    var card = view.querySelector('.card');
    if (!card) return;

    var toolbar = card.querySelector('.toolbar');

    // ===== Botón GUARDAR CAMBIOS =====
    if (toolbar && !document.getElementById('btnGuardarCambios')) {
      var btn = document.createElement('button');
      btn.id = 'btnGuardarCambios';
      btn.type = 'button';
      btn.className = 'btn btn-primary';
      btn.style.cssText = 'background:linear-gradient(135deg,#22c55e,#16a34a);border:none;color:#fff;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 2px 10px rgba(34,197,94,0.35);';
      btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
      btn.title = 'Guarda los productos en GitHub y actualiza el catálogo público';
      btn.onclick = function () { window.__khaosGuardarCambios(); };

      // Insertar al inicio de la toolbar (muy visible)
      if (toolbar.firstChild) {
        toolbar.insertBefore(btn, toolbar.firstChild);
      } else {
        toolbar.appendChild(btn);
      }
    }

    if (toolbar && !document.getElementById('prodMaestroFilterRow')) {
      var row = document.createElement('div');
      row.id = 'prodMaestroFilterRow';
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin:0 16px 12px;align-items:center;';
      row.innerHTML =
        '<select class="form-select" id="prodCategoryFilter" onchange="window.__prodOnCategoryFilter(this.value)" style="max-width:240px;">' +
        '<option value="all">Todas las categorías</option></select>' +
        '<span id="prodFilterStatus" style="font-size:12px;color:var(--fog);margin-left:auto;"></span>';
      if (toolbar.nextSibling) {
        toolbar.parentNode.insertBefore(row, toolbar.nextSibling);
      } else {
        toolbar.parentNode.appendChild(row);
      }
    }

    if (!document.getElementById('prodMaestroHint')) {
      var hint = document.createElement('p');
      hint.id = 'prodMaestroHint';
      hint.style.cssText = 'font-size:13px;color:var(--fog);margin:0 16px 12px;';
      hint.innerHTML = 'Busca por <strong>nombre</strong> o <strong>código</strong>. Usa <strong style="color:#22c55e;">Guardar cambios</strong> para publicar el catálogo en GitHub.';
      var filterRow = document.getElementById('prodMaestroFilterRow');
      if (filterRow) filterRow.parentNode.insertBefore(hint, filterRow);
    }

    view.dataset.maestroUi = '1';
    refreshCategoryOptions();
  }

  function setSaveButtonState(state) {
    var btn = document.getElementById('btnGuardarCambios');
    if (!btn) return;
    if (state === 'saving') {
      btn.disabled = true;
      btn.style.opacity = '0.75';
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Guardando…</span>';
    } else if (state === 'ok') {
      btn.disabled = true;
      btn.style.opacity = '1';
      btn.style.background = 'linear-gradient(135deg,#22c55e,#15803d)';
      btn.innerHTML = '<i class="fas fa-check"></i> <span>¡Guardado!</span>';
      setTimeout(function () { setSaveButtonState('idle'); }, 2200);
    } else if (state === 'error') {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
      btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Error al guardar</span>';
      setTimeout(function () { setSaveButtonState('idle'); }, 2800);
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
    }
  }

  function hasGithubToken() {
    try {
      var t = localStorage.getItem('khaos_github_token');
      return !!(t && (t.startsWith('ghp_') || t.startsWith('github_pat_')));
    } catch (e) {
      return false;
    }
  }

  window.__khaosGuardarCambios = function () {
    if (_saving) return;
    _saving = true;
    setSaveButtonState('saving');

    // 1) Guardar en localStorage
    try {
      if (typeof saveProducts === 'function') saveProducts();
      else if (Array.isArray(window.products)) {
        localStorage.setItem('khaos_admin_products', JSON.stringify(window.products));
      }
    } catch (e) {
      console.warn(e);
    }

    // 2) Sincronizar con GitHub
    if (!hasGithubToken()) {
      _saving = false;
      setSaveButtonState('error');
      if (typeof showToast === 'function') {
        showToast('Configura el token de GitHub en Ajustes para poder guardar en el catálogo.', 'warning');
      }
      return;
    }

    if (typeof syncToGithub !== 'function') {
      _saving = false;
      setSaveButtonState('error');
      if (typeof showToast === 'function') {
        showToast('Función de sincronización no disponible.', 'error');
      }
      return;
    }

    // syncToGithub suele ser async o devolver promesa
    var result;
    try {
      result = syncToGithub();
    } catch (e) {
      _saving = false;
      setSaveButtonState('error');
      if (typeof showToast === 'function') showToast('Error: ' + e.message, 'error');
      return;
    }

    if (result && typeof result.then === 'function') {
      result.then(function () {
        _saving = false;
        setSaveButtonState('ok');
        if (typeof showToast === 'function') {
          showToast('Cambios guardados en GitHub. El catálogo se actualizó.', 'success');
        }
      }).catch(function (err) {
        _saving = false;
        setSaveButtonState('error');
        if (typeof showToast === 'function') {
          showToast('No se pudo guardar: ' + (err && err.message ? err.message : err), 'error');
        }
      });
    } else {
      // Si no devuelve promesa, asumir éxito tras un breve delay
      setTimeout(function () {
        _saving = false;
        setSaveButtonState('ok');
        if (typeof showToast === 'function') {
          showToast('Cambios enviados a GitHub.', 'success');
        }
      }, 1500);
    }
  };

  function refreshCategoryOptions() {
    var sel = document.getElementById('prodCategoryFilter');
    if (!sel || typeof products === 'undefined' || !Array.isArray(products)) return;
    var cats = [];
    var seen = {};
    products.forEach(function (p) {
      if (p.category && !seen[p.category]) {
        seen[p.category] = true;
        cats.push(p.category);
      }
    });
    cats.sort();
    var current = sel.value || 'all';
    var html = '<option value="all">Todas las categorías</option>';
    cats.forEach(function (c) {
      var label = (typeof categoryNames !== 'undefined' && categoryNames[c]) ? categoryNames[c] : c;
      var n = products.filter(function (p) { return p.category === c; }).length;
      html += '<option value="' + c + '">' + label + ' (' + n + ')</option>';
    });
    sel.innerHTML = html;
    try { sel.value = current; } catch (e) {}
  }

  window.__prodOnCategoryFilter = function (val) {
    catFilter = val || 'all';
    try {
      if (typeof currentCategoryFilter !== 'undefined') currentCategoryFilter = catFilter;
    } catch (e) {}
    try {
      if (typeof filterByCategory === 'function' && catFilter === 'all') filterByCategory('all');
    } catch (e) {}
    try { if (typeof currentPage !== 'undefined') currentPage = 1; } catch (e) {}
    if (typeof renderTable === 'function') renderTable();
    updateFilterStatus();
  };

  function updateFilterStatus() {
    var el = document.getElementById('prodFilterStatus');
    if (!el || typeof products === 'undefined') return;
    var n = products.length;
    var filtered = n;
    try {
      if (typeof getFilteredProducts === 'function') filtered = getFilteredProducts().length;
    } catch (e) {}
    el.textContent = filtered === n ? (n + ' productos') : (filtered + ' de ' + n + ' productos');
  }

  function patchFilters() {
    if (typeof getFilteredProducts !== 'function') return false;
    if (window.__prodFilterPatched) return true;
    window.__prodFilterPatched = true;
    var orig = getFilteredProducts;
    window.getFilteredProducts = function () {
      var result = orig.apply(this, arguments);
      if (catFilter && catFilter !== 'all') {
        result = result.filter(function (p) { return p.category === catFilter; });
      }
      return result;
    };

    if (typeof renderTable === 'function' && !window.__prodRenderPatched) {
      window.__prodRenderPatched = true;
      var _rt = renderTable;
      window.renderTable = function () {
        var r = _rt.apply(this, arguments);
        try { updateFilterStatus(); } catch (e) {}
        try { refreshCategoryOptions(); } catch (e) {}
        return r;
      };
    }
    return true;
  }

  /* AUTO-SYNC (sigue activo al guardar desde modales) */
  var _autoSyncTimer = null;
  var AUTO_SYNC_DELAY_MS = 2500;

  function scheduleAutoSync() {
    if (!hasGithubToken()) return;
    if (_autoSyncTimer) clearTimeout(_autoSyncTimer);
    _autoSyncTimer = setTimeout(function () {
      _autoSyncTimer = null;
      if (typeof syncToGithub === 'function') syncToGithub();
    }, AUTO_SYNC_DELAY_MS);
  }

  function patchSaveProducts() {
    if (typeof saveProducts !== 'function' || window.__prodAutoSyncPatched) return false;
    window.__prodAutoSyncPatched = true;
    var _origSave = saveProducts;
    window.saveProducts = function () {
      var result = _origSave.apply(this, arguments);
      try { scheduleAutoSync(); } catch (e) {}
      return result;
    };
    return true;
  }

  function boot() {
    ensureUI();
    var tries = 0;
    (function wait() {
      var filtersOk = patchFilters();
      var saveOk = patchSaveProducts();
      if ((filtersOk && saveOk) || ++tries > 40) {
        ensureUI();
        refreshCategoryOptions();
        updateFilterStatus();
        if (typeof renderTable === 'function') {
          try { renderTable(); } catch (e) {}
        }
        return;
      }
      setTimeout(wait, 150);
    })();
  }

  if (typeof switchView === 'function' && !window.__prodSwitchPatched) {
    window.__prodSwitchPatched = true;
    var _sv = switchView;
    window.switchView = function (view, el) {
      var r = _sv.apply(this, arguments);
      if (view === 'products') setTimeout(boot, 50);
      return r;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  } else {
    setTimeout(boot, 400);
  }
})();
