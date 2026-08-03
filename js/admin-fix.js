/**
 * admin-fix.js — Parches sobre el admin estable (CDN)
 * Corrige: updateCouponStats (null DOM), renderTable (precios/tallas),
 * y contadores que quedaban en 0.
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

  // --- formatPrice seguro ---
  window.formatPrice = function (n) {
    n = Number(n);
    if (isNaN(n)) n = 0;
    return '$' + n.toLocaleString('es-CO');
  };

  // --- updateCouponStats null-safe ---
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

  // --- renderTable seguro (precios + tallas) ---
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
        var moreSizes = sizes.length > 6
          ? '<span class="size-pill available">+' + (sizes.length - 6) + '</span>'
          : '';

        var badgeHtml = (p.badge && badgeConfig[p.badge])
          ? '<span class="badge" style="background:' + badgeConfig[p.badge].bg + ';color:' + badgeConfig[p.badge].color + ';border-color:' + badgeConfig[p.badge].border + ';"><i class="fas ' + badgeConfig[p.badge].icon + '"></i> ' + badgeConfig[p.badge].label + '</span>'
          : '<span class="badge badge-gray">Normal</span>';

        var isSelected = selected && typeof selected.has === 'function' && selected.has(p.id);
        var meta = typeof getCategoryMeta === 'function'
          ? getCategoryMeta(p.category)
          : { groupLabel: '', familyLabel: '' };
        var catColor = categoryColors[p.category] || '#D4AF37';
        var catLabel = categoryNames[p.category] || p.category || '';

        var oldPriceHtml = oldPrice
          ? '<div style="font-size:11px;color:var(--fog);text-decoration:line-through;">$' + oldPrice.toLocaleString('es-CO') + '</div>'
          : '';

        return '<tr class="' + (isSelected ? 'selected' : '') + '">' +
          '<td data-label="Seleccionar"><div class="checkbox ' + (isSelected ? 'checked' : '') + '" onclick="toggleSelect(' + p.id + ', event)">' +
          (isSelected ? '<i class="fas fa-check"></i>' : '') + '</div></td>' +
          '<td data-label="Producto"><div class="product-cell">' +
          '<img class="product-thumb" src="' + (p.image || '') + '" onerror="this.style.opacity=\'0.3\'">' +
          '<div class="product-cell-info"><div class="product-cell-name">' + (p.name || '') + '</div>' +
          '<div class="product-cell-code">' + (p.code || '') + '</div></div></div></td>' +
          '<td data-label="Categoría"><div style="display:flex;flex-direction:column;gap:2px;">' +
          '<span class="badge" style="background:' + catColor + '15;color:' + catColor + ';border-color:' + catColor + '30;font-size:11px;padding:3px 10px;">' + catLabel + '</span>' +
          '<span style="font-size:10px;color:var(--fog);">' + (meta.groupLabel || '') + ' > ' + (meta.familyLabel || '') + '</span></div></td>' +
          '<td data-label="Precio"><div style="font-weight:900;color:var(--gold-light);font-size:15px;">$' + price.toLocaleString('es-CO') + '</div>' + oldPriceHtml + '</td>' +
          '<td data-label="Tallas"><div class="size-pills">' + sizesHtml + moreSizes + '</div></td>' +
          '<td data-label="Estado">' + badgeHtml + '</td>' +
          '<td data-label="Acciones"><div class="action-btns">' +
          '<button class="action-btn view" onclick="viewProduct(' + p.id + ')" title="Ver"><i class="fas fa-eye"></i></button>' +
          '<button class="action-btn edit" onclick="editProduct(' + p.id + ')" title="Editar"><i class="fas fa-pen"></i></button>' +
          '<button class="action-btn delete" onclick="deleteProduct(' + p.id + ')" title="Eliminar"><i class="fas fa-trash"></i></button>' +
          '</div></td></tr>';
      }).join('');
    } catch (e) {
      console.error('[Khaos] renderTable fix:', e);
      if (typeof _origRenderTable === 'function') {
        try { return _origRenderTable.apply(this, arguments); } catch (e2) {}
      }
    }
  };

  // --- updateAllStats: re-ejecutar contadores de forma segura ---
  var _origUpdateAllStats = window.updateAllStats;
  window.updateAllStats = function () {
    try {
      if (typeof _origUpdateAllStats === 'function') {
        try { _origUpdateAllStats.apply(this, arguments); } catch (e) {
          console.warn('[Khaos] updateAllStats original:', e.message);
        }
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
      var adulto = prods.length - nino;
      setText('sidebarAdultoCount', adulto);
      setText('sidebarNinoCount', nino);
    } catch (e) {
      console.warn('[Khaos] updateAllStats fix:', e.message);
    }
  };

  setTimeout(function () {
    try {
      if (Array.isArray(window.products) && window.products.length) {
        if (typeof window.renderTable === 'function') window.renderTable();
        if (typeof window.updateAllStats === 'function') window.updateAllStats();
        if (typeof window.updateDashboard === 'function') window.updateDashboard();
      }
    } catch (e) {}
  }, 300);

  console.log('[Khaos] admin-fix.js aplicado');
})();
