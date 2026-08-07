/**
 * admin.js — núcleo del panel de administración
 * Carga la versión completa desde CDN y aplica protecciones DOM.
 */
(function () {
  if (window.__khaosAdminBooted) return;
  window.__khaosAdminBooted = true;

  var CDN =
    'https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@0c971526acc7/js/admin.js';

  function ensureCouponTabEls() {
    var ids = ['tabCouponAll', 'tabCouponActive', 'tabCouponExpired', 'tabCouponPct', 'tabCouponFixed'];
    var host = document.getElementById('view-coupons') || document.body;
    if (!host) return;
    ids.forEach(function (id) {
      if (!document.getElementById(id)) {
        var span = document.createElement('span');
        span.id = id;
        span.style.display = 'none';
        span.setAttribute('aria-hidden', 'true');
        host.appendChild(span);
      }
    });
  }

  function safeCouponStats() {
    function safeText(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    }
    function safeStyle(id, prop, value) {
      var el = document.getElementById(id);
      if (el && el.style) el.style[prop] = value;
    }
    window.updateCouponStats = function updateCouponStats() {
      try {
        ensureCouponTabEls();
        var list = (typeof coupons !== 'undefined' && Array.isArray(coupons)) ? coupons : [];
        var total = list.length;
        var active = list.filter(function (c) {
          return typeof isCouponActive === 'function' ? isCouponActive(c) : true;
        }).length;
        var used = list.reduce(function (s, c) { return s + (c.usedCount || 0); }, 0);
        var saved = list.reduce(function (s, c) { return s + (c.totalSaved || 0); }, 0);
        safeText('couponTotal', total);
        safeText('couponActive', active);
        safeText('couponUsed', used);
        safeText('couponSaved', '$' + Number(saved).toLocaleString('es-CO'));
        safeText('sidebarCouponCount', active);
        safeStyle('sidebarCouponCount', 'display', active > 0 ? 'flex' : 'none');
        safeText('tabCouponAll', total);
        safeText('tabCouponActive', active);
        safeText('tabCouponExpired', list.filter(function (c) {
          return typeof isCouponExpired === 'function' && isCouponExpired(c);
        }).length);
        safeText('tabCouponPct', list.filter(function (c) { return c.type === 'percentage'; }).length);
        safeText('tabCouponFixed', list.filter(function (c) { return c.type === 'fixed'; }).length);
      } catch (e) {
        console.warn('[Khaos] updateCouponStats', e);
      }
    };
  }

  function afterCore() {
    try {
      ensureCouponTabEls();
      safeCouponStats();
      if (typeof window.updateCouponStats === 'function') window.updateCouponStats();
      console.log('[Khaos] admin coupon DOM safety OK');
    } catch (e) {
      console.warn('[Khaos] afterCore', e);
    }
  }

  function run(code) {
    // Parche preventivo: reescribir updateCouponStats inseguro antes de eval
    // (por si init corre síncrono al final del archivo)
    try {
      ensureCouponTabEls();
    } catch (e) {}

    // Envolver getElementById temporalmente durante el primer init es frágil;
    // mejor parchear el código fuente de updateCouponStats
    try {
      code = code.replace(
        /document\.getElementById\('(tabCouponAll|tabCouponActive|tabCouponExpired|tabCouponPct|tabCouponFixed|couponTotal|couponActive|couponUsed|couponSaved|sidebarCouponCount)'\)\.(textContent|style)/g,
        function (m, id, prop) {
          return "(document.getElementById('" + id + "')||{})[" + (prop === 'style' ? "'style'" : "'textContent'") + "]";
        }
      );
      // El replace de .style es incompleto para .style.display — enfoque más simple:
    } catch (e) {}

    // Enfoque más robusto: reemplazar el cuerpo de updateCouponStats entero
    try {
      var start = code.indexOf('function updateCouponStats');
      if (start >= 0) {
        var brace = code.indexOf('{', start);
        var depth = 0, end = brace;
        for (var i = brace; i < code.length; i++) {
          if (code[i] === '{') depth++;
          else if (code[i] === '}') {
            depth--;
            if (depth === 0) { end = i + 1; break; }
          }
        }
        var safeFn =
          'function updateCouponStats() {' +
          'try {' +
          'var list=(typeof coupons!=="undefined"&&Array.isArray(coupons))?coupons:[];' +
          'var total=list.length;' +
          'var active=list.filter(function(c){return typeof isCouponActive==="function"?isCouponActive(c):true;}).length;' +
          'var used=list.reduce(function(s,c){return s+(c.usedCount||0);},0);' +
          'var saved=list.reduce(function(s,c){return s+(c.totalSaved||0);},0);' +
          'function st(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}' +
          'function ss(id,p,v){var e=document.getElementById(id);if(e&&e.style)e.style[p]=v;}' +
          'st("couponTotal",total);st("couponActive",active);st("couponUsed",used);' +
          'st("couponSaved","$"+Number(saved).toLocaleString("es-CO"));' +
          'st("sidebarCouponCount",active);ss("sidebarCouponCount","display",active>0?"flex":"none");' +
          'st("tabCouponAll",total);st("tabCouponActive",active);' +
          'st("tabCouponExpired",list.filter(function(c){return typeof isCouponExpired==="function"&&isCouponExpired(c);}).length);' +
          'st("tabCouponPct",list.filter(function(c){return c.type==="percentage";}).length);' +
          'st("tabCouponFixed",list.filter(function(c){return c.type==="fixed";}).length);' +
          '}catch(err){console.warn("[Khaos] updateCouponStats",err);}' +
          '}';
        code = code.slice(0, start) + safeFn + code.slice(end);
      }
    } catch (e) {
      console.warn('[Khaos] could not rewrite updateCouponStats', e);
    }

    try {
      (0, eval)(code);
      console.log('[Khaos] admin.js OK (' + code.length + ' bytes)');
      window.__khaosAdminReady = true;
      afterCore();
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
    console.error('[Khaos] admin.js CDN HTTP ' + xhr.status);
  } catch (e) {
    console.error('[Khaos] admin.js sync failed', e);
  }

  var s = document.createElement('script');
  s.src = CDN + '?t=' + Date.now();
  s.onload = function () {
    window.__khaosAdminReady = true;
    afterCore();
    console.log('[Khaos] admin.js OK (async)');
  };
  s.onerror = function () {
    console.error('[Khaos] admin.js no se pudo cargar');
  };
  (document.head || document.documentElement).appendChild(s);
})();
