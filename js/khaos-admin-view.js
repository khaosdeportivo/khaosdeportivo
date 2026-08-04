/**
 * khaos-admin-view.js — Modal de vista previa del producto (boton ojo)
 */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function ensureModal() {
    if (document.getElementById('khaosViewModal')) return;

    var style = document.createElement('style');
    style.id = 'khaosViewModalStyle';
    style.textContent =
      '#khaosViewModal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.65);padding:16px;}' +
      '#khaosViewModal.active{display:flex;}' +
      '#khaosViewModal .kvm-box{background:#16161f;border:1px solid rgba(212,175,55,.25);border-radius:16px;max-width:560px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5);}' +
      '#khaosViewModal .kvm-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.06);}' +
      '#khaosViewModal .kvm-head h2{margin:0;font-size:16px;color:#f5c518;display:flex;align-items:center;gap:8px;}' +
      '#khaosViewModal .kvm-close{background:transparent;border:none;color:#aaa;font-size:18px;cursor:pointer;padding:6px;}' +
      '#khaosViewModal .kvm-close:hover{color:#fff;}' +
      '#khaosViewModal .kvm-body{padding:20px;}' +
      '#khaosViewModal .kvm-top{display:flex;gap:18px;flex-wrap:wrap;}' +
      '#khaosViewModal .kvm-img{width:160px;height:160px;object-fit:cover;border-radius:12px;background:#0f0f14;border:1px solid rgba(255,255,255,.08);}' +
      '#khaosViewModal .kvm-info{flex:1;min-width:180px;}' +
      '#khaosViewModal .kvm-name{font-size:18px;font-weight:800;color:#f5f5f5;margin:0 0 6px;}' +
      '#khaosViewModal .kvm-code{font-size:12px;color:#888;margin-bottom:10px;}' +
      '#khaosViewModal .kvm-price{font-size:22px;font-weight:900;color:#f5c518;}' +
      '#khaosViewModal .kvm-old{font-size:13px;color:#777;text-decoration:line-through;margin-left:8px;}' +
      '#khaosViewModal .kvm-section{margin-top:16px;}' +
      '#khaosViewModal .kvm-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888;margin-bottom:6px;}' +
      '#khaosViewModal .kvm-desc{font-size:13px;line-height:1.5;color:#ccc;white-space:pre-wrap;}' +
      '#khaosViewModal .kvm-pills{display:flex;flex-wrap:wrap;gap:6px;}' +
      '#khaosViewModal .kvm-pill{font-size:12px;padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);}' +
      '#khaosViewModal .kvm-pill.ok{background:rgba(34,197,94,.12);color:#4ade80;border-color:rgba(34,197,94,.3);}' +
      '#khaosViewModal .kvm-pill.out{background:rgba(239,68,68,.12);color:#f87171;border-color:rgba(239,68,68,.3);text-decoration:line-through;}' +
      '#khaosViewModal .kvm-foot{padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:10px;justify-content:flex-end;}' +
      '#khaosViewModal .kvm-btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:13px;}' +
      '#khaosViewModal .kvm-btn-sec{background:#2a2a35;color:#ddd;}' +
      '#khaosViewModal .kvm-btn-pri{background:linear-gradient(135deg,#f5c518,#d4af37);color:#111;}';
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.id = 'khaosViewModal';
    modal.innerHTML =
      '<div class="kvm-box" onclick="event.stopPropagation()">' +
      '<div class="kvm-head"><h2><i class="fas fa-eye"></i> Vista previa</h2>' +
      '<button type="button" class="kvm-close" id="khaosViewClose" aria-label="Cerrar"><i class="fas fa-times"></i></button></div>' +
      '<div class="kvm-body" id="khaosViewBody"></div>' +
      '<div class="kvm-foot">' +
      '<button type="button" class="kvm-btn kvm-btn-sec" id="khaosViewClose2">Cerrar</button>' +
      '<button type="button" class="kvm-btn kvm-btn-pri" id="khaosViewEdit"><i class="fas fa-pen"></i> Editar</button>' +
      '</div></div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function () { closeView(); });
    document.getElementById('khaosViewClose').onclick = function (e) { e.stopPropagation(); closeView(); };
    document.getElementById('khaosViewClose2').onclick = function (e) { e.stopPropagation(); closeView(); };
  }

  function closeView() {
    var m = document.getElementById('khaosViewModal');
    if (m) m.classList.remove('active');
    window.__khaosViewId = null;
  }

  function findProduct(id) {
    id = Number(id);
    var list = [];
    try {
      if (typeof products !== 'undefined' && Array.isArray(products)) list = products;
      else if (Array.isArray(window.products)) list = window.products;
    } catch (e) {
      list = Array.isArray(window.products) ? window.products : [];
    }
    return list.find(function (p) { return Number(p.id) === id; }) || null;
  }

  window.viewProduct = function viewProduct(id) {
    ensureModal();
    var p = findProduct(id);
    if (!p) {
      if (typeof showToast === 'function') showToast('Producto no encontrado', 'warning');
      return;
    }

    window.__khaosViewId = Number(p.id);

    var names = (typeof categoryNames !== 'undefined' && categoryNames) ? categoryNames : {};
    var bc = (typeof badgeConfig !== 'undefined' && badgeConfig) ? badgeConfig : {};
    var meta = { groupLabel: '', familyLabel: '' };
    try {
      if (typeof getCategoryMeta === 'function') meta = getCategoryMeta(p.category) || meta;
    } catch (e) {}

    var sizes = Array.isArray(p.sizes) ? p.sizes : [];
    var oos = Array.isArray(p.outOfStock) ? p.outOfStock : [];
    var price = Number(p.price) || 0;
    var oldPrice = p.oldPrice != null ? Number(p.oldPrice) : null;

    var sizesHtml = sizes.length
      ? sizes.map(function (s) {
          var out = oos.indexOf(s) >= 0;
          return '<span class="kvm-pill ' + (out ? 'out' : 'ok') + '">' + escapeHtml(s) + '</span>';
        }).join('')
      : '<span style="color:#888;font-size:13px;">Sin tallas</span>';

    var badgeHtml = '';
    if (p.badge && bc[p.badge]) {
      badgeHtml = '<span class="kvm-pill" style="background:' + (bc[p.badge].bg || '') + ';color:' + (bc[p.badge].color || '#fff') + ';">' +
        escapeHtml(bc[p.badge].label || p.badge) + '</span>';
    } else if (p.badge) {
      badgeHtml = '<span class="kvm-pill">' + escapeHtml(p.badge) + '</span>';
    } else {
      badgeHtml = '<span class="kvm-pill">Normal</span>';
    }

    var oldHtml = (oldPrice && oldPrice > price)
      ? '<span class="kvm-old">$' + oldPrice.toLocaleString('es-CO') + '</span>'
      : '';

    var catLabel = names[p.category] || p.category || '—';
    var path = [meta.groupLabel, meta.familyLabel].filter(Boolean).join(' › ');

    document.getElementById('khaosViewBody').innerHTML =
      '<div class="kvm-top">' +
      '<img class="kvm-img" src="' + escapeHtml(p.image || '') + '" alt="" onerror="this.style.opacity=\'0.25\'">' +
      '<div class="kvm-info">' +
      '<p class="kvm-name">' + escapeHtml(p.name || '') + '</p>' +
      '<div class="kvm-code">Codigo: ' + escapeHtml(p.code || '—') + ' · ID: ' + escapeHtml(p.id) + '</div>' +
      '<div class="kvm-price">$' + price.toLocaleString('es-CO') + oldHtml + '</div>' +
      '<div class="kvm-section"><div class="kvm-label">Categoria</div>' +
      '<div style="color:#eee;font-size:13px;">' + escapeHtml(catLabel) +
      (path ? ' <span style="color:#888;">(' + escapeHtml(path) + ')</span>' : '') +
      '</div></div>' +
      '<div class="kvm-section"><div class="kvm-label">Estado</div><div class="kvm-pills">' + badgeHtml + '</div></div>' +
      '</div></div>' +
      '<div class="kvm-section"><div class="kvm-label">Tallas</div><div class="kvm-pills">' + sizesHtml + '</div></div>' +
      '<div class="kvm-section"><div class="kvm-label">Descripcion</div>' +
      '<div class="kvm-desc">' + (p.desc ? escapeHtml(p.desc) : '<span style="color:#666;">Sin descripcion</span>') + '</div></div>';

    document.getElementById('khaosViewEdit').onclick = function (e) {
      e.stopPropagation();
      var vid = window.__khaosViewId;
      closeView();
      if (vid != null && typeof editProduct === 'function') editProduct(vid);
    };

    document.getElementById('khaosViewModal').classList.add('active');
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeView();
  });

  console.log('[Khaos] vista previa de producto lista');
})();
