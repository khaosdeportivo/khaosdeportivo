/* ===== INVENTARIO MAESTRO =====
   Flujo:
   1. Nuevo producto → se guarda en inventario maestro (no en catálogo)
   2. En inventario maestro se puede editar todo
   3. Desde inventario maestro se agrega al catálogo
   4. Al agregar al catálogo, el producto SALE del inventario maestro y pasa al stock del catálogo
*/
(function () {
  const INV_URL = 'https://raw.githubusercontent.com/khaosdeportivo/khaosdeportivo/main/inventario.json?t=';
  const LS_KEY = 'khaos_master_inventory';

  let masterInventory = [];
  let invSelected = new Set();
  let invFilter = 'all';
  let invSearch = '';
  let invPage = 1;
  const invPerPage = 25;
  let invLoaded = false;
  let invEditCode = null;

  if (typeof categoryNames !== 'undefined') {
    categoryNames['bolsos'] = categoryNames['bolsos'] || 'Bolsos / Maletas';
  }
  if (typeof categoryColors !== 'undefined') {
    categoryColors['bolsos'] = categoryColors['bolsos'] || '#64748b';
  }

  function persistMaster() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        inventario: masterInventory,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {}
  }

  function loadMasterFromLS() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const list = data.inventario || data;
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (e) {}
    return null;
  }

  async function loadMasterInventory(force) {
    if (invLoaded && !force) return masterInventory;

    if (!force) {
      const local = loadMasterFromLS();
      if (local) {
        masterInventory = local;
        invLoaded = true;
        updateStatus();
        return masterInventory;
      }
    }

    try {
      const res = await fetch(INV_URL + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      masterInventory = data.inventario || data.productos || (Array.isArray(data) ? data : []);
      invLoaded = true;
      persistMaster();
      updateStatus();
      return masterInventory;
    } catch (e) {
      console.warn('No se pudo cargar inventario.json:', e.message);
      const local = loadMasterFromLS();
      masterInventory = local || [];
      invLoaded = true;
      updateStatus(true);
      return masterInventory;
    }
  }

  function updateStatus(err) {
    const statusEl = document.getElementById('invMasterStatus');
    if (!statusEl) return;
    if (err && masterInventory.length === 0) {
      statusEl.textContent = 'No se pudo cargar inventario.json';
    } else {
      statusEl.textContent = masterInventory.length + ' productos en inventario maestro';
    }
  }

  function invIsInCatalog(code) {
    if (!code || typeof products === 'undefined') return false;
    return products.some(p => String(p.code) === String(code));
  }

  function getInvFiltered() {
    let list = [...masterInventory];
    if (invFilter !== 'all') list = list.filter(p => p.category === invFilter);
    if (invSearch) {
      const q = invSearch.toLowerCase();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        String(p.code || '').toLowerCase().includes(q) ||
        (p.desc || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  function renderInvCategoryOptions() {
    const sel = document.getElementById('invCategoryFilter');
    if (!sel) return;
    const cats = [...new Set(masterInventory.map(p => p.category).filter(Boolean))].sort();
    const current = sel.value || 'all';
    sel.innerHTML = '<option value="all">Todas las categorías</option>' +
      cats.map(c => {
        const label = (typeof categoryNames !== 'undefined' && categoryNames[c]) ? categoryNames[c] : c;
        const n = masterInventory.filter(p => p.category === c).length;
        return `<option value="${c}">${label} (${n})</option>`;
      }).join('');
    sel.value = current;
  }

  function escapeInv(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
  }

  function renderMasterInventory() {
    const tbody = document.getElementById('invMasterTableBody');
    const pageInfo = document.getElementById('invPageInfo');
    const selectedInfo = document.getElementById('invSelectedCount');
    if (!tbody) return;

    const filtered = getInvFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / invPerPage));
    if (invPage > totalPages) invPage = totalPages;
    const start = (invPage - 1) * invPerPage;
    const pageItems = filtered.slice(start, start + invPerPage);

    if (selectedInfo) selectedInfo.textContent = invSelected.size + ' seleccionados';
    if (pageInfo) pageInfo.textContent = filtered.length
      ? `${start + 1}–${Math.min(start + invPerPage, filtered.length)} de ${filtered.length}`
      : '0 productos';

    updateStatus();

    if (pageItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--fog);">Sin resultados. Crea un producto nuevo o recarga el inventario.</td></tr>';
      return;
    }

    tbody.innerHTML = pageItems.map(p => {
      const code = String(p.code || '');
      const inCat = invIsInCatalog(code);
      const checked = invSelected.has(code);
      const catLabel = (typeof categoryNames !== 'undefined' && categoryNames[p.category]) ? categoryNames[p.category] : (p.category || '—');
      const sizes = (p.sizes || []).slice(0, 8).join(', ') + ((p.sizes || []).length > 8 ? '…' : '');
      const price = p.price > 0 ? '$' + Number(p.price).toLocaleString('es-CO') : 'Sin precio';
      const safeCode = code.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<tr class="${checked ? 'selected' : ''} ${inCat ? 'inv-in-catalog' : ''}">
        <td><div class="checkbox ${checked ? 'checked' : ''}" onclick="invToggleSelect('${safeCode}')">${checked ? '<i class="fas fa-check"></i>' : ''}</div></td>
        <td><div class="product-cell-info"><div class="product-cell-name">${escapeInv(p.name)}</div><div class="product-cell-code">#${escapeInv(code)}</div></div></td>
        <td style="font-size:12px;">${escapeInv(catLabel)}</td>
        <td style="font-size:12px;color:var(--fog);">${escapeInv(sizes)}</td>
        <td style="font-weight:700;color:var(--gold-light);font-size:13px;">${price}</td>
        <td>${inCat ? '<span class="badge badge-green">En catálogo</span>' : '<span class="badge badge-gray">En maestro</span>'}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="invEditProduct('${safeCode}')" title="Editar"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete" onclick="invDeleteProduct('${safeCode}')" title="Eliminar del maestro"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  window.invToggleSelect = function (code) {
    if (invSelected.has(code)) invSelected.delete(code);
    else invSelected.add(code);
    renderMasterInventory();
  };

  window.invSelectPage = function () {
    const filtered = getInvFiltered();
    const start = (invPage - 1) * invPerPage;
    filtered.slice(start, start + invPerPage).forEach(p => {
      if (!invIsInCatalog(p.code)) invSelected.add(String(p.code));
    });
    renderMasterInventory();
  };

  window.invClearSelection = function () {
    invSelected.clear();
    renderMasterInventory();
  };

  window.invGoPage = function (delta) {
    invPage = Math.max(1, invPage + delta);
    renderMasterInventory();
  };

  window.invOnSearch = function (val) {
    invSearch = (val || '').trim().toLowerCase();
    invPage = 1;
    renderMasterInventory();
  };

  window.invOnFilter = function (val) {
    invFilter = val || 'all';
    invPage = 1;
    renderMasterInventory();
  };

  window.invEditProduct = function (code) {
    const p = masterInventory.find(x => String(x.code) === String(code));
    if (!p) return;
    invEditCode = String(code);

    document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-warehouse"></i> Editar (Inventario maestro)';
    document.getElementById('editId').value = '';
    document.getElementById('prodName').value = p.name || '';
    document.getElementById('prodCode').value = p.code || '';
    document.getElementById('prodCategory').value = p.category || 'guayo-corto';
    document.getElementById('prodPrice').value = p.price || '';
    document.getElementById('prodOldPrice').value = p.oldPrice || '';
    document.getElementById('prodImage').value = p.image || '';
    document.getElementById('prodDesc').value = p.desc || '';
    document.getElementById('prodBadge').value = p.badge || '';
    if (typeof initSizesEditor === 'function') {
      initSizesEditor(p.sizes || [], p.outOfStock || []);
    }
    window._savingToMaster = true;
    window._masterEditCode = invEditCode;
    if (typeof openModal === 'function') openModal('productModalOverlay');
  };

  window.invDeleteProduct = function (code) {
    if (typeof showConfirm !== 'function') {
      if (!confirm('¿Eliminar del inventario maestro?')) return;
      masterInventory = masterInventory.filter(p => String(p.code) !== String(code));
      invSelected.delete(String(code));
      persistMaster();
      renderMasterInventory();
      if (typeof showToast === 'function') showToast('Eliminado del inventario maestro', 'success');
      return;
    }
    showConfirm('Eliminar del inventario maestro', '¿Quitar este producto del inventario maestro? No afecta el catálogo.', () => {
      masterInventory = masterInventory.filter(p => String(p.code) !== String(code));
      invSelected.delete(String(code));
      persistMaster();
      renderMasterInventory();
      showToast('Eliminado del inventario maestro', 'success');
    });
  };

  window.saveProductToMaster = function (productData, editCode) {
    if (editCode) {
      const idx = masterInventory.findIndex(p => String(p.code) === String(editCode));
      if (idx >= 0) {
        masterInventory[idx] = { ...masterInventory[idx], ...productData };
      } else {
        masterInventory.unshift(productData);
      }
    } else {
      const exists = masterInventory.findIndex(p => String(p.code) === String(productData.code));
      if (exists >= 0) {
        masterInventory[exists] = { ...masterInventory[exists], ...productData };
      } else {
        masterInventory.unshift(productData);
      }
    }
    persistMaster();
    invLoaded = true;
    renderInvCategoryOptions();
    renderMasterInventory();
  };

  window.invAddSelectedToCatalog = function () {
    if (typeof products === 'undefined') {
      showToast('Catálogo no disponible', 'error');
      return;
    }
    if (invSelected.size === 0) {
      showToast('Selecciona al menos un producto', 'warning');
      return;
    }
    let added = 0;
    let skipped = 0;
    const codesToRemove = [];

    invSelected.forEach(code => {
      if (invIsInCatalog(code)) { skipped++; return; }
      const src = masterInventory.find(p => String(p.code) === String(code));
      if (!src) return;
      const id = (typeof nextId !== 'undefined') ? nextId++ : (Date.now() + added);
      products.push({
        id: id,
        name: src.name,
        code: String(src.code),
        category: src.category || 'guayo-corto',
        price: src.price || 0,
        oldPrice: src.oldPrice || 0,
        sizes: src.sizes && src.sizes.length ? [...src.sizes] : ['única'],
        outOfStock: src.outOfStock ? [...src.outOfStock] : [],
        image: src.image || '',
        desc: src.desc || '',
        badge: src.badge || null
      });
      codesToRemove.push(String(code));
      added++;
    });

    if (codesToRemove.length) {
      masterInventory = masterInventory.filter(p => !codesToRemove.includes(String(p.code)));
      persistMaster();
    }

    invSelected.clear();
    if (typeof saveProducts === 'function') saveProducts();
    if (typeof renderCategoryChips === 'function') renderCategoryChips();
    if (typeof renderTable === 'function') renderTable();
    if (typeof renderInventory === 'function') renderInventory();
    renderInvCategoryOptions();
    renderMasterInventory();

    showToast(
      added
        ? `✅ ${added} producto(s) pasaron al catálogo` + (skipped ? ` (${skipped} ya estaban)` : '') + '. Recuerda sincronizar con GitHub.'
        : 'No se agregó ninguno (ya estaban en el catálogo)',
      added ? 'success' : 'info'
    );
  };

  window.invSwitchTab = function (tab) {
    const stock = document.getElementById('invTabStock');
    const master = document.getElementById('invTabMaster');
    const btnStock = document.getElementById('invBtnStock');
    const btnMaster = document.getElementById('invBtnMaster');
    if (!stock || !master) return;
    if (tab === 'master') {
      stock.style.display = 'none';
      master.style.display = 'block';
      if (btnStock) btnStock.classList.remove('active');
      if (btnMaster) btnMaster.classList.add('active');
      loadMasterInventory().then(() => {
        renderInvCategoryOptions();
        renderMasterInventory();
      });
    } else {
      master.style.display = 'none';
      stock.style.display = 'block';
      if (btnMaster) btnMaster.classList.remove('active');
      if (btnStock) btnStock.classList.add('active');
      if (typeof renderInventory === 'function') renderInventory();
    }
  };

  const _origSwitch = window.switchView;
  if (typeof _origSwitch === 'function') {
    window.switchView = function (view, el) {
      _origSwitch(view, el);
      if (view === 'inventory') {
        const master = document.getElementById('invTabMaster');
        if (master && master.style.display !== 'none') {
          loadMasterInventory().then(() => {
            renderInvCategoryOptions();
            renderMasterInventory();
          });
        }
      }
    };
  }

  window.reloadMasterInventory = function () {
    if (typeof showConfirm === 'function') {
      showConfirm('Recargar inventario', 'Se perderán cambios locales del inventario maestro no sincronizados. ¿Continuar?', () => {
        try { localStorage.removeItem(LS_KEY); } catch (e) {}
        invLoaded = false;
        loadMasterInventory(true).then(() => {
          renderInvCategoryOptions();
          renderMasterInventory();
          showToast('Inventario recargado desde GitHub', 'success');
        });
      });
    } else {
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      invLoaded = false;
      loadMasterInventory(true).then(() => {
        renderInvCategoryOptions();
        renderMasterInventory();
      });
    }
  };

  window.getMasterInventory = function () { return masterInventory; };
  window.ensureMasterLoaded = loadMasterInventory;
})();
