/**
 * khaos-admin-filters.js — Busqueda y filtros en Productos e Inventario
 */
(function () {
  'use strict';

  var prodStockFilter = 'all';
  var prodCatFilter = 'all';
  var invSearch = '';
  var invStockFilter = 'all';
  var invCatFilter = 'all';
  var origGetFiltered = null;

  function productsList() {
    try {
      if (typeof products !== 'undefined' && Array.isArray(products)) return products;
    } catch (e) {}
    return Array.isArray(window.products) ? window.products : [];
  }

  function catNames() {
    return (typeof categoryNames !== 'undefined' && categoryNames) ? categoryNames : {};
  }

  function stockState(p) {
    var sizes = Array.isArray(p.sizes) ? p.sizes : [];
    var oos = Array.isArray(p.outOfStock) ? p.outOfStock : [];
    if (!sizes.length) return 'out';
    var avail = sizes.filter(function (s) { return oos.indexOf(s) < 0; }).length;
    if (avail === 0) return 'out';
    if (avail <= 2) return 'low';
    return 'ok';
  }

  function uniqueCategories() {
    var seen = {};
    var list = [];
    productsList().forEach(function (p) {
      if (p.category && !seen[p.category]) {
        seen[p.category] = true;
        list.push(p.category);
      }
    });
    list.sort();
    return list;
  }

  function fillCategorySelect(sel, current) {
    if (!sel) return;
    var names = catNames();
    var html = '<option value="all">Todas las categorias</option>';
    uniqueCategories().forEach(function (c) {
      html += '<option value="' + c + '">' + (names[c] || c) + '</option>';
    });
    sel.innerHTML = html;
    try { sel.value = current || 'all'; } catch (e) {}
  }

  // ---------- PRODUCTOS ----------
  function ensureProductFilters() {
    var view = document.getElementById('view-products');
    if (!view) return;

    var search = document.getElementById('searchBox');
    if (search) {
      search.placeholder = 'Buscar nombre, codigo o categoria...';
      search.style.width = '280px';
      search.oninput = function () {
        try { if (typeof currentPage !== 'undefined') currentPage = 1; } catch (e) {}
        if (typeof renderTable === 'function') renderTable();
        updateProdFilterStatus();
      };
    }

    if (document.getElementById('khaosProdFilters')) {
      fillCategorySelect(document.getElementById('khaosProdCat'), prodCatFilter);
      return;
    }

    var toolbar = view.querySelector('.toolbar');
    var host = toolbar ? toolbar.parentNode : view;
    var row = document.createElement('div');
    row.id = 'khaosProdFilters';
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:0 16px 12px;';
    row.innerHTML =
      '<select id="khaosProdCat" class="form-select" style="max-width:220px;"></select>' +
      '<select id="khaosProdStock" class="form-select" style="max-width:180px;">' +
      '<option value="all">Todo el stock</option>' +
      '<option value="ok">Con stock</option>' +
      '<option value="low">Stock bajo</option>' +
      '<option value="out">Sin stock</option>' +
      '</select>' +
      '<span id="khaosProdFilterStatus" style="font-size:12px;color:var(--fog);margin-left:auto;"></span>';

    if (toolbar && toolbar.nextSibling) host.insertBefore(row, toolbar.nextSibling);
    else if (toolbar) toolbar.parentNode.appendChild(row);
    else host.insertBefore(row, host.firstChild);

    fillCategorySelect(document.getElementById('khaosProdCat'), prodCatFilter);

    document.getElementById('khaosProdCat').onchange = function () {
      prodCatFilter = this.value || 'all';
      try { if (typeof currentPage !== 'undefined') currentPage = 1; } catch (e) {}
      if (typeof renderTable === 'function') renderTable();
      updateProdFilterStatus();
    };
    document.getElementById('khaosProdStock').onchange = function () {
      prodStockFilter = this.value || 'all';
      try { if (typeof currentPage !== 'undefined') currentPage = 1; } catch (e) {}
      if (typeof renderTable === 'function') renderTable();
      updateProdFilterStatus();
    };
  }

  function updateProdFilterStatus() {
    var el = document.getElementById('khaosProdFilterStatus');
    if (!el) return;
    var total = productsList().length;
    var n = total;
    try {
      if (typeof getFilteredProducts === 'function') n = getFilteredProducts().length;
    } catch (e) {}
    el.textContent = n === total ? total + ' productos' : n + ' de ' + total + ' productos';
  }

  function patchGetFilteredProducts() {
    if (typeof getFilteredProducts !== 'function') return false;
    if (window.__khaosFilterPatched) return true;
    window.__khaosFilterPatched = true;
    origGetFiltered = getFilteredProducts;
    window.getFilteredProducts = function () {
      var result = origGetFiltered.apply(this, arguments);
      if (!Array.isArray(result)) result = [];

      if (prodCatFilter && prodCatFilter !== 'all') {
        result = result.filter(function (p) { return p.category === prodCatFilter; });
      }
      if (prodStockFilter && prodStockFilter !== 'all') {
        result = result.filter(function (p) { return stockState(p) === prodStockFilter; });
      }
      return result;
    };
    return true;
  }

  // ---------- INVENTARIO ----------
  function ensureInventoryFilters() {
    var view = document.getElementById('view-inventory');
    if (!view) return;

    if (document.getElementById('khaosInvFilters')) {
      fillCategorySelect(document.getElementById('khaosInvCat'), invCatFilter);
      return;
    }

    var card = view.querySelector('.card');
    var header = card ? card.querySelector('.card-header') : null;
    var row = document.createElement('div');
    row.id = 'khaosInvFilters';
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);';
    row.innerHTML =
      '<div class="input-group" style="display:flex;align-items:center;gap:8px;">' +
      '<i class="fas fa-search" style="opacity:0.6;"></i>' +
      '<input type="text" class="form-input" id="khaosInvSearch" placeholder="Buscar nombre o codigo..." style="width:240px;">' +
      '</div>' +
      '<select id="khaosInvCat" class="form-select" style="max-width:220px;"></select>' +
      '<select id="khaosInvStock" class="form-select" style="max-width:180px;">' +
      '<option value="all">Todo el stock</option>' +
      '<option value="ok">OK</option>' +
      '<option value="low">Stock bajo</option>' +
      '<option value="out">Sin stock</option>' +
      '</select>' +
      '<span id="khaosInvFilterStatus" style="font-size:12px;color:var(--fog);margin-left:auto;"></span>';

    if (header && header.nextSibling) {
      header.parentNode.insertBefore(row, header.nextSibling);
    } else if (card) {
      card.insertBefore(row, card.firstChild);
    } else {
      view.insertBefore(row, view.firstChild);
    }

    fillCategorySelect(document.getElementById('khaosInvCat'), invCatFilter);

    document.getElementById('khaosInvSearch').oninput = function () {
      invSearch = (this.value || '').toLowerCase().trim();
      if (typeof renderInventory === 'function') renderInventory();
    };
    document.getElementById('khaosInvCat').onchange = function () {
      invCatFilter = this.value || 'all';
      if (typeof renderInventory === 'function') renderInventory();
    };
    document.getElementById('khaosInvStock').onchange = function () {
      invStockFilter = this.value || 'all';
      if (typeof renderInventory === 'function') renderInventory();
    };
  }

  function patchRenderInventory() {
    if (typeof window.renderInventory !== 'function' || window.__khaosInvPatched) return false;
    window.__khaosInvPatched = true;
    var orig = window.renderInventory;

    window.renderInventory = function () {
      ensureInventoryFilters();

      var list = productsList().map(function (p) {
        if (!Array.isArray(p.sizes)) p.sizes = [];
        if (!Array.isArray(p.outOfStock)) p.outOfStock = [];
        return p;
      });

      var filtered = list.filter(function (p) {
        if (invCatFilter && invCatFilter !== 'all' && p.category !== invCatFilter) return false;
        if (invStockFilter && invStockFilter !== 'all' && stockState(p) !== invStockFilter) return false;
        if (invSearch) {
          var name = String(p.name || '').toLowerCase();
          var code = String(p.code || '').toLowerCase();
          var cat = String((catNames()[p.category] || p.category || '')).toLowerCase();
          if (name.indexOf(invSearch) < 0 && code.indexOf(invSearch) < 0 && cat.indexOf(invSearch) < 0) return false;
        }
        return true;
      });

      var alerts = document.getElementById('inventoryAlerts');
      var tbody = document.getElementById('inventoryTableBody');
      var statusEl = document.getElementById('khaosInvFilterStatus');

      if (statusEl) {
        statusEl.textContent = filtered.length === list.length
          ? list.length + ' productos'
          : filtered.length + ' de ' + list.length + ' productos';
      }

      if (alerts) {
        var lowStock = filtered.filter(function (p) {
          return stockState(p) === 'low' || stockState(p) === 'out';
        });
        alerts.innerHTML = lowStock.map(function (p) {
          var avail = p.sizes.filter(function (s) { return p.outOfStock.indexOf(s) < 0; }).length;
          return '<div class="inventory-alert"><i class="fas fa-exclamation-triangle"></i>' +
            '<p>Stock bajo: ' + (p.name || '') + ' (' + avail + ' tallas)</p>' +
            '<button onclick="editProduct(' + p.id + ')">Gestionar</button></div>';
        }).join('');
        if (!lowStock.length) alerts.innerHTML = '';
      }

      if (!tbody) return;

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><h3>Sin resultados</h3><p>Prueba otro filtro o busqueda</p></div></td></tr>';
        return;
      }

      var names = catNames();
      tbody.innerHTML = filtered.map(function (p) {
        var available = p.sizes.filter(function (s) { return p.outOfStock.indexOf(s) < 0; });
        var out = p.outOfStock;
        var st = stockState(p);
        var status = st === 'out'
          ? '<span class="badge badge-red">Sin stock</span>'
          : st === 'low'
            ? '<span class="badge badge-orange">Stock bajo</span>'
            : '<span class="badge badge-green">OK</span>';
        var meta = { groupLabel: '', familyLabel: '' };
        try {
          if (typeof getCategoryMeta === 'function') meta = getCategoryMeta(p.category) || meta;
        } catch (e) {}
        return '<tr>' +
          '<td><div class="product-cell"><img class="product-thumb" src="' + (p.image || '') + '" onerror="this.style.opacity=\'0.3\'">' +
          '<div class="product-cell-info"><div class="product-cell-name">' + (p.name || '') + '</div>' +
          '<div class="product-cell-code">' + (p.code || '') + '</div></div></div></td>' +
          '<td><div style="display:flex;flex-direction:column;gap:2px;">' +
          '<span style="font-size:12px;font-weight:700;color:var(--ivory);">' + (names[p.category] || p.category || '') + '</span>' +
          '<span style="font-size:10px;color:var(--fog);">' + (meta.groupLabel || '') + ' > ' + (meta.familyLabel || '') + '</span></div></td>' +
          '<td><div class="size-pills">' + available.map(function (s) {
            return '<span class="size-pill available">' + s + '</span>';
          }).join('') + '</div></td>' +
          '<td><div class="size-pills">' + out.map(function (s) {
            return '<span class="size-pill out">' + s + '</span>';
          }).join('') + '</div></td>' +
          '<td>' + status + '</td></tr>';
      }).join('');
    };

    return true;
  }

  function boot() {
    ensureProductFilters();
    patchGetFilteredProducts();
    ensureInventoryFilters();
    patchRenderInventory();
    updateProdFilterStatus();
    try {
      if (typeof renderTable === 'function') renderTable();
    } catch (e) {}
    try {
      if (typeof renderInventory === 'function') renderInventory();
    } catch (e) {}
  }

  // Reaplicar al cambiar de vista
  if (typeof window.switchView === 'function' && !window.__khaosFilterSwitchPatched) {
    window.__khaosFilterSwitchPatched = true;
    var _sv = window.switchView;
    window.switchView = function (view, el) {
      var r = _sv.apply(this, arguments);
      setTimeout(function () {
        if (view === 'products') {
          ensureProductFilters();
          patchGetFilteredProducts();
          updateProdFilterStatus();
        }
        if (view === 'inventory') {
          ensureInventoryFilters();
          patchRenderInventory();
          if (typeof renderInventory === 'function') renderInventory();
        }
      }, 50);
      return r;
    };
  }

  var tries = 0;
  (function wait() {
    if ((typeof getFilteredProducts === 'function' && typeof renderInventory === 'function') || tries > 40) {
      boot();
      setInterval(function () {
        ensureProductFilters();
        ensureInventoryFilters();
        patchGetFilteredProducts();
        patchRenderInventory();
      }, 2000);
      return;
    }
    tries++;
    setTimeout(wait, 250);
  })();

  console.log('[Khaos] filtros productos/inventario listos');
})();
