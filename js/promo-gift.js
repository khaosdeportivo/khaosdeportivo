/**
 * Khaos Deportivo — Motor de promociones tipo REGALO / COMBO
 *
 * Tipo "gift": al comprar al menos 1 producto de la familia disparadora
 * (guayo, sintética, futsal, zapatillas o calzado), se descuenta el
 * accesorio regalo (medias, canilleras, bolsos) que esté en el carrito.
 *
 * NO implementa 2x1 por decisión de rentabilidad.
 *
 * El cliente debe agregar el regalo al carrito; el descuento se aplica solo.
 * Tú confirmas stock y total por WhatsApp.
 */

// Familias de calzado que pueden disparar el regalo
var PROMO_SHOE_FAMILIES = ['guayo', 'sintetica', 'futsal', 'zapatillas'];

// Categorías de accesorio que pueden ser regalo
var PROMO_GIFT_CATEGORIES = ['medias', 'canilleras', 'bolsos'];

/**
 * ¿El item del carrito pertenece a una familia de calzado?
 */
function isShoeCartItem(item) {
  var product = products.find(function(p) { return p.id === item.id; });
  if (!product) return false;
  var meta = getCategoryMeta(product.category);
  return PROMO_SHOE_FAMILIES.indexOf(meta.family) >= 0;
}

/**
 * ¿El item es de la categoría regalo indicada?
 * giftCategory puede ser: 'medias' | 'canilleras' | 'bolsos' | 'accesorios'
 */
function isGiftCartItem(item, giftCategory) {
  var product = products.find(function(p) { return p.id === item.id; });
  if (!product) return false;
  if (giftCategory === 'accesorios') {
    return PROMO_GIFT_CATEGORIES.indexOf(product.category) >= 0;
  }
  return product.category === giftCategory;
}

/**
 * ¿Hay al menos 1 calzado que dispare la promo?
 * triggerAppliesTo: 'all' | 'calzado' | 'guayo' | 'sintetica' | 'futsal' | 'zapatillas'
 */
function cartHasTrigger(cartItems, triggerAppliesTo) {
  for (var i = 0; i < cartItems.length; i++) {
    var item = cartItems[i];
    var product = products.find(function(p) { return p.id === item.id; });
    if (!product) continue;
    var meta = getCategoryMeta(product.category);

    if (triggerAppliesTo === 'all' || triggerAppliesTo === 'calzado') {
      if (PROMO_SHOE_FAMILIES.indexOf(meta.family) >= 0) return true;
    } else if (triggerAppliesTo === meta.family) {
      return true;
    }
  }
  return false;
}

/**
 * Calcula el descuento de una promo tipo gift sobre el carrito.
 * Devuelve { applicable, discount, reason, giftLabel, freeUnits }
 */
function calculateGiftDiscount(coupon, cartItems) {
  if (!coupon || coupon.type !== 'gift') {
    return { applicable: false, discount: 0, reason: 'No es promo de regalo' };
  }

  var trigger = coupon.appliesTo || 'calzado';
  var giftCat = coupon.giftCategory || 'medias';
  var maxUnits = coupon.giftQty > 0 ? coupon.giftQty : 1;
  // value = % de descuento sobre el regalo (100 = gratis)
  var pct = typeof coupon.value === 'number' ? coupon.value : 100;
  if (pct <= 0) pct = 100;
  if (pct > 100) pct = 100;

  if (!cartHasTrigger(cartItems, trigger)) {
    return {
      applicable: false,
      discount: 0,
      reason: 'Agrega un par (guayo, sintética, futsal o zapatillas) para activar esta promo'
    };
  }

  // Expandir unidades de regalo en el carrito (precio unitario cada una)
  var giftUnits = [];
  for (var i = 0; i < cartItems.length; i++) {
    var item = cartItems[i];
    if (!isGiftCartItem(item, giftCat)) continue;
    for (var q = 0; q < item.qty; q++) {
      giftUnits.push({ price: item.price, name: item.name, category: item.category });
    }
  }

  if (giftUnits.length === 0) {
    var labels = {
      medias: 'medias',
      canilleras: 'canilleras',
      bolsos: 'bolsos',
      accesorios: 'un accesorio (medias, canilleras o bolsos)'
    };
    return {
      applicable: false,
      discount: 0,
      reason: 'Agrega ' + (labels[giftCat] || giftCat) + ' al carrito para obtener el regalo'
    };
  }

  // Descontar las unidades más baratas (hasta maxUnits)
  giftUnits.sort(function(a, b) { return a.price - b.price; });
  var freeCount = Math.min(maxUnits, giftUnits.length);
  var discount = 0;
  for (var j = 0; j < freeCount; j++) {
    discount += Math.round(giftUnits[j].price * pct / 100);
  }

  var giftLabel = giftCat === 'accesorios' ? 'accesorio' : giftCat;
  return {
    applicable: true,
    discount: discount,
    reason: null,
    giftLabel: giftLabel,
    freeUnits: freeCount,
    pct: pct
  };
}

/**
 * Integra gift en isCouponApplicable.
 */
function isGiftCouponApplicable(coupon, cartItems) {
  var result = calculateGiftDiscount(coupon, cartItems);
  if (!result.applicable) {
    return { applicable: false, reason: result.reason, eligibleSubtotal: 0 };
  }
  return {
    applicable: true,
    eligibleSubtotal: result.discount,
    giftDiscount: result.discount,
    giftMeta: result
  };
}

/**
 * Mensajes de ayuda en el carrito cuando hay promos gift activas
 * pero el carrito aún no cumple (falta par o falta el accesorio).
 */
function getGiftPromoHints(cartItems) {
  if (typeof availableCoupons === 'undefined' || !availableCoupons.length) return [];
  var hints = [];
  availableCoupons.forEach(function(c) {
    if (c.type !== 'gift' || !c.active) return;
    var validation = typeof isCouponValid === 'function' ? isCouponValid(c) : { valid: true };
    if (!validation.valid) return;

    var hasTrigger = cartHasTrigger(cartItems, c.appliesTo || 'calzado');
    var giftCat = c.giftCategory || 'medias';
    var hasGift = false;
    for (var i = 0; i < cartItems.length; i++) {
      if (isGiftCartItem(cartItems[i], giftCat)) { hasGift = true; break; }
    }

    var label = giftCat === 'accesorios' ? 'accesorio' : giftCat;
    if (!hasTrigger && !hasGift) {
      hints.push('Promo ' + c.code + ': compra un par y lleva ' + label + ' ' + (c.value >= 100 ? 'GRATIS' : 'con -' + c.value + '%'));
    } else if (hasTrigger && !hasGift) {
      hints.push('Ya tienes el par! Agrega ' + label + ' y ' + (c.value >= 100 ? 'salen GRATIS' : 'tienen -' + c.value + '%') + ' (' + c.code + ')');
    } else if (!hasTrigger && hasGift) {
      hints.push('Agrega un par para que tus ' + label + ' salgan ' + (c.value >= 100 ? 'gratis' : 'con descuento') + ' (' + c.code + ')');
    }
  });
  return hints;
}
