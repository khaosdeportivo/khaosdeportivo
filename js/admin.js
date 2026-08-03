/* Bootstrap: carga admin.js estable via jsDelivr + productos desde GitHub si hace falta */
(function () {
  var SRC = 'https://cdn.jsdelivr.net/gh/khaosdeportivo/khaosdeportivo@0d99daebe6a2/js/admin.js';
  var s = document.createElement('script');
  s.src = SRC;
  s.onload = function () {
    try {
      if (typeof loadTheme === 'function') loadTheme();
      if (typeof checkAuth === 'function') {
        checkAuth();
        if (typeof Security !== 'undefined' && Security.validateSession && Security.validateSession()) {
          if (typeof init === 'function') init();
        }
      }
    } catch (e) { console.warn('init', e); }

    function fillFromGithub() {
      try {
        var saved = localStorage.getItem('khaos_admin_products');
        if (saved) {
          var parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return;
        }
      } catch (e) {}
      fetch('https://raw.githubusercontent.com/khaosdeportivo/khaosdeportivo/main/productos.json?t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (data) {
          var list = Array.isArray(data) ? data : (data.productos || []);
          if (!list.length || typeof products === 'undefined') return;
          products = list;
          if (typeof nextId !== 'undefined') {
            nextId = Math.max.apply(null, list.map(function (p) { return p.id || 0; }).concat([0])) + 1;
          }
          if (typeof saveProducts === 'function') saveProducts();
          if (typeof renderTable === 'function') renderTable();
          if (typeof renderCategoryChips === 'function') renderCategoryChips();
          if (typeof updateAllStats === 'function') updateAllStats();
          if (typeof showToast === 'function') showToast(list.length + ' productos cargados desde GitHub', 'success');
        })
        .catch(function (err) { console.warn('productos.json', err); });
    }
    setTimeout(fillFromGithub, 400);
  };
  s.onerror = function () {
    console.error('No se pudo cargar admin.js desde CDN');
    var el = document.getElementById('loginError');
    if (el) { el.textContent = 'Error cargando el panel. Recarga con Ctrl+F5.'; el.classList.add('show'); }
  };
  document.head.appendChild(s);
})();
