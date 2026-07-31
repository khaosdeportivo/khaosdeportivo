/**
 * Khaos Deportivo — Módulo de operaciones (punto 6)
 *
 * - Precio de costo por producto
 * - Margen bruto ($) y (%)
 * - Alertas de margen bajo
 * - Valor de inventario a costo
 * - Stats en dashboard
 *
 * Cargar DESPUÉS de admin.js y admin-categories.js
 */

(function () {
  // Umbral de alerta: margen % por debajo de esto se considera bajo
  var MARGIN_ALERT_PCT = 25;
  // Umbral "saludable"
  var MARGIN_GOOD_PCT = 40;

  function getCost(p) {
    var c = Number(p.costPrice);
    return isNaN(c) || c < 0 ? 0 : c;
  }

  function getMargin(p) {
    var cost = getCost(p);
    var price = Number(p.price) || 0;
    if (price <= 0) return { amount: 0, pct: 0, hasCost: cost > 0 };
    if (cost <= 0) return { amount: 0, pct: 0, hasCost: false };
    var amount = price - cost;
    var pct = Math.round((amount / price) * 1000) / 10; // 1 decimal
    return { amount: amount, pct: pct, hasCost: true };
  }

  function marginBadgeHtml(p) {
    var m = getMargin(p);
    if (!m.hasCost) {
      return '<span class="badge badge-gray" title="Sin costo registrado">Sin costo</span>';
    }
    var color, bg, border, label;
    if (m.pct < MARGIN_ALERT_PCT) {
      color = '#ef4444';
      bg = 'rgba(239,68,68,0.12)';
      border = 'rgba(239,68,68,0.3)';
      label = m.pct + '% ⚠';
    } else if (m.pct < MARGIN_GOOD_PCT) {
      color = '#f59e0b';
      bg = 'rgba(245,158,11,0.12)';
      border = 'rgba(245,158,11,0.3)';
      label = m.pct + '%';
    } else {
      color = '#22c55e';
      bg = 'rgba(34,197,94,0.12)';
      border = 'rgba(34,197,94,0.3)';
      label = m.pct + '%';
    }
    return '<span class="badge" style="background:' + bg + ';color:' + color + ';border-color:' + border + ';" title="Margen: $' +
      m.amount.toLocaleString('es-CO') + ' (' + m.pct + '%)">' + label + '</span>';
  }

  // ===== Inyectar campo de costo en modal de producto =====
  function ensureCostField() {
    if (document.getElementById('prodCostPrice')) return;

    var priceInput = document.getElementById('prodPrice');
    if (!priceInput) return;
    var row = priceInput.closest('.form-row');
    if (!row) return;

    // Crear grupo de costo
    var group = document.createElement('div');
    group.className = 'form-group';
    group.innerHTML =
      '<label>Costo <span style="color:var(--fog);font-weight:500;">(interno)</span></label>' +
      '<input type="number" class="form-input" id="prodCostPrice" min="0" step="1000" placeholder="0">' +
      '<div id="prodMarginPreview" style="font-size:11px;margin-top:6px;color:var(--fog);"></div>';

    // Si la fila es three-column, añadir el costo ahí; si no, nueva fila
    if (row.classList.contains('three') || row.children.length >= 3) {
      // Insertar después del precio
      if (priceInput.parentElement && priceInput.parentElement.nextSibling) {
        row.insertBefore(group, priceInput.parentElement.nextSibling);
      } else {
        row.appendChild(group);
      }
    } else {
      row.appendChild(group);
    }

    // Preview de margen al escribir
    function updateMarginPreview() {
      var price = parseInt(document.getElementById('prodPrice').value) || 0;
      var cost = parseInt(document.getElementById('prodCostPrice').value) || 0;
      var el = document.getElementById('prodMarginPreview');
      if (!el) return;
      if (price <= 0 || cost <= 0) {
        el.textContent = cost <= 0 ? 'Ingresa el costo para ver el margen' : '';
        el.style.color = 'var(--fog)';
        return;
      }
      var amount = price - cost;
      var pct = Math.round((amount / price) * 1000) / 10;
      var color = pct < MARGIN_ALERT_PCT ? '#ef4444' : pct < MARGIN_GOOD_PCT ? '#f59e0b' : '#22c55e';
      el.style.color = color;
      el.textContent = 'Margen: $' + amount.toLocaleString('es-CO') + ' (' + pct + '%)' +
        (pct < MARGIN_ALERT_PCT ? ' — bajo' : pct >= MARGIN_GOOD_PCT ? ' — saludable' : '');
    }

    document.getElementById('prodPrice').addEventListener('input', updateMarginPreview);
    document.getElementById('prodCostPrice').addEventListener('input', updateMarginPreview);
  }

  // ===== Patch openProductModal =====
  var _openProductModal = window.openProductModal;
  window.openProductModal = function () {
    ensureCostField();
    if (_openProductModal) _openProductModal();
    var costEl = document.getElementById('prodCostPrice');
    if (costEl) costEl.value = '';
    var prev = document.getElementById('prodMarginPreview');
    if (prev) prev.textContent = '';
  };

  // ===== Patch editProduct =====
  var _editProduct = window.editProduct;
  window.editProduct = function (id) {
    ensureCostField();
    if (_editProduct) _editProduct(id);
    var p = products.find(function (x) { return x.id === id; });
    var costEl = document.getElementById('prodCostPrice');
    if (costEl && p) {
      costEl.value = p.costPrice > 0 ? p.costPrice : '';
      // disparar preview
      costEl.dispatchEvent(new Event('input'));
    }
  };

  // ===== Patch saveProduct para persistir costPrice =====
  var _saveProduct = window.saveProduct;
  window.saveProduct = function () {
    ensureCostField();
    var costEl = document.getElementById('prodCostPrice');
    var costPrice = costEl ? (parseInt(costEl.value) || 0) : 0;
    var editId = document.getElementById('editId').value;
    var name = document.getElementById('prodName').value.trim();

    if (_saveProduct) _saveProduct();

    // Enriquecer el producto recién guardado con costPrice
    if (name && typeof products !== 'undefined') {
      var p = null;
      if (editId) {
        p = products.find(function (x) { return x.id == editId; });
      } else {
        // último creado con ese nombre
        for (var i = products.length - 1; i >= 0; i--) {
          if (products[i].name === name) { p = products[i]; break; }
        }
      }
      if (p) {
        p.costPrice = costPrice;
        if (typeof saveProducts === 'function') saveProducts();
      }
    }
  };

  // ===== Stats de operaciones =====
  function computeOpsStats() {
    var withCost = products.filter(function (p) { return getCost(p) > 0; });
    var totalValueSale = products.reduce(function (s, p) { return s + (p.price || 0); }, 0);
    var totalValueCost = withCost.reduce(function (s, p) { return s + getCost(p); }, 0);
    // Valor inventario aproximado: costo * tallas disponibles
    var inventoryCost = 0;
    var inventorySale = 0;
    products.forEach(function (p) {
      var units = (p.sizes || []).filter(function (s) {
        return !(p.outOfStock || []).includes(s);
      }).length;
      // Cada talla = 1 unidad representativa (no stock real por talla)
      inventorySale += (p.price || 0) * units;
      if (getCost(p) > 0) inventoryCost += getCost(p) * units;
    });

    var margins = withCost.map(getMargin);
    var avgPct = margins.length
      ? Math.round(margins.reduce(function (s, m) { return s + m.pct; }, 0) / margins.length * 10) / 10
      : 0;
    var lowMargin = withCost.filter(function (p) { return getMargin(p).pct < MARGIN_ALERT_PCT; });
    var noCost = products.filter(function (p) { return getCost(p) <= 0; });

    return {
      withCost: withCost.length,
      noCost: noCost.length,
      avgPct: avgPct,
      lowMargin: lowMargin,
      inventoryCost: inventoryCost,
      inventorySale: inventorySale,
      potentialProfit: inventorySale - inventoryCost
    };
  }

  function renderOpsAlerts() {
    var stats = computeOpsStats();
    var container = document.getElementById('opsAlerts');
    if (!container) return;

    var html = '';

    if (stats.noCost > 0) {
      html += '<div class="inventory-alert" style="border-left:3px solid #f59e0b;">' +
        '<i class="fas fa-dollar-sign" style="color:#f59e0b;"></i>' +
        '<p><strong>' + stats.noCost + '</strong> producto(s) sin costo registrado. ' +
        'Edítalos para ver márgenes reales.</p></div>';
    }

    if (stats.lowMargin.length > 0) {
      var names = stats.lowMargin.slice(0, 3).map(function (p) {
        return p.name + ' (' + getMargin(p).pct + '%)';
      }).join(', ');
      var more = stats.lowMargin.length > 3 ? ' +' + (stats.lowMargin.length - 3) : '';
      html += '<div class="inventory-alert" style="border-left:3px solid #ef4444;">' +
        '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i>' +
        '<p><strong>Margen bajo (<' + MARGIN_ALERT_PCT + '%):</strong> ' +
        names + more + '</p></div>';
    }

    if (!html) {
      html = '<div class="inventory-alert" style="border-left:3px solid #22c55e;">' +
        '<i class="fas fa-check-circle" style="color:#22c55e;"></i>' +
        '<p>Márgenes en rango saludable. Promedio: <strong>' + stats.avgPct + '%</strong></p></div>';
    }

    container.innerHTML = html;
  }

  function renderOpsDashboard() {
    var stats = computeOpsStats();

    var set = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('opsAvgMargin', stats.avgPct + '%');
    set('opsWithCost', stats.withCost + '/' + products.length);
    set('opsInventoryCost', '$' + stats.inventoryCost.toLocaleString('es-CO'));
    set('opsPotentialProfit', '$' + Math.max(0, stats.potentialProfit).toLocaleString('es-CO'));
    set('opsLowMargin', String(stats.lowMargin.length));

    renderOpsAlerts();
  }

  // ===== Inyectar bloque de stats en dashboard =====
  function ensureOpsDashboardUI() {
    if (document.getElementById('opsStatsGrid')) return;

    var dash = document.getElementById('view-dashboard');
    if (!dash) return;

    var block = document.createElement('div');
    block.id = 'opsSection';
    block.innerHTML =
      '<div class="card" style="margin-bottom:24px;">' +
        '<div class="card-header"><h3><i class="fas fa-chart-line"></i> Operaciones & Rentabilidad</h3></div>' +
        '<div class="card-body" style="padding:16px 20px;">' +
          '<div class="stats-grid" id="opsStatsGrid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:16px;">' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;" id="opsAvgMargin">—</div><div class="stat-card-label" style="font-size:11px;">Margen promedio</div></div>' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;" id="opsWithCost">0</div><div class="stat-card-label" style="font-size:11px;">Con costo / total</div></div>' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;" id="opsInventoryCost">$0</div><div class="stat-card-label" style="font-size:11px;">Inventario a costo*</div></div>' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;" id="opsPotentialProfit">$0</div><div class="stat-card-label" style="font-size:11px;">Utilidad potencial*</div></div>' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;color:#ef4444;" id="opsLowMargin">0</div><div class="stat-card-label" style="font-size:11px;">Margen bajo</div></div>' +
          '</div>' +
          '<div id="opsAlerts"></div>' +
          '<p style="font-size:11px;color:var(--fog);margin:8px 0 0;">* Estimado: costo/precio × tallas disponibles (1 unidad por talla). No es stock real por cantidad.</p>' +
        '</div>' +
      '</div>';

    // Insertar después de los stats-grid del dashboard
    var firstCard = dash.querySelector('.chart-grid, .card');
    if (firstCard) {
      dash.insertBefore(block, firstCard);
    } else {
      dash.appendChild(block);
    }
  }

  // ===== Columna margen en tabla de productos (via patch renderTable) =====
  var _renderTable = window.renderTable;
  window.renderTable = function () {
    if (_renderTable) _renderTable();

    // Añadir badge de margen junto al precio en cada fila
    try {
      var tbody = document.getElementById('productsTableBody');
      if (!tbody) return;
      var rows = tbody.querySelectorAll('tr');
      rows.forEach(function (tr) {
        // Evitar re-inyectar
        if (tr.querySelector('.ops-margin-badge')) return;
        // Buscar producto por código en la celda
        var codeEl = tr.querySelector('.product-cell-code');
        if (!codeEl) return;
        var code = codeEl.textContent.trim();
        var p = products.find(function (x) { return x.code === code; });
        if (!p) return;
        var priceCell = tr.querySelector('td[data-label="Precio"]');
        if (!priceCell) return;
        var badge = document.createElement('div');
        badge.className = 'ops-margin-badge';
        badge.style.marginTop = '4px';
        badge.innerHTML = marginBadgeHtml(p);
        priceCell.appendChild(badge);
      });
    } catch (e) {}
  };

  // ===== Patch updateAllStats =====
  var _updateAllStats = window.updateAllStats;
  window.updateAllStats = function () {
    if (_updateAllStats) _updateAllStats();
    try {
      ensureOpsDashboardUI();
      renderOpsDashboard();
    } catch (e) {}
  };

  // ===== Export: incluir costPrice en CSV si se puede =====
  var _exportCSV = window.exportCSV;
  window.exportCSV = function () {
    if (typeof products === 'undefined' || !products.length) {
      if (_exportCSV) return _exportCSV();
      return;
    }
    var headers = ['ID', 'Nombre', 'Código', 'Categoría', 'Precio', 'Costo', 'Margen%', 'Precio Anterior', 'Tallas', 'Agotadas', 'Badge', 'Descripción', 'Imagen'];
    var rows = products.map(function (p) {
      var m = getMargin(p);
      return [
        p.id,
        '"' + (p.name || '').replace(/"/g, '""') + '"',
        p.code || '',
        p.category || '',
        p.price || 0,
        getCost(p),
        m.hasCost ? m.pct : '',
        p.oldPrice || '',
        (p.sizes || []).join(';'),
        (p.outOfStock || []).join(';'),
        p.badge || '',
        '"' + (p.desc || '').replace(/"/g, '""') + '"',
        p.image || ''
      ];
    });
    var csv = [headers.join(','), rows.map(function (r) { return r.join(','); }).join('\n')].join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'khaos-productos-ops.csv';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('CSV exportado (con costos y márgenes)', 'success');
  };

  // Init
  function initOps() {
    ensureCostField();
    ensureOpsDashboardUI();
    renderOpsDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initOps, 800);
    });
  } else {
    setTimeout(initOps, 800);
  }

  console.log('✅ Módulo de operaciones (costo/margen) cargado');
})();
