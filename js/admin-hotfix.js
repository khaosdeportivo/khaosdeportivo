/* Khaos admin hotfix: oldPrice null + coupon stats missing DOM */
(function () {
  function safeLocale(n) {
    return Number(n || 0).toLocaleString('es-CO');
  }

  function patchRenderTable() {
    if (typeof renderTable !== 'function') return false;
    var original = renderTable;
    window.renderTable = function () {
      try {
        var tbody = document.getElementById('productsTableBody');
        if (!tbody) return;
        if (!products || !products.length) {
          tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>No hay productos</h3></div></td></tr>';
          return;
        }
        // Normalize null oldPrice so original map never crashes
        products.forEach(function (p) {
          if (p.oldPrice == null) p.oldPrice = 0;
          if (!Array.isArray(p.sizes)) p.sizes = [];
          if (!Array.isArray(p.outOfStock)) p.outOfStock = [];
        });
        return original.apply(this, arguments);
      } catch (e) {
        console.error('[hotfix] renderTable', e);
        var tb = document.getElementById('productsTableBody');
        if (tb) {
          tb.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>Error al renderizar</h3><p>' + e.message + '</p></div></td></tr>';
        }
      }
    };
    return true;
  }

  function patchCouponStats() {
    if (typeof updateCouponStats !== 'function') return false;
    window.updateCouponStats = function () {
      try {
        var setText = function (id, val) {
          var el = document.getElementById(id);
          if (el) el.textContent = val;
        };
        var total = (typeof coupons !== 'undefined' && coupons) ? coupons.length : 0;
        var active = 0, used = 0, saved = 0;
        if (typeof coupons !== 'undefined' && Array.isArray(coupons)) {
          active = coupons.filter(function (c) {
            return typeof isCouponActive === 'function' ? isCouponActive(c) : !!c.active;
          }).length;
          used = coupons.reduce(function (s, c) { return s + (c.usedCount || 0); }, 0);
          saved = coupons.reduce(function (s, c) { return s + (c.totalSaved || 0); }, 0);
        }
        setText('couponTotal', total);
        setText('couponActive', active);
        setText('couponUsed', used);
        setText('couponSaved', '$' + safeLocale(saved));
        var badge = document.getElementById('sidebarCouponCount');
        if (badge) {
          badge.textContent = active;
          badge.style.display = active > 0 ? 'flex' : 'none';
        }
        setText('tabCouponAll', total);
        setText('tabCouponActive', active);
      } catch (e) {
        console.warn('[hotfix] updateCouponStats', e);
      }
    };
    return true;
  }

  function removeJunk() {
    if (!Array.isArray(products)) return;
    var before = products.length;
    products = products.filter(function (p) {
      return p.id !== 71 && p.id !== 72 && p.id !== 73;
    });
    window.products = products;
    if (products.length !== before) {
      try {
        localStorage.setItem('khaos_admin_products', JSON.stringify(products));
      } catch (e) {}
      console.log('[hotfix] Eliminados productos basura. Quedan:', products.length);
    }
  }

  function apply() {
    patchCouponStats();
    patchRenderTable();
    removeJunk();
    if (typeof renderTable === 'function') {
      try { renderTable(); } catch (e) {}
    }
    if (typeof updateAllStats === 'function') {
      try { updateAllStats(); } catch (e) {}
    }
    console.log('[Khaos hotfix] aplicado');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(apply, 400);
    });
  } else {
    setTimeout(apply, 400);
  }
})();
