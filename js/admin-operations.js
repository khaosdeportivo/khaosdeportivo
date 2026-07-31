/**
 * Khaos Deportivo — Operaciones para INTERMEDIARIO
 *
 * Modelo: compras bajo pedido del cliente (no bodega propia).
 * - Precio de compra (costo) por producto
 * - Margen bruto al vender
 * - Vista de referencia: imagen + tallas ofrecidas + compra/venta
 * - SIN valor en stock / inventario físico
 *
 * Cargar DESPUÉS de admin.js y admin-categories.js
 */

(function () {
  var MARGIN_ALERT_PCT = 25;
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
    var pct = Math.round((amount / price) * 1000) / 10;
    return { amount: amount, pct: pct, hasCost: true };
  }

  function marginBadgeHtml(p) {
    var m = getMargin(p);
    if (!m.hasCost) {
      return '<span class="badge badge-gray" title="Sin precio de compra">Sin costo</span>';
    }
    var color, bg, border, label;
    if (m.pct < MARGIN_ALERT_PCT) {
      color = '#ef4444'; bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.3)';
      label = m.pct + '% ⚠';
    } else if (m.pct < MARGIN_GOOD_PCT) {
      color = '#f59e0b'; bg = 'rgba(245,158,11,0.12)'; border = 'rgba(245,158,11,0.3)';
      label = m.pct + '%';
    } else {
      color = '#22c55e'; bg = 'rgba(34,197,94,0.12)'; border = 'rgba(34,197,94,0.3)';
      label = m.pct + '%';
    }
    return '<span class="badge" style="background:' + bg + ';color:' + color + ';border-color:' + border + ';" title="Ganancia: $' +
      m.amount.toLocaleString('es-CO') + ' (' + m.pct + '%)">' + label + '</span>';
  }

  function sizesHtml(p) {
    var sizes = p.sizes || [];
    var out = p.outOfStock || [];
    if (!sizes.length) return '<span style="color:var(--fog);font-size:12px;">Sin tallas</span>';
    return sizes.map(function (s) {
      var isOut = out.indexOf(s) >= 0;
      return '<span class="size-pill ' + (isOut ? 'out' : 'available') + '" title="' +
        (isOut ? 'No disponible' : 'Disponible para pedir') + '">' + s + '</span>';
    }).join('');
  }

  // ===== Campo costo en modal =====
  function ensureCostField() {
    if (document.getElementById('prodCostPrice')) return;
    var priceInput = document.getElementById('prodPrice');
    if (!priceInput) return;
    var row = priceInput.closest('.form-row');
    if (!row) return;

    var group = document.createElement('div');
    group.className = 'form-group';
    group.innerHTML =
      '<label>Precio de compra <span style="color:var(--fog);font-weight:500;">(lo que te cuesta)</span></label>' +
      '<input type="number" class="form-input" id="prodCostPrice" min="0" step="1000" placeholder="0">' +
      '<div id="prodMarginPreview" style="font-size:11px;margin-top:6px;color:var(--fog);"></div>';

    if (priceInput.parentElement && priceInput.parentElement.nextSibling) {
      row.insertBefore(group, priceInput.parentElement.nextSibling);
    } else {
      row.appendChild(group);
    }

    function updateMarginPreview() {
      var price = parseInt(document.getElementById('prodPrice').value) || 0;
      var cost = parseInt(document.getElementById('prodCostPrice').value) || 0;
      var el = document.getElementById('prodMarginPreview');
      if (!el) return;
      if (price <= 0 || cost <= 0) {
        el.textContent = cost <= 0 ? 'Ingresa lo que te cuesta pedir este par' : '';
        el.style.color = 'var(--fog)';
        return;
      }
      var amount = price - cost;
      var pct = Math.round((amount / price) * 1000) / 10;
      var color = pct < MARGIN_ALERT_PCT ? '#ef4444' : pct < MARGIN_GOOD_PCT ? '#f59e0b' : '#22c55e';
      el.style.color = color;
      el.textContent = 'Tu ganancia: $' + amount.toLocaleString('es-CO') + ' (' + pct + '%)' +
        (pct < MARGIN_ALERT_PCT ? ' — bajo' : pct >= MARGIN_GOOD_PCT ? ' — bien' : '');
    }

    document.getElementById('prodPrice').addEventListener('input', updateMarginPreview);
    document.getElementById('prodCostPrice').addEventListener('input', updateMarginPreview);
  }

  var _openProductModal = window.openProductModal;
  window.openProductModal = function () {
    ensureCostField();
    if (_openProductModal) _openProductModal();
    var costEl = document.getElementById('prodCostPrice');
    if (costEl) costEl.value = '';
    var prev = document.getElementById('prodMarginPreview');
    if (prev) prev.textContent = '';
  };

  var _editProduct = window.editProduct;
  window.editProduct = function (id) {
    ensureCostField();
    if (_editProduct) _editProduct(id);
    var p = products.find(function (x) { return x.id === id; });
    var costEl = document.getElementById('prodCostPrice');
    if (costEl && p) {
      costEl.value = p.costPrice > 0 ? p.costPrice : '';
      costEl.dispatchEvent(new Event('input'));
    }
  };

  var _saveProduct = window.saveProduct;
  window.saveProduct = function () {
    ensureCostField();
    var costEl = document.getElementById('prodCostPrice');
    var costPrice = costEl ? (parseInt(costEl.value) || 0) : 0;
    var editId = document.getElementById('editId').value;
    var name = document.getElementById('prodName').value.trim();

    if (_saveProduct) _saveProduct();

    if (name && typeof products !== 'undefined') {
      var p = null;
      if (editId) {
        p = products.find(function (x) { return x.id == editId; });
      } else {
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

  // ===== Stats (sin inventario físico) =====
  function computeOpsStats() {
    var withCost = products.filter(function (p) { return getCost(p) > 0; });
    var margins = withCost.map(getMargin);
    var avgPct = margins.length
      ? Math.round(margins.reduce(function (s, m) { return s + m.pct; }, 0) / margins.length * 10) / 10
      : 0;
    var avgGain = margins.length
      ? Math.round(margins.reduce(function (s, m) { return s + m.amount; }, 0) / margins.length)
      : 0;
    var lowMargin = withCost.filter(function (p) { return getMargin(p).pct < MARGIN_ALERT_PCT; });
    var noCost = products.filter(function (p) { return getCost(p) <= 0; });

    return {
      withCost: withCost.length,
      noCost: noCost.length,
      avgPct: avgPct,
      avgGain: avgGain,
      lowMargin: lowMargin,
      totalProducts: products.length
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
        '<p><strong>' + stats.noCost + '</strong> sin precio de compra. ' +
        'Regístralo para saber cuánto ganas por venta.</p></div>';
    }
    if (stats.lowMargin.length > 0) {
      var names = stats.lowMargin.slice(0, 3).map(function (p) {
        return p.name + ' (' + getMargin(p).pct + '%)';
      }).join(', ');
      var more = stats.lowMargin.length > 3 ? ' +' + (stats.lowMargin.length - 3) : '';
      html += '<div class="inventory-alert" style="border-left:3px solid #ef4444;">' +
        '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i>' +
        '<p><strong>Margen bajo (<' + MARGIN_ALERT_PCT + '%):</strong> ' + names + more + '</p></div>';
    }
    if (!html) {
      html = '<div class="inventory-alert" style="border-left:3px solid #22c55e;">' +
        '<i class="fas fa-check-circle" style="color:#22c55e;"></i>' +
        '<p>Márgenes en buen rango. Promedio: <strong>' + stats.avgPct + '%</strong> ' +
        '(≈ $' + stats.avgGain.toLocaleString('es-CO') + ' por venta)</p></div>';
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
    set('opsAvgGain', stats.avgGain > 0 ? '$' + stats.avgGain.toLocaleString('es-CO') : '—');
    set('opsWithCost', stats.withCost + '/' + stats.totalProducts);
    set('opsLowMargin', String(stats.lowMargin.length));
    renderOpsAlerts();
  }

  function ensureOpsDashboardUI() {
    if (document.getElementById('opsStatsGrid')) return;
    var dash = document.getElementById('view-dashboard');
    if (!dash) return;

    var block = document.createElement('div');
    block.id = 'opsSection';
    block.innerHTML =
      '<div class="card" style="margin-bottom:24px;">' +
        '<div class="card-header"><h3><i class="fas fa-handshake"></i> Operaciones (intermediario)</h3></div>' +
        '<div class="card-body" style="padding:16px 20px;">' +
          '<p style="font-size:12px;color:var(--fog);margin:0 0 14px;">' +
            'Compras bajo pedido del cliente. Aquí ves margen por referencia, no inventario físico.' +
          '</p>' +
          '<div class="stats-grid" id="opsStatsGrid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:16px;">' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;" id="opsAvgMargin">—</div><div class="stat-card-label" style="font-size:11px;">Margen promedio</div></div>' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;" id="opsAvgGain">—</div><div class="stat-card-label" style="font-size:11px;">Ganancia prom. / venta</div></div>' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;" id="opsWithCost">0</div><div class="stat-card-label" style="font-size:11px;">Con precio de compra</div></div>' +
            '<div class="stat-card" style="padding:14px;"><div class="stat-card-value" style="font-size:22px;color:#ef4444;" id="opsLowMargin">0</div><div class="stat-card-label" style="font-size:11px;">Margen bajo</div></div>' +
          '</div>' +
          '<div id="opsAlerts"></div>' +
        '</div>' +
      '</div>';

    var firstCard = dash.querySelector('.chart-grid, .card');
    if (firstCard) dash.insertBefore(block, firstCard);
    else dash.appendChild(block);
  }

  // ===== Vista Inventario → Catálogo de referencia =====
  function renderReferenceCatalog() {
    var tbody = document.getElementById('inventoryTableBody');
    var alerts = document.getElementById('inventoryAlerts');
    if (!tbody) return;

    // Header contextual
    if (alerts) {
      var noCost = products.filter(function (p) { return getCost(p) <= 0; }).length;
      alerts.innerHTML =
        '<div style="padding:12px 16px;margin-bottom:12px;border-radius:10px;background:var(--ink);border:1px solid var(--stone);">' +
          '<div style="font-weight:700;margin-bottom:4px;"><i class="fas fa-book-open" style="color:var(--gold);margin-right:8px;"></i>Catálogo de referencia</div>' +
          '<p style="font-size:12px;color:var(--fog);margin:0;">' +
            'Imagen, tallas que puedes ofrecer, precio de compra y de venta. ' +
            'No es stock físico: pedimos al proveedor según el cliente.' +
            (noCost ? ' <strong style="color:#f59e0b;">' + noCost + ' sin costo.</strong>' : '') +
          '</p>' +
        '</div>';
    }

    // Cambiar encabezados de la tabla si existen
    var thead = tbody.closest('table');
    if (thead) {
      var thRow = thead.querySelector('thead tr');
      if (thRow && !thRow.dataset.opsRef) {
        thRow.dataset.opsRef = '1';
        thRow.innerHTML =
          '<th>Producto</th>' +
          '<th>Categoría</th>' +
          '<th>Tallas (ofrecidas)</th>' +
          '<th>Compra</th>' +
          '<th>Venta</th>' +
          '<th>Margen</th>';
      }
    }

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state" style="padding:40px;"><h3>Sin productos</h3></div></td></tr>';
      return;
    }

    tbody.innerHTML = products.map(function (p) {
      var m = getMargin(p);
      var cost = getCost(p);
      var catName = (typeof categoryNames !== 'undefined' && categoryNames[p.category])
        ? categoryNames[p.category] : p.category;
      var costHtml = cost > 0
        ? '<span style="font-weight:800;color:var(--ivory);">$' + cost.toLocaleString('es-CO') + '</span>'
        : '<span style="color:var(--fog);font-size:12px;">—</span>';
      var marginHtml = marginBadgeHtml(p);
      if (m.hasCost) {
        marginHtml += '<div style="font-size:11px;color:var(--fog);margin-top:4px;">+$' +
          m.amount.toLocaleString('es-CO') + '</div>';
      }

      return '<tr>' +
        '<td data-label="Producto"><div class="product-cell">' +
          '<img class="product-thumb" src="' + (p.image || '') + '" onerror="this.style.opacity=\'0.3\'" alt="">' +
          '<div class="product-cell-info">' +
            '<div class="product-cell-name">' + (p.name || '') + '</div>' +
            '<div class="product-cell-code">' + (p.code || '') + '</div>' +
          '</div></div></td>' +
        '<td data-label="Categoría" style="font-size:12px;">' + catName + '</td>' +
        '<td data-label="Tallas"><div class="size-pills">' + sizesHtml(p) + '</div></td>' +
        '<td data-label="Compra">' + costHtml + '</td>' +
        '<td data-label="Venta" style="font-weight:900;color:var(--gold-light);">$' +
          (p.price || 0).toLocaleString('es-CO') + '</td>' +
        '<td data-label="Margen">' + marginHtml + '</td>' +
        '</tr>';
    }).join('');
  }

  // Sustituir renderInventory
  var _renderInventory = window.renderInventory;
  window.renderInventory = function () {
    renderReferenceCatalog();
  };

  // Renombrar título de la vista inventario en sidebar / header al abrir
  var _switchView = window.switchView;
  window.switchView = function (view, el) {
    if (_switchView) _switchView(view, el);
    if (view === 'inventory') {
      var title = document.getElementById('pageTitle');
      if (title) title.textContent = 'Referencia / Tallas';
      var cardH = document.querySelector('#view-inventory .card-header h3');
      if (cardH) cardH.innerHTML = '<i class="fas fa-book-open"></i> Catálogo de referencia';
      renderReferenceCatalog();
    }
  };

  // Badge margen en tabla productos
  var _renderTable = window.renderTable;
  window.renderTable = function () {
    if (_renderTable) _renderTable();
    try {
      var tbody = document.getElementById('productsTableBody');
      if (!tbody) return;
      tbody.querySelectorAll('tr').forEach(function (tr) {
        if (tr.querySelector('.ops-margin-badge')) return;
        var codeEl = tr.querySelector('.product-cell-code');
        if (!codeEl) return;
        var p = products.find(function (x) { return x.code === codeEl.textContent.trim(); });
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

  var _updateAllStats = window.updateAllStats;
  window.updateAllStats = function () {
    if (_updateAllStats) _updateAllStats();
    try {
      ensureOpsDashboardUI();
      renderOpsDashboard();
    } catch (e) {}
  };

  var _exportCSV = window.exportCSV;
  window.exportCSV = function () {
    if (typeof products === 'undefined' || !products.length) {
      if (_exportCSV) return _exportCSV();
      return;
    }
    var headers = ['ID', 'Nombre', 'Código', 'Categoría', 'Venta', 'Compra', 'Margen%', 'Ganancia', 'Tallas', 'No disponibles', 'Badge'];
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
        m.hasCost ? m.amount : '',
        (p.sizes || []).join(';'),
        (p.outOfStock || []).join(';'),
        p.badge || ''
      ];
    });
    var csv = [headers.join(','), rows.map(function (r) { return r.join(','); }).join('\n')].join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'khaos-referencia.csv';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('CSV exportado (compra, venta, margen)', 'success');
  };

  function initOps() {
    ensureCostField();
    ensureOpsDashboardUI();
    renderOpsDashboard();
    // Si la vista inventario ya está visible
    if (document.getElementById('view-inventory') &&
        document.getElementById('view-inventory').style.display !== 'none') {
      renderReferenceCatalog();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(initOps, 800); });
  } else {
    setTimeout(initOps, 800);
  }

  console.log('✅ Operaciones intermediario (sin stock físico) cargado');
})();
