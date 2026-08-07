/**
 * admin.js — núcleo del panel de administración
 * Carga la versión completa y estable desde CDN (commit 0c971526acc7).
 */
(function () {
  if (window.__khaosAdminBooted) return;
  window.__khaosAdminBooted = true;

  var CDN =
    'https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@0c971526acc7/js/admin.js';

  function run(code) {
    try {
      (0, eval)(code);
      console.log('[Khaos] admin.js OK (' + code.length + ' bytes)');
      window.__khaosAdminReady = true;
    } catch (e) {
      console.error('[Khaos] admin.js eval error', e);
    }
  }

  // Carga síncrona para que doLogin / switchView existan al renderizar
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

  // Fallback async
  var s = document.createElement('script');
  s.src = CDN + '?t=' + Date.now();
  s.onload = function () {
    window.__khaosAdminReady = true;
    console.log('[Khaos] admin.js OK (async)');
  };
  s.onerror = function () {
    console.error('[Khaos] admin.js no se pudo cargar');
  };
  (document.head || document.documentElement).appendChild(s);
})();
