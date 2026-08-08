/* Khaos admin safety net */
(function () {
  function apply() {
    if (Array.isArray(window.products)) {
      var before = products.length;
      products = products.filter(function (p) { return p.id !== 71 && p.id !== 72 && p.id !== 73; });
      window.products = products;
      products.forEach(function (p) {
        if (p.oldPrice == null) p.oldPrice = 0;
        if (!Array.isArray(p.sizes)) p.sizes = [];
        if (!Array.isArray(p.outOfStock)) p.outOfStock = [];
      });
      if (products.length !== before) {
        try { localStorage.setItem('khaos_admin_products', JSON.stringify(products)); } catch (e) {}
      }
    }
    console.log('[Khaos] safety net ok — productos:', (window.products || []).length);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(apply, 500); });
  } else {
    setTimeout(apply, 500);
  }
})();
