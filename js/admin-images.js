/**
 * Rediseño del panel: subida de imágenes por arrastrar-y-soltar, portada,
 * reordenar, vista previa en vivo de la tarjeta de la tienda, y el estado
 * Publicado/Sin publicar por producto (comparado contra la última vez que
 * se publicó el catálogo, no contra un contador que se pueda desincronizar).
 *
 * Sigue el mismo patrón que admin-promo-gift.js: un archivo aparte que se
 * engancha a las funciones y al DOM que ya existen, en vez de tocar los
 * archivos grandes más de lo necesario.
 */
(function () {
  var MAX_IMAGES = 6;
  var MAX_DIM = 900;
  var JPEG_QUALITY = 0.72;

  var state = { images: [] };
  var dragSrcIndex = null;

  function isDriveUrl(u) {
    return typeof u === 'string' && u.indexOf('drive.google.com') !== -1;
  }

  function showToastSafe(msg) {
    try {
      if (typeof showToast === 'function') showToast(msg, 'warning');
    } catch (e) {}
  }

  function escapeHtmlSafe(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ===== Compresión de imágenes subidas (para no llenar la base de datos de fotos enormes) ===== */
  function compressImageFile(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width,
          h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w >= h) {
            h = Math.round(h * (MAX_DIM / w));
            w = MAX_DIM;
          } else {
            w = Math.round(w * (MAX_DIM / h));
            h = MAX_DIM;
          }
        }
        try {
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          cb(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch (err) {
          cb(e.target.result);
        }
      };
      img.onerror = function () {
        cb(null);
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      cb(null);
    };
    reader.readAsDataURL(file);
  }

  /* ===== Grid de miniaturas: portada, reordenar arrastrando, quitar ===== */
  function renderThumbs() {
    var grid = document.getElementById('imageThumbGrid');
    var emptyHint = document.getElementById('imageHintEmpty');
    if (!grid) return;

    if (state.images.length === 0) {
      grid.innerHTML = '';
      if (emptyHint) emptyHint.style.display = 'block';
    } else {
      if (emptyHint) emptyHint.style.display = 'none';
      grid.innerHTML = state.images
        .map(function (url, i) {
          return (
            '<div class="image-thumb' + (i === 0 ? ' cover' : '') + '" draggable="true" data-idx="' + i + '">' +
            '<img src="' + url + '" alt="">' +
            (i === 0 ? '<span class="image-thumb-cover-tag"><i class="fas fa-star"></i> Portada</span>' : '') +
            (isDriveUrl(url) ? '<span class="image-thumb-drive-warning" title="Alojada en Google Drive — puede dejar de cargar"><i class="fas fa-exclamation-triangle"></i></span>' : '') +
            '<div class="image-thumb-actions">' +
            (i !== 0 ? '<button type="button" onclick="ImageManager.setCover(' + i + ')" title="Marcar como portada"><i class="fas fa-star"></i></button>' : '') +
            '<button type="button" onclick="ImageManager.removeAt(' + i + ')" title="Quitar imagen"><i class="fas fa-trash"></i></button>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');
      wireDragEvents(grid);
    }
    if (typeof window.updateLivePreview === 'function') window.updateLivePreview();
  }

  function wireDragEvents(grid) {
    var items = grid.querySelectorAll('.image-thumb');
    items.forEach(function (el) {
      el.addEventListener('dragstart', function () {
        dragSrcIndex = parseInt(el.getAttribute('data-idx'), 10);
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', function () {
        el.classList.remove('dragging');
      });
      el.addEventListener('dragover', function (e) {
        e.preventDefault();
        el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', function () {
        el.classList.remove('drag-over');
      });
      el.addEventListener('drop', function (e) {
        e.preventDefault();
        el.classList.remove('drag-over');
        var targetIdx = parseInt(el.getAttribute('data-idx'), 10);
        if (dragSrcIndex === null || dragSrcIndex === targetIdx) return;
        var moved = state.images.splice(dragSrcIndex, 1)[0];
        state.images.splice(targetIdx, 0, moved);
        dragSrcIndex = null;
        renderThumbs();
      });
    });
  }

  window.ImageManager = {
    reset: function () {
      state.images = [];
      renderThumbs();
    },
    load: function (images) {
      state.images = Array.isArray(images) ? images.filter(Boolean).slice(0, MAX_IMAGES) : [];
      renderThumbs();
    },
    getImages: function () {
      return state.images.slice();
    },
    setCover: function (idx) {
      if (idx <= 0 || idx >= state.images.length) return;
      var item = state.images.splice(idx, 1)[0];
      state.images.unshift(item);
      renderThumbs();
    },
    removeAt: function (idx) {
      state.images.splice(idx, 1);
      renderThumbs();
    },
    addUrl: function (url) {
      url = (url || '').trim();
      if (!url) return;
      if (state.images.length >= MAX_IMAGES) {
        showToastSafe('Máximo ' + MAX_IMAGES + ' imágenes por producto');
        return;
      }
      state.images.push(url);
      renderThumbs();
    },
    addFiles: function (fileList) {
      var files = Array.prototype.slice.call(fileList || []);
      files.forEach(function (file) {
        if (!file.type || file.type.indexOf('image/') !== 0) return;
        if (state.images.length >= MAX_IMAGES) {
          showToastSafe('Máximo ' + MAX_IMAGES + ' imágenes por producto');
          return;
        }
        compressImageFile(file, function (dataUrl) {
          if (dataUrl) {
            state.images.push(dataUrl);
            renderThumbs();
          } else {
            showToastSafe('No se pudo procesar ' + file.name);
          }
        });
      });
    },
    render: renderThumbs,
  };

  function initDropzone() {
    var zone = document.getElementById('imageDropzone');
    var fileInput = document.getElementById('imageFileInput');
    var urlInput = document.getElementById('prodImageUrlInput');
    if (!zone || !fileInput) return;

    zone.addEventListener('click', function () {
      fileInput.click();
    });
    fileInput.addEventListener('change', function () {
      ImageManager.addFiles(fileInput.files);
      fileInput.value = '';
    });
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        ImageManager.addFiles(e.dataTransfer.files);
      } else if (e.dataTransfer) {
        var url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
        if (url) ImageManager.addUrl(url);
      }
    });
    if (urlInput) {
      urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          ImageManager.addUrl(urlInput.value);
          urlInput.value = '';
        }
      });
    }
  }

  /* ===== Vista previa en vivo: la misma tarjeta que ve el cliente en la tienda ===== */
  window.updateLivePreview = function () {
    var el = document.getElementById('productPreviewCard');
    if (!el) return;
    var nameEl = document.getElementById('prodName');
    var codeEl = document.getElementById('prodCode');
    var priceEl = document.getElementById('prodPrice');
    var oldPriceEl = document.getElementById('prodOldPrice');
    var badgeEl = document.getElementById('prodBadge');
    var categorySel = document.getElementById('prodCategory');

    var name = (nameEl && nameEl.value) || 'Nombre del producto';
    var code = (codeEl && codeEl.value) || 'REF';
    var priceRaw = parseInt(priceEl && priceEl.value) || 0;
    var oldPriceRaw = parseInt(oldPriceEl && oldPriceEl.value) || 0;
    var badge = (badgeEl && badgeEl.value) || '';
    var categoryLabel = categorySel && categorySel.options[categorySel.selectedIndex] ? categorySel.options[categorySel.selectedIndex].text : '';
    var images = window.ImageManager ? ImageManager.getImages() : [];
    var img = images[0] || '';
    var discount = oldPriceRaw > priceRaw && priceRaw > 0 ? Math.round((1 - priceRaw / oldPriceRaw) * 100) : 0;
    var badgeCfg = typeof badgeConfig !== 'undefined' ? badgeConfig[badge] : null;

    el.innerHTML =
      '<div class="product-card">' +
      (badgeCfg
        ? '<span class="product-card-badge" style="background:' + badgeCfg.bg + ';color:' + badgeCfg.color + ';border:1px solid ' + badgeCfg.border + ';">' + badgeCfg.emoji + ' ' + badgeCfg.label + '</span>'
        : '') +
      '<div class="product-card-img-wrap">' +
      (img ? '<img class="product-card-img" src="' + img + '" alt="">' : '<div class="preview-img-placeholder"><i class="fas fa-image"></i></div>') +
      '</div>' +
      '<div class="product-card-info">' +
      '<div class="product-card-category">' + escapeHtmlSafe(categoryLabel) + '</div>' +
      '<div class="product-card-name">' + escapeHtmlSafe(name) + '</div>' +
      '<div class="product-card-code">Ref: ' + escapeHtmlSafe(code) + '</div>' +
      '<div class="product-card-price-row">' +
      '<div class="product-card-price">$' + priceRaw.toLocaleString('es-CO') + '</div>' +
      (oldPriceRaw > priceRaw ? '<div class="product-card-old-price">$' + oldPriceRaw.toLocaleString('es-CO') + '</div>' : '') +
      (discount > 0 ? '<div class="product-card-discount">-' + discount + '%</div>' : '') +
      '</div>' +
      '</div>' +
      '</div>';
  };

  function wireLiveInputs() {
    ['prodName', 'prodCode', 'prodPrice', 'prodOldPrice', 'prodBadge', 'prodCategory'].forEach(function (id) {
      var elx = document.getElementById(id);
      if (elx) {
        elx.addEventListener('input', window.updateLivePreview);
        elx.addEventListener('change', window.updateLivePreview);
      }
    });
  }

  /* ===== Publicado / Sin publicar =====
   * Se compara contra "khaos_last_published": la foto del catálogo tal como
   * quedó la última vez que de verdad se publicó (o tal como llegó de la
   * base de datos al abrir el panel) — nunca un contador aparte que se
   * pudiera desincronizar.
   */
  window.PublishStatus = {
    KEY: 'khaos_last_published',
    getSnapshot: function () {
      try {
        var v = JSON.parse(localStorage.getItem(this.KEY) || '[]');
        return Array.isArray(v) ? v : [];
      } catch (e) {
        return [];
      }
    },
    markPublished: function (list) {
      try {
        localStorage.setItem(this.KEY, JSON.stringify(list || []));
      } catch (e) {}
      this.refreshUI();
    },
    normalize: function (p) {
      return {
        id: p.id,
        name: p.name || '',
        price: Number(p.price) || 0,
        oldPrice: Number(p.oldPrice) || 0,
        category: p.category || '',
        code: p.code || '',
        sizes: (p.sizes || []).slice().sort(),
        outOfStock: (p.outOfStock || []).slice().sort(),
        images: p.images && p.images.length ? p.images : p.image ? [p.image] : [],
        desc: p.desc || '',
        badge: p.badge || null,
      };
    },
    isProductPublished: function (p) {
      var snap = this.getSnapshot();
      var match = null;
      for (var i = 0; i < snap.length; i++) {
        if (snap[i].id === p.id) { match = snap[i]; break; }
      }
      if (!match) return false;
      return JSON.stringify(this.normalize(match)) === JSON.stringify(this.normalize(p));
    },
    countDirty: function () {
      if (typeof products === 'undefined' || !products) return 0;
      var self = this;
      var snap = this.getSnapshot();
      var currentIds = products.map(function (p) { return p.id; });
      var deletedCount = snap.filter(function (s) { return currentIds.indexOf(s.id) === -1; }).length;
      var editedOrNewCount = products.filter(function (p) { return !self.isProductPublished(p); }).length;
      return editedOrNewCount + deletedCount;
    },
    driveImageCount: function () {
      if (typeof products === 'undefined' || !products) return 0;
      return products.filter(function (p) {
        return (p.image && p.image.indexOf('drive.google.com') !== -1) || (p.images || []).some(function (u) { return u && u.indexOf('drive.google.com') !== -1; });
      }).length;
    },
    refreshUI: function () {
      renderPublishBanner(this.countDirty(), this.driveImageCount());
      // El estado por fila (Publicado / Sin publicar) se recalcula la próxima vez que se dibuje la tabla
    },
  };

  function renderPublishBanner(n, driveCount) {
    var el = document.getElementById('publishBanner');
    if (!el) return;
    var html = '';
    if (n > 0) {
      html +=
        '<div class="publish-banner dirty"><div><i class="fas fa-triangle-exclamation"></i> Tienes <strong>' +
        n +
        '</strong> cambio' + (n === 1 ? '' : 's') + ' sin publicar en el catálogo.</div><button class="btn btn-primary btn-sm" onclick="syncToGithub()"><i class="fas fa-cloud-upload-alt"></i> Publicar ahora</button></div>';
    } else {
      html += '<div class="publish-banner clean"><i class="fas fa-check-circle"></i> Todo el catálogo está publicado.</div>';
    }
    if (driveCount > 0) {
      html +=
        '<div class="publish-banner warn"><i class="fas fa-exclamation-triangle"></i> <strong>' +
        driveCount +
        '</strong> producto' + (driveCount === 1 ? '' : 's') + ' todavía usa' + (driveCount === 1 ? '' : 'n') + ' una imagen de Google Drive — puede dejar de cargar en cualquier momento.</div>';
    }
    el.innerHTML = html;
  }

  // El script se carga al final del body, así que el HTML de arriba ya existe: no hace falta esperar DOMContentLoaded.
  initDropzone();
  wireLiveInputs();
  try {
    if (window.PublishStatus) PublishStatus.refreshUI();
  } catch (e) {}
})();
