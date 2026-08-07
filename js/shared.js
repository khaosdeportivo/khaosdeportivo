/**
 * shared.js — catálogo público de Khaos Deportivo
 *
 * Carga el código estable desde CDN (commit d3afe3e4) de forma síncrona
 * y deja listo el entorno para khaos-improvements.js (cupones + pedidos).
 *
 * Fuente completa:
 *   https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@d3afe3e4/js/shared.js
 */
(function () {
  if (window.__khaosSharedBooted) return;
  window.__khaosSharedBooted = true;

  var CDN =
    'https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@d3afe3e4c9498916d8e5508f44211497103a2613/js/shared.js';

  // Carga síncrona (bloqueante) para que las funciones existan antes del resto de scripts
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', CDN + '?t=' + Date.now(), false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
      (0, eval)(xhr.responseText);
      console.log('[Khaos] shared.js OK (' + xhr.responseText.length + ' bytes desde CDN)');
      window.__khaosSharedReady = true;
      return;
    }
    console.error('[Khaos] shared.js CDN HTTP ' + xhr.status);
  } catch (e) {
    console.error('[Khaos] shared.js sync load failed', e);
  }

  // Fallback async
  var s = document.createElement('script');
  s.src = CDN + '?t=' + Date.now();
  s.onload = function () {
    window.__khaosSharedReady = true;
    console.log('[Khaos] shared.js OK (async fallback)');
  };
  s.onerror = function () {
    console.error('[Khaos] shared.js no se pudo cargar');
  };
  (document.head || document.documentElement).appendChild(s);
})();
