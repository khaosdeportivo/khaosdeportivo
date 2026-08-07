/**
 * khaos-improvements.js
 * Parches prioritarios para Khaos Deportivo:
 * 1. isCouponApplicable sin doble conteo
 * 2. Consumo de cupones (usedCount)
 * 3. Marcar tallas como vendidas al confirmar pedido
 * 4. Evitar pedidos duplicados en localStorage
 * 5. Panel de pedidos pendientes en admin con acciones
 *
 * Cargar DESPUÉS de shared.js (público) o de khaos-admin-core.js (admin).
 */
(function () {
  'use strict';

  function fixedIsCouponApplicable(coupon, cartItems) {
    if (!coupon) return { applicable: false, reason: 'Cupón inválido', eligibleSubtotal: 0 };
    if (typeof cartItems === 'undefined' || !cartItems) cartItems = (typeof state !== 'undefined' && state.cart) ? state.cart : [];

    if (coupon.type === 'gift' && typeof isGiftCouponApplicable === 'function') {
      return isGiftCouponApplicable(coupon, cartItems);
    }

    var hasProductIds = coupon.productIds && coupon.productIds.length > 0;
    var eligibleSubtotal = 0;
    var hasEligibleItems = false;

    if (hasProductIds) {
      for (var i = 0; i < cartItems.length; i++) {
        var item = cartItems[i];
        if (coupon.productIds.indexOf(item.id) >= 0 || coupon.productIds.indexOf(Number(item.id)) >= 0) {
          eligibleSubtotal += (Number(item.price) || 0) * (Number(item.qty) || 1);
          hasEligibleItems = true;
        }
      }
      if (!hasEligibleItems) {
        return { applicable: false, reason: 'Este cupón no aplica a los productos de tu carrito', eligibleSubtotal: 0 };
      }
      return { applicable: true, eligibleSubtotal: eligibleSubtotal };
    }

    if (!coupon.appliesTo || coupon.appliesTo === 'all') {
      var sub = typeof getCartSubtotal === 'function' ? getCartSubtotal() : 0;
      return { applicable: true, eligibleSubtotal: sub };
    }

    for (var j = 0; j < cartItems.length; j++) {
      var it = cartItems[j];
      var product = (typeof products !== 'undefined') ? products.find(function (p) { return p.id === it.id || p.id == it.id; }) : null;
      if (!product) continue;
      var meta = typeof getCategoryMeta === 'function' ? getCategoryMeta(product.category) : { family: '', group: '' };
      var isEligible =
        (coupon.appliesTo === 'guayo' && meta.family === 'guayo') ||
        (coupon.appliesTo === 'sintetica' && meta.family === 'sintetica') ||
        (coupon.appliesTo === 'futsal' && meta.family === 'futsal') ||
        (coupon.appliesTo === 'zapatillas' && meta.family === 'zapatillas') ||
        (coupon.appliesTo === 'accesorios' && meta.family === 'accesorios') ||
        (coupon.appliesTo === 'calzado' && ['guayo', 'sintetica', 'futsal', 'zapatillas'].indexOf(meta.family) >= 0) ||
        (coupon.appliesTo === 'nino' && meta.group === 'nino');

      if (isEligible) {
        eligibleSubtotal += (Number(it.price) || 0) * (Number(it.qty) || 1);
        hasEligibleItems = true;
      }
    }

    if (!hasEligibleItems) {
      return { applicable: false, reason: 'Este cupón no aplica a los productos de tu carrito', eligibleSubtotal: 0 };
    }
    return { applicable: true, eligibleSubtotal: eligibleSubtotal };
  }

  if (typeof window.isCouponApplicable === 'function') {
    var _prevApplicable = window.isCouponApplicable;
    window.isCouponApplicable = function (coupon, cartItems) {
      if (coupon && coupon.type === 'gift') {
        return _prevApplicable(coupon, cartItems);
      }
      return fixedIsCouponApplicable(coupon, cartItems);
    };
  } else {
    window.isCouponApplicable = fixedIsCouponApplicable;
  }

  window.consumeCoupon = function consumeCoupon(code) {
    if (!code) return false;
    code = String(code).toUpperCase().trim();

    var list = null;
    try {
      if (typeof coupons !== 'undefined' && Array.isArray(coupons)) list = coupons;
      else if (Array.isArray(window.coupons)) list = window.coupons;
      else if (typeof availableCoupons !== 'undefined' && Array.isArray(availableCoupons)) list = availableCoupons;
    } catch (e) {}

    if (!list || !list.length) {
      try {
        var raw = localStorage.getItem('khaos_admin_coupons');
        if (raw) list = JSON.parse(raw);
      } catch (e) {}
    }
    if (!list || !Array.isArray(list)) return false;

    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].code).toUpperCase() === code) {
        list[i].usedCount = (Number(list[i].usedCount) || 0) + 1;
        found = true;
        break;
      }
    }
    if (!found) return false;

    try { if (typeof coupons !== 'undefined') coupons = list; } catch (e) {}
    try { window.coupons = list; } catch (e) {}
    try { if (typeof availableCoupons !== 'undefined') availableCoupons = list; } catch (e) {}
    try { window.availableCoupons = list; } catch (e) {}

    try {
      localStorage.setItem('khaos_admin_coupons', JSON.stringify(list));
      localStorage.setItem('khaos_pending_sync', '1');
      localStorage.setItem('khaos_local_revision', String(Date.now()));
    } catch (e) {}

    try { if (typeof saveCoupons === 'function') saveCoupons(); } catch (e) {}
    try {
      if (typeof window.syncToGithub === 'function') {
        setTimeout(function () { window.syncToGithub().catch(function () {}); }, 300);
      }
    } catch (e) {}

    return true;
  };

  window.markOrderSizesSold = function markOrderSizesSold(items) {
    var result = { updated: 0, details: [] };
    if (!items || !items.length) return result;

    var list = null;
    try {
      if (typeof products !== 'undefined' && Array.isArray(products)) list = products;
      else if (Array.isArray(window.products)) list = window.products;
    } catch (e) {}
    if (!list || !list.length) {
      try {
        var raw = localStorage.getItem('khaos_admin_products');
        if (raw) list = JSON.parse(raw);
      } catch (e) {}
    }
    if (!list || !list.length) return result;

    items.forEach(function (item) {
      var pid = item.productId != null ? item.productId : item.id;
      var size = String(item.size || '').trim();
      if (!size) return;

      var p = list.find(function (x) { return Number(x.id) === Number(pid); });
      if (!p) {
        result.details.push('Producto #' + pid + ' no encontrado');
        return;
      }
      if (!Array.isArray(p.outOfStock)) p.outOfStock = [];
      if (p.outOfStock.indexOf(size) < 0) {
        p.outOfStock.push(size);
        result.updated++;
        result.details.push((p.name || p.code || pid) + ' talla ' + size + ' → agotada');
      } else {
        result.details.push((p.name || p.code || pid) + ' talla ' + size + ' ya estaba agotada');
      }
    });

    try { products = list; } catch (e) { try { window.products = list; } catch (e2) {} }
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(list));
      localStorage.setItem('khaos_pending_sync', '1');
      localStorage.setItem('khaos_local_revision', String(Date.now()));
    } catch (e) {}

    try {
      if (typeof window.saveProducts === 'function') window.saveProducts();
      else if (typeof saveProducts === 'function') saveProducts();
    } catch (e) {}

    try {
      if (typeof window.syncToGithub === 'function') {
        setTimeout(function () { window.syncToGithub().catch(function () {}); }, 400);
      }
    } catch (e) {}

    try {
      if (typeof window.renderTable === 'function') window.renderTable();
      if (typeof renderInventory === 'function') renderInventory();
    } catch (e) {}

    return result;
  };

  if (typeof window.saveOrderToLocalStorage === 'function' || typeof saveOrderToLocalStorage === 'function') {
    window.saveOrderToLocalStorage = function saveOrderToLocalStorageFixed() {
      if (typeof state === 'undefined' || !state.cart || state.cart.length === 0) return;

      var subtotal = typeof getCartSubtotal === 'function' ? getCartSubtotal() : 0;
      var discount = (typeof currentCoupon !== 'undefined' && currentCoupon) ? (currentCoupon.discount || 0) : 0;
      var total = subtotal - discount;

      var fingerprint = state.cart.map(function (i) {
        return i.id + ':' + i.size + 'x' + i.qty + '@' + i.price;
      }).join('|') + '|c:' + (currentCoupon ? currentCoupon.code : '') + '|t:' + total;

      try {
        var lastFp = localStorage.getItem('khaos_last_order_fp');
        if (lastFp === fingerprint) return;
      } catch (e) {}

      var order = {
        id: Date.now(),
        customer: 'Cliente Web',
        phone: '',
        address: '',
        items: state.cart.map(function (item) {
          return {
            productId: item.id,
            name: item.name,
            size: item.size,
            price: item.price,
            qty: item.qty
          };
        }),
        subtotal: subtotal,
        discount: discount,
        coupon: (typeof currentCoupon !== 'undefined' && currentCoupon) ? currentCoupon.code : null,
        total: total,
        status: 'pending',
        date: new Date().toISOString(),
        source: 'web',
        fingerprint: fingerprint
      };

      try {
        var orders = [];
        var saved = localStorage.getItem('khaos_admin_orders');
        if (saved) {
          var parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) orders = parsed;
        }
        orders.unshift(order);
        if (orders.length > 50) orders = orders.slice(0, 50);
        localStorage.setItem('khaos_admin_orders', JSON.stringify(orders));
        localStorage.setItem('khaos_last_order_fp', fingerprint);

        window.dispatchEvent(new StorageEvent('storage', {
          key: 'khaos_admin_orders',
          newValue: JSON.stringify(orders),
          storageArea: localStorage
        }));
      } catch (e) {}
    };
  }

  function getOrders() {
    try {
      var raw = localStorage.getItem('khaos_admin_orders');
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    return [];
  }

  function saveOrders(orders) {
    try {
      localStorage.setItem('khaos_admin_orders', JSON.stringify(orders));
    } catch (e) {}
  }

  window.confirmOrder = function confirmOrder(orderId) {
    var orders = getOrders();
    var order = orders.find(function (o) { return o.id == orderId; });
    if (!order) {
      if (typeof showToast === 'function') showToast('Pedido no encontrado', 'error');
      return;
    }
    if (order.status === 'confirmed' || order.status === 'completed') {
      if (typeof showToast === 'function') showToast('Este pedido ya fue confirmado', 'info');
      return;
    }

    var stockResult = window.markOrderSizesSold(order.items || []);
    var couponOk = false;
    if (order.coupon) {
      couponOk = window.consumeCoupon(order.coupon);
    }

    order.status = 'confirmed';
    order.confirmedAt = new Date().toISOString();
    order.stockNotes = stockResult.details;
    saveOrders(orders);

    var msg = 'Pedido confirmado. ' + stockResult.updated + ' talla(s) marcada(s) agotada(s).';
    if (order.coupon) msg += couponOk ? ' Cupón ' + order.coupon + ' consumido.' : ' Cupón no encontrado.';
    if (typeof showToast === 'function') showToast(msg, 'success');

    renderOrdersPanel();
  };

  window.cancelOrder = function cancelOrder(orderId) {
    var orders = getOrders();
    var order = orders.find(function (o) { return o.id == orderId; });
    if (!order) return;
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    saveOrders(orders);
    if (typeof showToast === 'function') showToast('Pedido cancelado', 'info');
    renderOrdersPanel();
  };

  window.deleteOrder = function deleteOrder(orderId) {
    var orders = getOrders().filter(function (o) { return o.id != orderId; });
    saveOrders(orders);
    if (typeof showToast === 'function') showToast('Pedido eliminado de la lista', 'info');
    renderOrdersPanel();
  };

  function formatMoney(n) {
    return '$' + (Number(n) || 0).toLocaleString('es-CO');
  }

  function renderOrdersPanel() {
    var container = document.getElementById('khaosOrdersPanel');
    if (!container) return;

    var orders = getOrders();
    var pending = orders.filter(function (o) { return o.status === 'pending'; });
    var others = orders.filter(function (o) { return o.status !== 'pending'; }).slice(0, 15);

    var html = '<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
      '<div><strong style="font-size:15px;">Pedidos web</strong> ' +
      '<span style="font-size:12px;color:var(--fog,#888);">(' + pending.length + ' pendientes)</span></div>' +
      '<button type="button" class="btn btn-secondary" onclick="window.renderOrdersPanel && renderOrdersPanel()" style="font-size:12px;padding:6px 12px;">↻ Actualizar</button>' +
      '</div>';

    if (!orders.length) {
      html += '<div class="empty-state" style="padding:24px;text-align:center;color:var(--fog,#888);">' +
        '<p>No hay pedidos guardados en este navegador.</p>' +
        '<p style="font-size:12px;">Los clientes generan pedidos al usar el botón de WhatsApp del carrito.</p></div>';
      container.innerHTML = html;
      return;
    }

    function orderCard(o) {
      var itemsHtml = (o.items || []).map(function (it) {
        return '<li style="font-size:12px;margin:2px 0;">' +
          (it.name || 'Producto') + ' — talla <strong>' + (it.size || '?') + '</strong> x' + (it.qty || 1) +
          ' (' + formatMoney(it.price) + ')</li>';
      }).join('');

      var statusColor = o.status === 'pending' ? '#f59e0b' : o.status === 'confirmed' ? '#22c55e' : '#888';
      var statusLabel = o.status === 'pending' ? 'Pendiente' : o.status === 'confirmed' ? 'Confirmado' : (o.status || '');

      var actions = '';
      if (o.status === 'pending') {
        actions =
          '<button type="button" class="btn btn-primary" style="font-size:12px;padding:6px 12px;background:#22c55e;border:none;" ' +
          'onclick="confirmOrder(' + o.id + ')" title="Marca tallas agotadas + consume cupón">' +
          '✓ Confirmar (stock + cupón)</button>' +
          '<button type="button" class="btn btn-secondary" style="font-size:12px;padding:6px 12px;" ' +
          'onclick="cancelOrder(' + o.id + ')">Cancelar</button>';
      }
      actions += '<button type="button" class="btn btn-secondary" style="font-size:12px;padding:6px 10px;color:#ef4444;" ' +
        'onclick="if(confirm(\'¿Eliminar de la lista?\')) deleteOrder(' + o.id + ')">🗑</button>';

      return '<div style="border:1px solid var(--stone,#333);border-radius:12px;padding:14px;margin-bottom:12px;background:var(--ink,#12121a);">' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">' +
        '<div><span style="color:' + statusColor + ';font-weight:700;font-size:12px;">● ' + statusLabel + '</span>' +
        ' <span style="font-size:11px;color:var(--fog,#888);margin-left:8px;">' +
        (o.date ? new Date(o.date).toLocaleString('es-CO') : '') + '</span></div>' +
        '<div style="font-weight:800;color:var(--gold-light,#D4AF37);">' + formatMoney(o.total) + '</div></div>' +
        '<ul style="margin:0 0 10px 16px;padding:0;">' + itemsHtml + '</ul>' +
        (o.coupon ? '<div style="font-size:12px;margin-bottom:8px;">Cupón: <strong>' + o.coupon + '</strong>' +
          (o.discount ? ' (−' + formatMoney(o.discount) + ')' : '') + '</div>' : '') +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + actions + '</div>' +
        '</div>';
    }

    if (pending.length) {
      html += '<h4 style="font-size:13px;margin:12px 0 8px;color:#f59e0b;">Pendientes de confirmar</h4>';
      pending.forEach(function (o) { html += orderCard(o); });
    }
    if (others.length) {
      html += '<h4 style="font-size:13px;margin:16px 0 8px;color:var(--fog,#888);">Historial reciente</h4>';
      others.forEach(function (o) { html += orderCard(o); });
    }

    container.innerHTML = html;
  }
  window.renderOrdersPanel = renderOrdersPanel;

  function ensureOrdersUI() {
    if (!document.getElementById('view-dashboard') && !document.getElementById('view-products')) return;
    if (document.getElementById('khaosOrdersPanel')) {
      renderOrdersPanel();
      return;
    }

    var dash = document.getElementById('view-dashboard');
    var target = dash || document.getElementById('view-products');
    if (!target) return;

    var block = document.createElement('div');
    block.id = 'khaosOrdersSection';
    block.className = 'card';
    block.style.cssText = 'margin-bottom:24px;';
    block.innerHTML =
      '<div class="card-header"><h3><i class="fas fa-shopping-bag"></i> Pedidos del catálogo web</h3></div>' +
      '<div class="card-body" style="padding:16px 20px;">' +
      '<p style="font-size:12px;color:var(--fog,#888);margin:0 0 12px;">' +
      'Al <strong>Confirmar</strong> un pedido se marcan las tallas como agotadas en el catálogo y se consume el cupón (usedCount +1). ' +
      'Luego se sincroniza con GitHub automáticamente.</p>' +
      '<div id="khaosOrdersPanel"></div></div>';

    var first = target.querySelector('.card, .chart-grid, .stats-grid');
    if (first) target.insertBefore(block, first);
    else target.appendChild(block);

    renderOrdersPanel();
  }

  window.markSizeOutOfStock = function markSizeOutOfStock(productId, size) {
    return window.markOrderSizesSold([{ productId: productId, size: size }]);
  };

  function bootImprovements() {
    if (document.getElementById('view-dashboard') || document.getElementById('view-products')) {
      ensureOrdersUI();
      setInterval(function () {
        if (document.getElementById('khaosOrdersPanel')) renderOrdersPanel();
      }, 8000);
    }
    console.log('[Khaos] improvements.js listo (cupones + stock + pedidos)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(bootImprovements, 900); });
  } else {
    setTimeout(bootImprovements, 900);
  }

  window.addEventListener('storage', function (e) {
    if (e.key === 'khaos_admin_orders') {
      try { renderOrdersPanel(); } catch (err) {}
    }
  });
})();
