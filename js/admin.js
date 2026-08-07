/**
 * admin.js — loader del núcleo + protecciones DOM (v20260807c)
 */
(function () {
  if (window.__khaosAdminBooted) return;
  window.__khaosAdminBooted = true;

  var CDN = 'https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@0c971526acc7/js/admin.js';
  var SPAN_IDS = ['tabCouponAll','tabCouponActive','tabCouponExpired','tabCouponPct','tabCouponFixed'];

  function ensure() {
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

    // Campo de búsqueda que el HTML actual no trae
    if (!document.getElementById('couponSearchBox')) {
      var input = document.createElement('input');
      input.type = 'search';
      input.id = 'couponSearchBox';
      input.placeholder = 'Buscar cupón...';
      input.style.cssText = 'display:none;';
      input.value = '';
      try { host.appendChild(input); } catch (e) {}
    }
  }
  ensure();

  function safeUpdateCouponStats() {
    ensure();
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
    ensure();
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
      return (typeof coupons !== 'undefined' && Array.isArray(coupons)) ? coupons.slice() : [];
    }
  }

  window.__khaosSafeUpdateCouponStats = safeUpdateCouponStats;
  window.__khaosSafeGetFilteredCoupons = safeGetFilteredCoupons;
  window.updateCouponStats = safeUpdateCouponStats;
  window.getFilteredCoupons = safeGetFilteredCoupons;

  function replaceFn(code, name, bodySrc) {
    var start = code.indexOf('function ' + name);
    if (start < 0) return code;
    var brace = code.indexOf('{', start);
    if (brace < 0) return code;
    var depth = 0, end = brace;
    for (var i = brace; i < code.length; i++) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    return code.slice(0, start) + bodySrc + code.slice(end);
  }

  function rewrite(code) {
    ensure();
    code = replaceFn(
      code,
      'updateCouponStats',
      'function updateCouponStats(){ if(window.__khaosSafeUpdateCouponStats) window.__khaosSafeUpdateCouponStats(); }'
    );
    code = replaceFn(
      code,
      'getFilteredCoupons',
      'function getFilteredCoupons(){ return window.__khaosSafeGetFilteredCoupons ? window.__khaosSafeGetFilteredCoupons() : []; }'
    );
    return code;
  }

  function run(code) {
    code = rewrite(code);
    try {
      (0, eval)(code);
      window.updateCouponStats = safeUpdateCouponStats;
      window.getFilteredCoupons = safeGetFilteredCoupons;
      console.log('[Khaos] admin.js OK v20260807c (' + code.length + ' bytes)');
      window.__khaosAdminReady = true;
    } catch (e) {
      console.error('[Khaos] admin.js eval error', e);
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
    window.updateCouponStats = safeUpdateCouponStats;
    window.getFilteredCoupons = safeGetFilteredCoupons;
    window.__khaosAdminReady = true;
  };
  (document.head || document.documentElement).appendChild(s);
})();
