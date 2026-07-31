/**
 * Extiende el admin de cupones para tipo "gift" (regalo/combo).
 * Cargar DESPUÉS de admin.js
 *
 * Campos extra en cupones gift:
 * - type: 'gift'
 * - value: % descuento sobre el regalo (100 = gratis)
 * - appliesTo: qué debe comprar el cliente (calzado | guayo | sintetica | futsal | zapatillas)
 * - giftCategory: qué regalo (medias | canilleras | bolsos | accesorios)
 * - giftQty: cuántas unidades de regalo (default 1)
 */

(function() {
  // --- UI: añadir campos al modal de cupones ---
  function ensureGiftFields() {
    var modalBody = document.querySelector('#couponModalOverlay .modal-body');
    if (!modalBody || document.getElementById('giftFieldsGroup')) return;

    // Extender select de tipo
    var typeSelect = document.getElementById('couponType');
    if (typeSelect && !typeSelect.querySelector('option[value="gift"]')) {
      var opt = document.createElement('option');
      opt.value = 'gift';
      opt.textContent = 'Regalo / Combo';
      typeSelect.appendChild(opt);
    }

    // Extender appliesTo con "calzado"
    var applies = document.getElementById('couponAppliesTo');
    if (applies && !applies.querySelector('option[value="calzado"]')) {
      var o = document.createElement('option');
      o.value = 'calzado';
      o.textContent = 'Cualquier par (calzado)';
      // Insertar después de "Todos"
      if (applies.options.length > 1) {
        applies.insertBefore(o, applies.options[1]);
      } else {
        applies.appendChild(o);
      }
    }

    // Grupo de campos gift
    var group = document.createElement('div');
    group.id = 'giftFieldsGroup';
    group.style.display = 'none';
    group.innerHTML =
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label>Regalo (accesorio)</label>' +
          '<select class="form-select" id="couponGiftCategory">' +
            '<option value="medias">Medias</option>' +
            '<option value="canilleras">Canilleras</option>' +
            '<option value="bolsos">Bolsos</option>' +
            '<option value="accesorios">Cualquier accesorio</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Cant. regalo</label>' +
          '<input type="number" class="form-input" id="couponGiftQty" value="1" min="1" max="5">' +
        '</div>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--fog);margin:0 0 12px;">' +
        'El cliente debe agregar el regalo al carrito. Valor = % de descuento sobre el regalo (100 = gratis).' +
      '</p>';

    // Insertar antes del toggle activo
    var activeToggle = document.getElementById('couponActiveToggle');
    if (activeToggle && activeToggle.parentElement) {
      activeToggle.parentElement.parentElement.insertBefore(group, activeToggle.parentElement);
    } else {
      modalBody.appendChild(group);
    }

    // Toggle visibilidad al cambiar tipo
    if (typeSelect) {
      typeSelect.addEventListener('change', onCouponTypeChange);
    }
  }

  function onCouponTypeChange() {
    var type = document.getElementById('couponType').value;
    var giftGroup = document.getElementById('giftFieldsGroup');
    var valueLabel = document.querySelector('label[for="couponValue"]');
    // Buscar label del valor de forma más flexible
    var valueInput = document.getElementById('couponValue');
    var valueGroup = valueInput ? valueInput.closest('.form-group') : null;

    if (giftGroup) {
      giftGroup.style.display = type === 'gift' ? '' : 'none';
    }
    if (valueGroup) {
      var lab = valueGroup.querySelector('label');
      if (lab) {
        lab.textContent = type === 'gift' ? '% dto. regalo (100=gratis)' : (type === 'percentage' ? 'Valor %' : 'Valor $');
      }
    }
    if (type === 'gift' && valueInput && !valueInput.value) {
      valueInput.value = '100';
    }
  }

  // --- Patch openCouponModal ---
  var _openCouponModal = window.openCouponModal;
  window.openCouponModal = function() {
    ensureGiftFields();
    if (_openCouponModal) _openCouponModal();
    var gc = document.getElementById('couponGiftCategory');
    var gq = document.getElementById('couponGiftQty');
    if (gc) gc.value = 'medias';
    if (gq) gq.value = '1';
    onCouponTypeChange();
  };

  // --- Patch editCoupon ---
  var _editCoupon = window.editCoupon;
  window.editCoupon = function(id) {
    ensureGiftFields();
    if (_editCoupon) _editCoupon(id);
    var c = (typeof coupons !== 'undefined') ? coupons.find(function(x) { return x.id === id; }) : null;
    if (c) {
      var gc = document.getElementById('couponGiftCategory');
      var gq = document.getElementById('couponGiftQty');
      if (gc) gc.value = c.giftCategory || 'medias';
      if (gq) gq.value = c.giftQty || 1;
    }
    onCouponTypeChange();
  };

  // --- Patch saveCoupon ---
  var _saveCoupon = window.saveCoupon;
  window.saveCoupon = function() {
    ensureGiftFields();
    var type = document.getElementById('couponType').value;

    // Validación específica gift
    if (type === 'gift') {
      var value = parseInt(document.getElementById('couponValue').value) || 0;
      if (value <= 0 || value > 100) {
        showToast('Para regalo, el valor debe ser entre 1 y 100 (% dto.)', 'error');
        return;
      }
    }

    // Llamar original — pero necesitamos inyectar giftCategory/giftQty
    // Estrategia: interceptar el push/update después
    var editId = document.getElementById('editCouponId').value;
    var code = document.getElementById('couponCode').value.trim().toUpperCase();
    var giftCategory = document.getElementById('couponGiftCategory')
      ? document.getElementById('couponGiftCategory').value
      : 'medias';
    var giftQty = document.getElementById('couponGiftQty')
      ? parseInt(document.getElementById('couponGiftQty').value) || 1
      : 1;

    if (_saveCoupon) _saveCoupon();

    // Después de guardar, enriquecer el cupón gift
    if (type === 'gift' && typeof coupons !== 'undefined') {
      var c = coupons.find(function(x) {
        return x.code === code || (editId && x.id == editId);
      });
      if (c) {
        c.type = 'gift';
        c.giftCategory = giftCategory;
        c.giftQty = giftQty;
        // appliesTo ya se guardó desde el select
        if (typeof saveCoupons === 'function') saveCoupons();
      }
    }
  };

  // --- Mejorar render de tabla para gift ---
  var _renderCoupons = window.renderCoupons;
  window.renderCoupons = function() {
    if (_renderCoupons) _renderCoupons();
    // Anotar visualmente filas gift si es posible
    try {
      var tbody = document.getElementById('couponsTableBody');
      if (!tbody || typeof coupons === 'undefined') return;
      // No re-renderizar todo; solo es informativo
    } catch(e) {}
  };

  // Init al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureGiftFields);
  } else {
    setTimeout(ensureGiftFields, 500);
  }
})();
