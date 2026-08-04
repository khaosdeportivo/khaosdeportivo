/**
 * catalog-filters.js — Filtros de busqueda en el catalogo publico
 */
(function () {
  'use strict';

  var CAT_OPTIONS = [
    { value: 'todos', label: 'Categoria' },
    { value: 'guayo-corto', label: 'Guayo Corto' },
    { value: 'guayo-bota', label: 'Guayo Bota' },
    { value: 'gc-tache-aluminio', label: 'GC Tache Aluminio' },
    { value: 'gb-tache-aluminio', label: 'GB Tache Aluminio' },
    { value: 'sintetica-corta', label: 'Sintetica Corta' },
    { value: 'sintetica-bota', label: 'Sintetica Bota' },
    { value: 'futsal-corto', label: 'Futsal Corto' },
    { value: 'futsal-bota', label: 'Futsal Bota' },
    { value: 'zapatillas', label: 'Zapatillas' },
    { value: 'accesorios', label: 'Accesorios' },
    { value: 'nino-guayo-corto', label: 'Nino Guayo Corto' },
    { value: 'nino-guayo-bota', label: 'Nino Guayo Bota' },
    { value: 'nino-sintetica-corta', label: 'Nino Sintetica Corta' },
    { value: 'nino-sintetica-bota', label: 'Nino Sintetica Bota' },
    { value: 'nino-futsal-corto', label: 'Nino Futsal Corto' },
    { value: 'nino-futsal-bota', label: 'Nino Futsal Bota' }
  ];

  function fillCatSelect() {
    var sel = document.getElementById('catalogCatFilter');
    if (!sel) return;
    var current = sel.value || 'todos';
    sel.innerHTML = CAT_OPTIONS.map(function (o) {
      return '<option value="' + o.value + '">' + o.label + '</option>';
    }).join('');
    try { sel.value = current; } catch (e) {}
  }

  function applyFromUI() {
    var group = document.getElementById('catalogGroupFilter');
    var cat = document.getElementById('catalogCatFilter');
    var g = (group && group.value) || 'todos';
    var c = (cat && cat.value) || 'todos';

    if (c && c !== 'todos') {
      if (typeof filterProducts === 'function') filterProducts(c);
      syncSelectsAfterFilter();
      return;
    }
    if (typeof filterProducts === 'function') filterProducts(g);
    syncSelectsAfterFilter();
  }

  function syncSelectsAfterFilter() {
    try {
      var f = (typeof state !== 'undefined' && state.currentFilter) ? state.currentFilter : 'todos';
      var group = document.getElementById('catalogGroupFilter');
      var cat = document.getElementById('catalogCatFilter');
      if (!group || !cat) return;

      if (f === 'todos') {
        group.value = 'todos';
        cat.value = 'todos';
      } else if (f === 'adulto' || f === 'nino') {
        group.value = f;
        cat.value = 'todos';
      } else if (f === 'zapatillas' || f === 'accesorios') {
        group.value = 'todos';
        cat.value = f;
      } else if (String(f).indexOf('nino-') === 0) {
        group.value = 'nino';
        cat.value = f;
      } else {
        group.value = 'adulto';
        var has = Array.prototype.some.call(cat.options, function (o) { return o.value === f; });
        cat.value = has ? f : 'todos';
        if (!has) group.value = 'todos';
      }
    } catch (e) {}
  }

  function clearAll() {
    var search = document.getElementById('searchInput');
    var clearBtn = document.getElementById('searchClear');
    if (search) search.value = '';
    if (clearBtn) clearBtn.classList.remove('show');
    try {
      if (typeof state !== 'undefined') {
        state.searchQuery = '';
        state.currentFilter = 'todos';
        state.sortBy = 'default';
      }
    } catch (e) {}
    var group = document.getElementById('catalogGroupFilter');
    var cat = document.getElementById('catalogCatFilter');
    if (group) group.value = 'todos';
    if (cat) cat.value = 'todos';
    try {
      document.querySelectorAll('.sort-option').forEach(function (opt) {
        opt.classList.toggle('active', opt.dataset.sort === 'default');
      });
      var label = document.getElementById('sortLabel');
      if (label) label.textContent = 'Ordenar';
    } catch (e) {}
    if (typeof renderProducts === 'function') renderProducts();
    try {
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {}
  }

  function patchFilterProducts() {
    if (typeof window.filterProducts !== 'function' || window.__khaosCatalogFilterPatched) return;
    window.__khaosCatalogFilterPatched = true;
    var orig = window.filterProducts;
    window.filterProducts = function (filter) {
      var r = orig.apply(this, arguments);
      setTimeout(syncSelectsAfterFilter, 0);
      return r;
    };
  }

  function boot() {
    fillCatSelect();
    patchFilterProducts();

    var group = document.getElementById('catalogGroupFilter');
    var cat = document.getElementById('catalogCatFilter');
    var clearBtn = document.getElementById('catalogClearFilters');

    if (group) group.addEventListener('change', applyFromUI);
    if (cat) cat.addEventListener('change', applyFromUI);
    if (clearBtn) clearBtn.addEventListener('click', clearAll);

    syncSelectsAfterFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 300);
    });
  } else {
    setTimeout(boot, 300);
  }

  var tries = 0;
  (function waitProducts() {
    var ready = false;
    try { ready = typeof products !== 'undefined' && Array.isArray(products) && products.length > 0; } catch (e) {}
    if (ready || tries > 40) {
      fillCatSelect();
      syncSelectsAfterFilter();
      return;
    }
    tries++;
    setTimeout(waitProducts, 250);
  })();

  console.log('[Khaos] catalog-filters listo');
})();
