/**
 * admin.js — loader del núcleo (v20260807d)
 * Sin reescritura del código fuente (evita romper funciones).
 * Crea DOM faltante + parches seguros después del eval.
 */
(function () {
  if (window.__khaosAdminBooted) return;
  window.__khaosAdminBooted = true;

  var CDN = 'https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@0c971526acc7/js/admin.js';
  var SPAN_IDS = ['tabCouponAll','tabCouponActive','tabCouponExpired','tabCouponPct','tabCouponFixed'];

  function ensureDom() {
    var host = document.getElementById('view-coupons') || document.body || document.documentElement;
    if (!host) return;
    SPAN_IDS.forEach(function (id) {
      if (!document.getElementById(id)) {
        var s = document.createElement('span');
        s.id = id;
        s.style.display = 'none';
        s.setAttribute('aria-hidden', 'true');
        try { host.appendChild(s); } catch (e) {}
      }
    });
    if (!document.getElementById('couponSearchBox')) {
      var input = document.createElement('input');
      input.type = 'search';
      input.id = 'couponSearchBox';
      input.value = '';
      input.style.display = 'none';
      try { host.appendChild(input); } catch (e) {}
    }
  }
  ensureDom();

  function safeUpdateCouponStats() {
    ensureDom();
    try {
      var list = (typeof coupons !== 'undefined' && Array.isArray(coupons)) ? coupons : [];
      function st(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
      function ss(id, p, v) { var e = document.getElementById(id); if (e && e.style) e.style[p] = v; }
      var total = list.length;
      var active = list.filter(function (c) {
        return typeof isCouponActive === 'function' ? isCouponActive(c) : true;
      }).length;
      var used = list.reduce(function (s, c) { return s + (c.usedCount || 0); }, 0);
      var saved = list.reduce(function (s, c) { return s + (c.totalSaved || 0); }, 0);
      st('couponTotal', total);
      st('couponActive', active);
      st('couponUsed', used);
      st('couponSaved', '$' + Number(saved).toLocaleString('es-CO'));
      st('sidebarCouponCount', active);
      ss('sidebarCouponCount', 'display', active > 0 ? 'flex' : 'none');
      st('tabCouponAll', total);
      st('tabCouponActive', active);
      st('tabCouponExpired', list.filter(function (c) {
        return typeof isCouponExpired === 'function' && isCouponExpired(c);
      }).length);
      st('tabCouponPct', list.filter(function (c) { return c.type === 'percentage'; }).length);
      st('tabCouponFixed', list.filter(function (c) { return c.type === 'fixed'; }).length);
    } catch (err) {
      console.warn('[Khaos] updateCouponStats', err);
    }
  }

  function safeGetFilteredCoupons() {
    ensureDom();
    try {
      var list = (typeof coupons !== 'undefined' && Array.isArray(coupons)) ? coupons.slice() : [];
      var filter = (typeof currentCouponFilter !== 'undefined') ? currentCouponFilter : 'all';
      if (filter === 'active') list = list.filter(function (c) {
        return typeof isCouponActive === 'function' ? isCouponActive(c) : true;
      });
      else if (filter === 'expired') list = list.filter(function (c) {
        return typeof isCouponExpired === 'function' ? isCouponExpired(c) : false;
      });
      else if (filter === 'percentage') list = list.filter(function (c) { return c.type === 'percentage'; });
      else if (filter === 'fixed') list = list.filter(function (c) { return c.type === 'fixed'; });
      var box = document.getElementById('couponSearchBox');
      var search = (box && box.value ? String(box.value) : '').toLowerCase().trim();
      if (search) {
        list = list.filter(function (c) {
          return String(c.code || '').toLowerCase().indexOf(search) >= 0;
        });
      }
      return list;
    } catch (err) {
      console.warn('[Khaos] getFilteredCoupons', err);
      return [];
    }
  }

  function safeInitStorageListener() {
    if (window.__khaosStorageListening) return;
    window.__khaosStorageListening = true;
    window.addEventListener('storage', function (e) {
      if (e.key !== 'khaos_admin_orders') return;
      try {
        var newOrders = JSON.parse(e.newValue || '[]');
        var oldOrders = JSON.parse(e.oldValue || '[]');
        if (newOrders.length > oldOrders.length) {
          var newOrder = newOrders[0];
          if (newOrder && newOrder.source === 'web') {
            if (typeof showToast === 'function') {
              showToast(
                'Nuevo pedido web: ' + (newOrder.customer || 'Cliente') +
                ' — $' + (newOrder.total || 0).toLocaleString('es-CO'),
                'success'
              );
            }
            if (typeof addNotification === 'function') {
              addNotification(
                'order',
                'Nuevo pedido #' + String(newOrder.id).slice(-4) +
                ' desde catálogo — $' + (newOrder.total || 0).toLocaleString('es-CO')
              );
            }
          }
        }
        if (typeof loadOrders === 'function') loadOrders();
        if (typeof renderOrders === 'function') renderOrders();
      } catch (err) {
        console.warn('[Khaos] storage listener', err);
      }
    });
  }

  function installStubsAndPatches() {
    ensureDom();

    // Stubs si el núcleo no los definió
    if (typeof window.initStorageListener !== 'function') {
      window.initStorageListener = safeInitStorageListener;
    }
    if (typeof window.initEventListeners !== 'function') {
      window.initEventListeners = function () {};
    }
    if (typeof window.initScrollEffects !== 'function') {
      window.initScrollEffects = function () {};
    }
    if (typeof window.startRealtimeSimulation !== 'function') {
      window.startRealtimeSimulation = function () {};
    }
    if (typeof window.initCharts !== 'function') {
      window.initCharts = function () {};
    }
    if (typeof window.initAutoHideSidebar !== 'function') {
      window.initAutoHideSidebar = function () {};
    }

    // Parches seguros (siempre)
    window.updateCouponStats = safeUpdateCouponStats;
    window.getFilteredCoupons = safeGetFilteredCoupons;

    // Envolver init para que nunca tumbe el login
    if (typeof window.init === 'function' && !window.init.__khaosWrapped) {
      var _init = window.init;
      window.init = function () {
        ensureDom();
        // Reafirmar stubs por si init corre en otro orden
        if (typeof window.initStorageListener !== 'function') {
          window.initStorageListener = safeInitStorageListener;
        }
        window.updateCouponStats = safeUpdateCouponStats;
        window.getFilteredCoupons = safeGetFilteredCoupons;
        try {
          return _init.apply(this, arguments);
        } catch (err) {
          console.error('[Khaos] init error (recuperado):', err);
          try { safeInitStorageListener(); } catch (e2) {}
          if (typeof showToast === 'function') {
            showToast('Panel cargado con advertencias', 'info');
          }
        }
      };
      window.init.__khaosWrapped = true;
    }
  }

  function run(code) {
    ensureDom();
    try {
      (0, eval)(code);
      installStubsAndPatches();
      console.log('[Khaos] admin.js OK v20260807d (' + code.length + ' bytes)');
      window.__khaosAdminReady = true;
    } catch (e) {
      console.error('[Khaos] admin.js eval error', e);
      installStubsAndPatches();
    }
  }

  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', CDN + '?t=' + Date.now(), false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
      run(xhr.responseText);
      return;
    }
  } catch (e) {
    console.error('[Khaos] admin sync fail', e);
  }

  var s = document.createElement('script');
  s.src = CDN + '?t=' + Date.now();
  s.onload = function () {
    installStubsAndPatches();
    window.__khaosAdminReady = true;
    console.log('[Khaos] admin.js OK v20260807d (async)');
  };
  (document.head || document.documentElement).appendChild(s);
})();
