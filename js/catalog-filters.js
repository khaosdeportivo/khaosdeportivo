/**
 * catalog-filters.js — Filtros de busqueda en el catalogo publico (grupo, categoria, talla)
 */
(function () {
  'use strict';

  var sizeFilter = 'todos';

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

  var DEFAULT_SIZES = ['39', '40', '41', '42', '43', '44', '45'];

  function collectSizes() {
    var set = {};
    try {
      var list = (typeof products !== 'undefined' && Array.isArray(products)) ? products : [];
      list.forEach(function (p) {
        (p.sizes || []).forEach(function (s) {
          set[String(s)] = true;
        });
      });
    } catch (e) {}
    var arr = Object.keys(set);
    if (!arr.length) arr = DEFAULT_SIZES.slice();
    arr.sort(function (a, b) {
      var na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
    return arr;
  }

  function fillCatSelect() {
    var sel = document.getElementById('catalogCatFilter');
    if (!sel) return;
    var current = sel.value || 'todos';
    sel.innerHTML = CAT_OPTIONS.map(function (o) {
      return '<option value="' + o.value + '">' + o.label + '</option>';
    }).join('');
    try { sel.value = current; } catch (e) {}
  }

  function fillSizeSelect() {
    var sel = document.getElementById('catalogSizeFilter');
    if (!sel) return;
    var current = sizeFilter || sel.value || 'todos';
    var sizes = collectSizes();
    var html = '<option value="todos">Talla</option>';
    sizes.forEach(function (s) {
      html += '<option value="' + s + '">Talla ' + s + '</option>';
    });
    sel.innerHTML = html;
    try { sel.value = current; } catch (e) { sel.value = 'todos'; }
  }

  function ensureSizeSelect() {
    if (document.getElementById('catalogSizeFilter')) return;
    var cat = document.getElementById('catalogCatFilter');
    var clearBtn = document.getElementById('catalogClearFilters');
    var parent = (cat && cat.parentNode) || document.querySelector('.catalog-toolbar');
    if (!parent) return;

    var sel = document.createElement('select');
    sel.id = 'catalogSizeFilter';
    sel.setAttribute('aria-label', 'Talla');
    sel.style.cssText = 'max-width:120px;font-size:13px;padding:10px 12px;height:44px;background:var(--graphite,#1a1a22);border:1px solid var(--stone,#333);border-radius:12px;color:var(--ivory,#eee);';

    if (clearBtn) parent.insertBefore(sel, clearBtn);
    else if (cat && cat.nextSibling) parent.insertBefore(sel, cat.nextSibling);
    else parent.appendChild(sel);

    fillSizeSelect();
    sel.addEventListener('change', onSizeChange);
  }

  function onSizeChange() {
    var sel = document.getElementById('catalogSizeFilter');
    sizeFilter = (sel && sel.value) || 'todos';
    if (typeof renderProducts === 'function') renderProducts();
  }

  function applyFromUI() {
    var group = document.getElementById('catalogGroupFilter');
    var cat = document.getElementById('catalogCatFilter');
    var g = (group && group.value) || 'todos';
    var c = (cat && cat.value) || 'todos';

    if (c && c !== 'todos') {
      if (typeof filterProducts === 'function') filterProducts(c);
    } else if (typeof filterProducts === 'function') {
      filterProducts(g);
    }
    // Restaurar filtro de talla (filterProducts no lo toca en shared, pero re-render si)
    var sizeSel = document.getElementById('catalogSizeFilter');
    if (sizeSel) sizeFilter = sizeSel.value || 'todos';
    syncSelectsAfterFilter();
    if (typeof renderProducts === 'function') renderProducts();
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

      var sizeSel = document.getElementById('catalogSizeFilter');
      if (sizeSel) {
        try { sizeSel.value = sizeFilter || 'todos'; } catch (e) {}
      }
    } catch (e) {}
  }

  function clearAll() {
    sizeFilter = 'todos';
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
    var sizeSel = document.getElementById('catalogSizeFilter');
    if (group) group.value = 'todos';
    if (cat) cat.value = 'todos';
    if (sizeSel) sizeSel.value = 'todos';
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

  function patchRenderProducts() {
    if (typeof window.renderProducts !== 'function' || window.__khaosSizeFilterPatched) return;
    window.__khaosSizeFilterPatched = true;
    var orig = window.renderProducts;
    window.renderProducts = function () {
      // Aplicar filtro de talla despues del render nativo es dificil;
      // interceptamos reescribiendo temporalmente products? Mejor: post-filtro del grid no.
      // En su lugar: guardar products, filtrar por talla en una copia vista via monkeypatch del filtrado interno.
      // shared.js filtra sobre [...products] local. Parcheamos state + llamamos orig,
      // y si hay talla, filtramos el resultado re-ejecutando logica:

      var sizeSel = document.getElementById('catalogSizeFilter');
      if (sizeSel) sizeFilter = sizeSel.value || 'todos';

      if (!sizeFilter || sizeFilter === 'todos') {
        return orig.apply(this, arguments);
      }

      // Filtrar productos temporalmente
      var backup = null;
      try {
        if (typeof products !== 'undefined' && Array.isArray(products)) {
          backup = products;
          products = products.filter(function (p) {
            var sizes = p.sizes || [];
            var oos = p.outOfStock || [];
            // Tiene la talla y no esta agotada
            return sizes.some(function (s) {
              return String(s) === String(sizeFilter) && oos.indexOf(s) < 0 && oos.indexOf(String(sizeFilter)) < 0;
            });
          });
        }
      } catch (e) {}

      try {
        return orig.apply(this, arguments);
      } finally {
        try {
          if (backup) products = backup;
        } catch (e) {}
      }
    };
  }

  function boot() {
    fillCatSelect();
    ensureSizeSelect();
    fillSizeSelect();
    patchFilterProducts();
    patchRenderProducts();

    var group = document.getElementById('catalogGroupFilter');
    var cat = document.getElementById('catalogCatFilter');
    var clearBtn = document.getElementById('catalogClearFilters');
    var sizeSel = document.getElementById('catalogSizeFilter');

    if (group) group.addEventListener('change', applyFromUI);
    if (cat) cat.addEventListener('change', applyFromUI);
    if (sizeSel) sizeSel.addEventListener('change', onSizeChange);
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
      ensureSizeSelect();
      fillSizeSelect();
      patchRenderProducts();
      syncSelectsAfterFilter();
      return;
    }
    tries++;
    setTimeout(waitProducts, 250);
  })();

  console.log('[Khaos] catalog-filters + talla listo');
})();
