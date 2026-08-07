/**
 * admin-hotfix.js — protege updateCouponStats y otros accesos a DOM faltante
 */
(function () {
  function safeText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  function safeStyle(id, prop, value) {
    var el = document.getElementById(id);
    if (el && el.style) el.style[prop] = value;
  }

  function patch() {
    if (typeof window.updateCouponStats !== 'function') {
      return false;
    }

    window.updateCouponStats = function updateCouponStats() {
      try {
        var list = (typeof coupons !== 'undefined' && Array.isArray(coupons)) ? coupons : [];
        var total = list.length;
        var active = list.filter(function (c) {
          return typeof isCouponActive === 'function' ? isCouponActive(c) : true;
        }).length;
        var used = list.reduce(function (s, c) { return s + (c.usedCount || 0); }, 0);
        var saved = list.reduce(function (s, c) { return s + (c.totalSaved || 0); }, 0);

        safeText('couponTotal', total);
        safeText('couponActive', active);
        safeText('couponUsed', used);
        safeText('couponSaved', '$' + Number(saved).toLocaleString('es-CO'));
        safeText('sidebarCouponCount', active);
        safeStyle('sidebarCouponCount', 'display', active > 0 ? 'flex' : 'none');
        safeText('tabCouponAll', total);
        safeText('tabCouponActive', active);
        safeText('tabCouponExpired', list.filter(function (c) {
          return typeof isCouponExpired === 'function' && isCouponExpired(c);
        }).length);
        safeText('tabCouponPct', list.filter(function (c) { return c.type === 'percentage'; }).length);
        safeText('tabCouponFixed', list.filter(function (c) { return c.type === 'fixed'; }).length);
      } catch (e) {
        console.warn('[Khaos] updateCouponStats safe', e);
      }
    };

    try { window.updateCouponStats(); } catch (e) {}
    console.log('[Khaos] admin-hotfix: updateCouponStats protegido');
    return true;
  }

  var tries = 0;
  var t = setInterval(function () {
    tries++;
    if (patch() || tries > 40) clearInterval(t);
  }, 100);
})();
