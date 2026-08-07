/**
 * admin.js — loader del núcleo (v20260807f)
 * Carga asíncrona del núcleo (sin XHR síncrono).
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

  function exposeGlobals() {
    try {
      (0, eval)(
        'try{window.products=products;}catch(e){}' +
        'try{window.orders=orders;}catch(e){}' +
        'try{window.coupons=coupons;}catch(e){}' +
        'try{window.nextId=nextId;}catch(e){}' +
        'try{window.nextOrderId=nextOrderId;}catch(e){}'
      );
    } catch (e) {}
    if (!Array.isArray(window.products)) window.products = [];
    if (!Array.isArray(window.orders)) window.orders = [];
    if (!Array.isArray(window.coupons)) window.coupons = [];
  }

  function safeUpdateCouponStats() {
    ensureDom();
    try {
      var list = (typeof coupons !== 'undefined' && Array.isArray(coupons)) ? coupons : (window.coupons || []);
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
      var list = (typeof coupons !== 'undefined' && Array.isArray(coupons)) ? coupons.slice() : (window.coupons || []).slice();
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
        if (typeof loadOrders === 'function') loadOrders();
        if (typeof renderOrders === 'function') renderOrders();
      } catch (err) {}
    });
  }

  function installStubsAndPatches() {
    ensureDom();
    exposeGlobals();

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

    window.updateCouponStats = safeUpdateCouponStats;
    window.getFilteredCoupons = safeGetFilteredCoupons;

    if (typeof window.init === 'function' && !window.init.__khaosWrapped) {
      var _init = window.init;
      window.init = function () {
        ensureDom();
        exposeGlobals();
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
      console.log('[Khaos] admin.js OK v20260807f (' + code.length + ' bytes)');
      window.__khaosAdminReady = true;
      try {
        if (typeof window.loadProducts === 'function') {
          Promise.resolve(window.loadProducts()).catch(function () {});
        }
      } catch (e) {}
    } catch (e) {
      console.error('[Khaos] admin.js eval error', e);
      installStubsAndPatches();
    }
  }

  // Carga ASÍNCRONA (sin XHR síncrono)
  function loadCore() {
    if (typeof fetch === 'function') {
      fetch(CDN + '?t=' + Date.now(), { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        })
        .then(function (text) {
          run(text);
        })
        .catch(function (err) {
          console.warn('[Khaos] fetch falló, usando script tag', err);
          loadViaScriptTag();
        });
    } else {
      loadViaScriptTag();
    }
  }

  function loadViaScriptTag() {
    var s = document.createElement('script');
    s.src = CDN + '?t=' + Date.now();
    s.async = true;
    s.onload = function () {
      installStubsAndPatches();
      window.__khaosAdminReady = true;
      console.log('[Khaos] admin.js OK v20260807f (script tag)');
    };
    s.onerror = function () {
      console.error('[Khaos] admin.js no se pudo cargar');
    };
    (document.head || document.documentElement).appendChild(s);
  }

  loadCore();
})();
