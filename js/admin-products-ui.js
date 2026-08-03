/* ===== Productos UI: estética y buscadores del inventario maestro ===== */
(function () {
  'use strict';

  var catFilter = 'all';

  function ensureUI() {
    var view = document.getElementById('view-products');
    if (!view || view.dataset.maestroUi === '1') return;
    view.dataset.maestroUi = '1';

    var search = document.getElementById('searchBox');
    if (search) {
      search.placeholder = 'Buscar nombre o código…';
      search.style.width = '280px';
      search.setAttribute('oninput', 'renderTable()');
    }

    var card = view.querySelector('.card');
    if (!card) return;

    var toolbar = card.querySelector('.toolbar');
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
      hint.innerHTML = 'Busca por <strong>nombre</strong> o <strong>código</strong> y filtra por categoría. Al guardar, el catálogo se actualiza automáticamente en GitHub.';
      var filterRow = document.getElementById('prodMaestroFilterRow');
      if (filterRow) filterRow.parentNode.insertBefore(hint, filterRow);
    }

    var totalLabel = view.querySelector('#statTotal');
    if (totalLabel) {
      var lab = totalLabel.parentElement && totalLabel.parentElement.querySelector('.stat-card-label');
      if (lab) lab.textContent = 'Total';
    }

    refreshCategoryOptions();
  }

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

  /* ===== AUTO-SYNC A GITHUB AL GUARDAR ===== */
  var _autoSyncTimer = null;
  var AUTO_SYNC_DELAY_MS = 2500; // espera 2.5s por si hay varios guardados seguidos

  function hasGithubToken() {
    try {
      var t = localStorage.getItem('khaos_github_token');
      return !!(t && (t.startsWith('ghp_') || t.startsWith('github_pat_')));
    } catch (e) {
      return false;
    }
  }

  function scheduleAutoSync() {
    if (!hasGithubToken()) {
      if (typeof showToast === 'function') {
        showToast('Guardado local. Configura el token de GitHub en Ajustes para actualizar el catálogo automáticamente.', 'warning');
      }
      return;
    }
    if (_autoSyncTimer) clearTimeout(_autoSyncTimer);
    _autoSyncTimer = setTimeout(function () {
      _autoSyncTimer = null;
      if (typeof syncToGithub === 'function') {
        syncToGithub();
      } else if (typeof showToast === 'function') {
        showToast('Función de sincronización no disponible. Usa el botón manual.', 'warning');
      }
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
