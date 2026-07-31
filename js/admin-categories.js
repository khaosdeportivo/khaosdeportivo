// ===== CATEGORY PATCH: Zapatillas + Accesorios =====
// Se carga DESPUÉS de admin.js para extender las definiciones
(function() {
  // Extender categoryNames
  if (typeof categoryNames !== 'undefined') {
    Object.assign(categoryNames, {
      'zapatillas-urbanas': 'Zapatillas Urbanas',
      'zapatillas-running': 'Zapatillas Running',
      'zapatillas-casual': 'Zapatillas Casual',
      'canilleras': 'Canilleras',
      'medias': 'Medias',
      'bolsos': 'Bolsos'
    });
  }

  // Extender categoryColors
  if (typeof categoryColors !== 'undefined') {
    Object.assign(categoryColors, {
      'zapatillas-urbanas': '#06b6d4',
      'zapatillas-running': '#0ea5e9',
      'zapatillas-casual': '#14b8a6',
      'canilleras': '#8b5cf6',
      'medias': '#a78bfa',
      'bolsos': '#7c3aed'
    });
  }

  // Extender categoryHierarchy (adulto)
  if (typeof categoryHierarchy !== 'undefined' && categoryHierarchy.adulto) {
    categoryHierarchy.adulto.families.zapatillas = {
      label: 'Zapatillas',
      icon: 'fa-shoe-prints',
      color: '#06b6d4',
      categories: ['zapatillas-urbanas', 'zapatillas-running', 'zapatillas-casual']
    };
    categoryHierarchy.adulto.families.accesorios = {
      label: 'Accesorios',
      icon: 'fa-shopping-bag',
      color: '#8b5cf6',
      categories: ['canilleras', 'medias', 'bolsos']
    };
  }

  // Parchear updateAllStats para contadores nuevos
  const _origUpdateAllStats = typeof updateAllStats === 'function' ? updateAllStats : null;
  window.updateAllStats = function() {
    if (_origUpdateAllStats) _origUpdateAllStats();
    try {
      const elZ = document.getElementById('dashZapatillas');
      const elA = document.getElementById('dashAccesorios');
      const stZ = document.getElementById('statZapatillas');
      const stA = document.getElementById('statAccesorios');
      if (elZ) elZ.textContent = products.filter(p => getCategoryMeta(p.category).family === 'zapatillas').length;
      if (elA) elA.textContent = products.filter(p => getCategoryMeta(p.category).family === 'accesorios').length;
      if (stZ) stZ.textContent = products.filter(p => getCategoryMeta(p.category).family === 'zapatillas').length;
      if (stA) stA.textContent = products.filter(p => getCategoryMeta(p.category).family === 'accesorios').length;
    } catch(e) {}
  };

  // Re-render si el admin ya inicializó
  if (typeof renderSidebarCategories === 'function') {
    try { renderSidebarCategories(); } catch(e) {}
  }
  if (typeof updateAllStats === 'function') {
    try { updateAllStats(); } catch(e) {}
  }

  console.log('✅ Categorías Zapatillas y Accesorios cargadas en admin');

  // Cargar módulo de operaciones (costo / margen) si aún no está
  if (!document.querySelector('script[src*="admin-operations"]')) {
    var s = document.createElement('script');
    s.src = 'js/admin-operations.js';
    s.async = false;
    document.body.appendChild(s);
  }
})();
