/**
 * khaos-admin-core.js — UNICO modulo de persistencia del admin
 * Sobrescribe: loadProducts, saveProducts, saveProduct, deleteProduct, syncToGithub
 */
(function () {
  'use strict';

  var syncLock = false;
  var syncQueued = false;

  function getToken() {
    try { return localStorage.getItem('khaos_github_token') || ''; } catch (e) { return ''; }
  }

  function getRev() {
    try { return localStorage.getItem('khaos_local_revision') || '0'; } catch (e) { return '0'; }
  }

  function markDirty() {
    try {
      localStorage.setItem('khaos_admin_products', JSON.stringify(window.products || []));
      localStorage.setItem('khaos_local_revision', String(Date.now()));
      localStorage.setItem('khaos_pending_sync', '1');
    } catch (e) {}
  }

  window.saveProducts = function saveProducts() {
    markDirty();
    try { if (typeof updateAllStats === 'function') updateAllStats(); } catch (e) {}
    try { if (typeof renderTable === 'function') renderTable(); } catch (e) {}
    try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
    try { if (typeof renderCategoriesView === 'function') renderCategoriesView(); } catch (e) {}
    try { if (typeof renderInventory === 'function') renderInventory(); } catch (e) {}
    try { if (typeof updateCharts === 'function') updateCharts(); } catch (e) {}
  };

  window.loadProducts = async function loadProducts() {
    function applyList(list) {
      window.products = Array.isArray(list) ? list : [];
      try {
        window.nextId = window.products.length
          ? Math.max.apply(null, window.products.map(function (p) { return p.id || 0; }).concat([0])) + 1
          : 1;
      } catch (e) { window.nextId = 1; }
      try { localStorage.setItem('khaos_admin_products', JSON.stringify(window.products)); } catch (e) {}
    }

    try {
      if (localStorage.getItem('khaos_pending_sync') === '1') {
        var saved = localStorage.getItem('khaos_admin_products');
        if (saved) {
          var parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length) {
            applyList(parsed);
            console.log('[Khaos] load: local pendiente', window.products.length);
            setTimeout(function () { window.syncToGithub().catch(function () {}); }, 600);
            return;
          }
        }
      }
    } catch (e) {}

    try {
      var res = await fetch(
        'https://raw.githubusercontent.com/khaosdeportivo/khaosdeportivo/main/productos.json?t=' + Date.now(),
        { cache: 'no-store' }
      );
      if (res.ok) {
        var data = await res.json();
        var list = Array.isArray(data) ? data : (data.productos || []);
        if (list.length) {
          applyList(list);
          if (data.cupones && Array.isArray(data.cupones)) {
            try { window.coupons = data.cupones; } catch (e) {}
          }
          try { localStorage.setItem('khaos_pending_sync', '0'); } catch (e) {}
          console.log('[Khaos] load: github', window.products.length);
          return;
        }
      }
    } catch (e) {
      console.warn('[Khaos] github load fail', e);
    }

    try {
      var s2 = localStorage.getItem('khaos_admin_products');
      if (s2) {
        var p2 = JSON.parse(s2);
        if (Array.isArray(p2) && p2.length) {
          applyList(p2);
          console.log('[Khaos] load: localStorage', window.products.length);
          return;
        }
      }
    } catch (e) {}

    window.products = [];
    window.nextId = 1;
  };

  window.syncToGithub = async function syncToGithub() {
    var token = getToken();
    if (!token) {
      if (typeof showToast === 'function') showToast('Token no configurado. Ve a Ajustes.', 'error');
      return;
    }
    if (syncLock) { syncQueued = true; return; }
    syncLock = true;
    syncQueued = false;

    if (typeof showLoading === 'function') showLoading('Sincronizando con GitHub...');
    var startedRev = getRev();
    var cfg = window.GITHUB_CONFIG || {
      owner: 'khaosdeportivo', repo: 'khaosdeportivo', branch: 'main',
      path: 'productos.json', apiBase: 'https://api.github.com'
    };

    try {
      var lastError = null;
      for (var attempt = 1; attempt <= 4; attempt++) {
        var prods = Array.isArray(window.products) ? window.products.slice() : [];
        var cups = Array.isArray(window.coupons) ? window.coupons.slice() : [];
        try { localStorage.setItem('khaos_admin_products', JSON.stringify(prods)); } catch (e) {}

        var content = {
          productos: prods,
          cupones: cups,
          fechaActualizacion: new Date().toISOString(),
          version: 1
        };
        var base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

        var sha = null;
        try {
          var getRes = await fetch(
            cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path +
              '?ref=' + cfg.branch + '&t=' + Date.now(),
            { headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' }, cache: 'no-store' }
          );
          if (getRes.ok) {
            var meta = await getRes.json();
            sha = meta.sha;
          }
        } catch (e) {}

        var body = {
          message: 'Actualizacion catalogo — ' + new Date().toLocaleString('es-CO') + ' (' + prods.length + ' productos)',
          content: base64Content,
          branch: cfg.branch
        };
        if (sha) body.sha = sha;

        var putRes = await fetch(
          cfg.apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path,
          {
            method: 'PUT',
            headers: {
              Authorization: 'token ' + token,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          }
        );

        if (putRes.ok || putRes.status === 201) {
          var endRev = getRev();
          try { localStorage.setItem('khaos_last_sync', new Date().toISOString()); } catch (e) {}
          try {
            var el = document.getElementById('githubLastSync');
            if (el) el.textContent = new Date().toLocaleString('es-CO');
          } catch (e) {}

          if (endRev === startedRev) {
            try { localStorage.setItem('khaos_pending_sync', '0'); } catch (e) {}
            if (typeof showToast === 'function') showToast('Guardado en GitHub (' + prods.length + ' productos)', 'success');
          } else {
            try { localStorage.setItem('khaos_pending_sync', '1'); } catch (e) {}
            syncQueued = true;
            if (typeof showToast === 'function') showToast('Guardado. Re-sincronizando cambios nuevos...', 'info');
          }
          return true;
        }

        var err = {};
        try { err = await putRes.json(); } catch (e) {}
        lastError = err.message || ('HTTP ' + putRes.status);
        if (putRes.status === 409 || /does not match/i.test(String(lastError))) {
          await new Promise(function (r) { setTimeout(r, 350 * attempt); });
          continue;
        }
        break;
      }
      try { localStorage.setItem('khaos_pending_sync', '1'); } catch (e) {}
      if (typeof showToast === 'function') {
        showToast('Error GitHub: ' + (lastError || '?') + '. Cambios siguen en este navegador.', 'error');
      }
      throw new Error(lastError || 'Sync fallo');
    } finally {
      syncLock = false;
      if (typeof hideLoading === 'function') hideLoading();
      if (syncQueued) {
        syncQueued = false;
        setTimeout(function () { window.syncToGithub().catch(function () {}); }, 400);
      }
    }
  };

  function patchSaveProduct() {
    if (typeof window.saveProduct !== 'function' || window.__khaosSaveProductCore) return;
    window.__khaosSaveProductCore = true;
    var orig = window.saveProduct;
    window.saveProduct = function () {
      var r = orig.apply(this, arguments);
      markDirty();
      setTimeout(function () { window.syncToGithub().catch(function () {}); }, 200);
      return r;
    };
  }

  window.deleteProduct = function deleteProduct(id) {
    function doDel() {
      id = Number(id);
      var before = (window.products || []).length;
      window.products = (window.products || []).filter(function (p) { return Number(p.id) !== id; });
      try { if (window.selectedIds && window.selectedIds.delete) window.selectedIds.delete(id); } catch (e) {}
      window.saveProducts();
      try { if (typeof renderCategoryChips === 'function') renderCategoryChips(); } catch (e) {}
      if (typeof showToast === 'function') {
        showToast(window.products.length < before ? 'Producto eliminado. Guardando...' : 'No encontrado', 'info');
      }
      if (window.products.length < before) window.syncToGithub().catch(function () {});
    }
    if (typeof showConfirm === 'function') {
      try {
        showConfirm('Eliminar producto', 'Eliminar este producto? Se guardara en GitHub.', doDel);
        return;
      } catch (e) {}
    }
    if (window.confirm('Eliminar este producto?')) doDel();
  };

  function placeSaveBtn() {
    var view = document.getElementById('view-products');
    if (!view) return;
    var toolbar = view.querySelector('.toolbar');
    if (!toolbar || document.getElementById('btnGuardarCambios')) return;
    var btn = document.createElement('button');
    btn.id = 'btnGuardarCambios';
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.style.cssText = 'background:linear-gradient(135deg,#22c55e,#16a34a);border:none;color:#fff;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;';
    btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
    btn.onclick = function () {
      markDirty();
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      Promise.resolve(window.syncToGithub()).then(function () {
        btn.innerHTML = '<i class="fas fa-check"></i> Guardado!';
        setTimeout(function () {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
        }, 2000);
      }).catch(function () {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
        setTimeout(function () {
          btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar cambios</span>';
        }, 2500);
      });
    };
    toolbar.insertBefore(btn, toolbar.firstChild);
  }

  function boot() {
    patchSaveProduct();
    placeSaveBtn();
    if (typeof window.loadProducts === 'function') {
      Promise.resolve(window.loadProducts()).then(function () {
        try { if (typeof renderTable === 'function') renderTable(); } catch (e) {}
        try { if (typeof updateAllStats === 'function') updateAllStats(); } catch (e) {}
        try { if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
        try { if (typeof renderSidebarCategories === 'function') renderSidebarCategories(); } catch (e) {}
        try { if (typeof renderCategoryChips === 'function') renderCategoryChips(); } catch (e) {}
        console.log('[Khaos] core boot — productos:', (window.products || []).length);
      });
    }
  }

  var tries = 0;
  (function wait() {
    if (typeof window.saveProduct === 'function' || tries > 40) {
      boot();
      setInterval(function () { placeSaveBtn(); patchSaveProduct(); }, 1500);
      return;
    }
    tries++;
    setTimeout(wait, 200);
  })();

  console.log('[Khaos] khaos-admin-core.js listo');
})();
