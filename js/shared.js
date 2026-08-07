/**
 * shared.js — carga el catálogo desde el commit estable en CDN.
 * Los parches (cupones sin doble conteo, pedidos sin duplicar) los aplica
 * js/khaos-improvements.js al cargarse después.
 *
 * Commit estable: d3afe3e4c9498916d8e5508f44211497103a2613
 */
(function () {
  if (window.__khaosSharedLoading) return;
  window.__khaosSharedLoading = true;

  var CDN = 'https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@d3afe3e4c9498916d8e5508f44211497103a2613/js/shared.js';
  var s = document.createElement('script');
  s.src = CDN + (CDN.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
  s.async = false;
  s.onload = function () {
    console.log('[Khaos] shared.js restaurado desde CDN estable');
    window.__khaosSharedReady = true;
    try {
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new Event('khaos-shared-ready'));
      }
    } catch (e) {}
  };
  s.onerror = function () {
    console.error('[Khaos] Falló carga de shared.js desde CDN');
    window.__khaosSharedReady = false;
  };
  // Insertar de forma síncrona en head para que el resto del HTML lo espere mejor
  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  head.appendChild(s);
})();
