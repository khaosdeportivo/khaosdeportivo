/**
 * Integra el motor gift con el sistema de cupones existente en shared.js
 * Debe cargarse DESPUÉS de shared.js y promo-gift.js
 */

(function() {
  // Guardar referencias originales
  var _origIsCouponApplicable = typeof isCouponApplicable === 'function' ? isCouponApplicable : null;
  var _origCalculateDiscount = typeof calculateDiscount === 'function' ? calculateDiscount : null;
  var _origApplyCoupon = typeof applyCoupon === 'function' ? applyCoupon : null;
  var _origUpdateCartUI = typeof updateCartUI === 'function' ? updateCartUI : null;
  var _origUpdateCouponHint = typeof updateCouponHint === 'function' ? updateCouponHint : null;

  // Extender isCouponApplicable para tipo gift
  window.isCouponApplicable = function(coupon, cartItems) {
    if (coupon && coupon.type === 'gift') {
      return isGiftCouponApplicable(coupon, cartItems);
    }
    if (_origIsCouponApplicable) return _origIsCouponApplicable(coupon, cartItems);
    return { applicable: true, eligibleSubtotal: typeof getCartSubtotal === 'function' ? getCartSubtotal() : 0 };
  };

  // Extender calculateDiscount para tipo gift
  window.calculateDiscount = function(coupon, eligibleSubtotal) {
    if (coupon && coupon.type === 'gift') {
      // Para gift, eligibleSubtotal ya puede traer giftDiscount desde isCouponApplicable
      // Recalcular siempre con el carrito actual para consistencia
      var result = calculateGiftDiscount(coupon, state.cart || []);
      return result.applicable ? result.discount : 0;
    }
    if (_origCalculateDiscount) return _origCalculateDiscount(coupon, eligibleSubtotal);
    return 0;
  };

  // Mejorar applyCoupon con mensajes gift
  window.applyCoupon = function() {
    var input = document.getElementById('couponInput');
    var code = input ? input.value.trim().toUpperCase() : '';
    if (!code) {
      if (typeof showCouponMessage === 'function') showCouponMessage('Ingresa un código de cupón', 'warning');
      return;
    }

    if (currentCoupon && currentCoupon.code === code) {
      if (typeof showCouponMessage === 'function') showCouponMessage('Este cupón ya está aplicado', 'warning');
      return;
    }

    if (typeof loadCouponsFromAdmin === 'function') loadCouponsFromAdmin();

    var coupon = availableCoupons.find(function(c) { return c.code === code; });
    if (!coupon) {
      if (typeof showCouponMessage === 'function') showCouponMessage('Cupón no encontrado', 'error');
      return;
    }

    var validation = isCouponValid(coupon);
    if (!validation.valid) {
      if (typeof showCouponMessage === 'function') showCouponMessage(validation.reason, 'error');
      return;
    }

    var subtotal = getCartSubtotal();
    if (subtotal < (coupon.minPurchase || 0)) {
      if (typeof showCouponMessage === 'function') showCouponMessage('Mínimo de compra: ' + formatPrice(coupon.minPurchase), 'warning');
      return;
    }

    var applicability = isCouponApplicable(coupon, state.cart);
    if (!applicability.applicable) {
      if (typeof showCouponMessage === 'function') showCouponMessage(applicability.reason, 'warning');
      return;
    }

    var discount = calculateDiscount(coupon, applicability.eligibleSubtotal);
    if (discount <= 0) {
      if (typeof showCouponMessage === 'function') showCouponMessage('Esta promo no genera descuento para tu carrito', 'warning');
      return;
    }

    currentCoupon = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: discount,
      eligibleSubtotal: applicability.eligibleSubtotal,
      giftCategory: coupon.giftCategory || null,
      giftQty: coupon.giftQty || 1,
      appliesTo: coupon.appliesTo || 'all'
    };

    try { localStorage.setItem('khaos_cart_coupon', JSON.stringify(currentCoupon)); } catch(e) {}

    if (typeof showCouponApplied === 'function') showCouponApplied(coupon, discount);
    if (typeof updateCartUI === 'function') updateCartUI();

    var msg = coupon.type === 'gift'
      ? 'Promo ' + coupon.code + ' aplicada: -' + formatPrice(discount) + ' en regalo'
      : 'Cupón ' + coupon.code + ' aplicado: -' + formatPrice(discount);
    if (typeof showToast === 'function') showToast(msg, 'success');
  };

  // Mostrar hints de gift en el carrito
  window.updateCouponHint = function() {
    if (_origUpdateCouponHint) _origUpdateCouponHint();

    var hint = document.getElementById('couponHint');
    if (!hint) return;

    // Si ya hay un cupón aplicado gift, no molestar
    if (currentCoupon && currentCoupon.type === 'gift') return;

    var giftHints = getGiftPromoHints(state.cart || []);
    if (giftHints.length > 0) {
      // Si el hint original no tiene contenido útil, mostrar gift
      var existing = hint.innerHTML || '';
      if (!existing || existing.indexOf('No hay cupones') >= 0 || !hint.classList.contains('show')) {
        hint.innerHTML = '🎁 ' + giftHints[0];
        hint.classList.add('show');
        hint.style.display = '';
      }
    }
  };

  // Recalcular descuento gift cuando cambia el carrito
  window.updateCartUI = function() {
    // Si hay cupón gift aplicado, recalcular con el carrito actual
    if (currentCoupon && currentCoupon.type === 'gift') {
      if (typeof loadCouponsFromAdmin === 'function') loadCouponsFromAdmin();
      var couponData = availableCoupons.find(function(c) { return c.code === currentCoupon.code; });
      if (couponData) {
        var app = isCouponApplicable(couponData, state.cart);
        if (app.applicable) {
          currentCoupon.discount = calculateDiscount(couponData, app.eligibleSubtotal);
          try { localStorage.setItem('khaos_cart_coupon', JSON.stringify(currentCoupon)); } catch(e) {}
        } else {
          // Ya no aplica: quitar
          if (typeof removeCoupon === 'function') removeCoupon();
          if (typeof showToast === 'function') showToast('La promo ya no aplica a tu carrito actual', 'info');
        }
      }
    }

    if (_origUpdateCartUI) _origUpdateCartUI();

    // Actualizar hints después de pintar el carrito
    if (typeof updateCouponHint === 'function') {
      try { updateCouponHint(); } catch(e) {}
    }
  };

  // Mejorar showCouponApplied para gift
  var _origShowCouponApplied = typeof showCouponApplied === 'function' ? showCouponApplied : null;
  window.showCouponApplied = function(coupon, discount) {
    if (_origShowCouponApplied) {
      _origShowCouponApplied(coupon, discount);
    }
    var valueEl = document.getElementById('couponAppliedValue');
    if (valueEl && coupon.type === 'gift') {
      var label = coupon.value >= 100 ? 'REGALO' : '-' + coupon.value + '% regalo';
      valueEl.textContent = label + ' (-' + (typeof formatPrice === 'function' ? formatPrice(discount) : discount) + ')';
    }
  };
})();
