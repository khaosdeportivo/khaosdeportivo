
function openOrderModal() {
    document.getElementById('orderCustomer').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderAddress').value = '';
    document.getElementById('orderStatus').value = 'pending';
    orderItems = [];
    renderOrderItems();
    updateOrderTotal();
    openModal('orderModalOverlay');
}

function addOrderItem() {
    orderItems.push({ productId: '', size: '', qty: 1 });
    renderOrderItems();
}

function removeOrderItem(index) {
    orderItems.splice(index, 1);
    renderOrderItems();
    updateOrderTotal();
}

function updateOrderItemProduct(index, productId) {
    const product = products.find(p => p.id == productId);
    orderItems[index].productId = parseInt(productId);
    orderItems[index].name = product ? product.name : '';
    orderItems[index].price = product ? product.price : 0;
    orderItems[index].size = '';
    renderOrderItems();
    updateOrderTotal();
}

function updateOrderItemSize(index, size) {
    orderItems[index].size = size;
}

function updateOrderItemQty(index, qty) {
    orderItems[index].qty = parseInt(qty) || 1;
    updateOrderTotal();
}

function renderOrderItems() {
    const container = document.getElementById('orderItemsContainer');
    if (orderItems.length === 0) {
        container.innerHTML = '<div style="color:var(--fog);font-size:13px;padding:10px 0;">Agrega al menos un producto</div>';
        return;
    }
    container.innerHTML = orderItems.map((item, i) => {
        const product = products.find(p => p.id == item.productId);
        const availableSizes = product ? product.sizes.filter(s => !product.outOfStock.includes(s)) : [];
        const sizeOptions = availableSizes.map(s => `<option value="${s}" ${item.size === s ? 'selected' : ''}>${s}</option>`).join('');
        return `<div style="display:grid;grid-template-columns:2fr 1fr 80px 40px;gap:8px;align-items:end;margin-bottom:10px;" class="order-item-row">
            <div>
                <label style="font-size:10px;color:var(--fog);text-transform:uppercase;letter-spacing:1px;">Producto</label>
                <select class="form-select" style="padding:10px 12px;font-size:13px;" onchange="updateOrderItemProduct(${i}, this.value)">
                    <option value="">Seleccionar...</option>
                    ${products.map(p => `<option value="${p.id}" ${item.productId == p.id ? 'selected' : ''}>${p.name} — $${p.price.toLocaleString()}</option>`).join('')}
                </select>
            </div>
            <div>
                <label style="font-size:10px;color:var(--fog);text-transform:uppercase;letter-spacing:1px;">Talla</label>
                <select class="form-select" style="padding:10px 12px;font-size:13px;" onchange="updateOrderItemSize(${i}, this.value)" ${!product ? 'disabled' : ''}>
                    <option value="">Talla</option>
                    ${sizeOptions}
                </select>
            </div>
            <div>
                <label style="font-size:10px;color:var(--fog);text-transform:uppercase;letter-spacing:1px;">Cant.</label>
                <input type="number" class="form-input" style="padding:10px 12px;font-size:13px;" value="${item.qty}" min="1" max="10" onchange="updateOrderItemQty(${i}, this.value)">
            </div>
            <button class="action-btn delete" style="height:40px;" onclick="removeOrderItem(${i})" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>`;
    }).join('');
}

function saveOrder() {
    const customer = document.getElementById('orderCustomer').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const address = document.getElementById('orderAddress').value.trim();
    const status = document.getElementById('orderStatus').value;

    if (!customer) { showToast('El nombre del cliente es obligatorio', 'error'); return; }
    if (!phone) { showToast('El teléfono es obligatorio', 'error'); return; }
    if (!address) { showToast('La dirección es obligatoria', 'error'); return; }
    if (orderItems.length === 0) { showToast('Agrega al menos un producto', 'error'); return; }

    const invalidItems = orderItems.filter(i => !i.productId || !i.size);
    if (invalidItems.length > 0) { showToast('Completa todos los productos (producto y talla)', 'error'); return; }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
    let discount = 0;
    let couponCode = null;
    if (currentOrderCoupon && subtotal >= (currentOrderCoupon.minPurchase || 0)) {
        let eligibleSubtotal = subtotal;
        // If product-specific, calculate discount only on eligible products
        if (currentOrderCoupon.productIds && currentOrderCoupon.productIds.length > 0) {
            eligibleSubtotal = orderItems
                .filter(i => currentOrderCoupon.productIds.includes(i.productId))
                .reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
        }
        if (currentOrderCoupon.type === 'percentage') {
            discount = Math.round(eligibleSubtotal * currentOrderCoupon.value / 100);
        } else {
            discount = currentOrderCoupon.value;
        }
        if (discount > eligibleSubtotal) discount = eligibleSubtotal;
        if (discount > subtotal) discount = subtotal;
        couponCode = currentOrderCoupon.code;
        // Registrar uso del cupón
        const couponIdx = coupons.findIndex(c => c.id === currentOrderCoupon.id);
        if (couponIdx >= 0) {
            coupons[couponIdx].usedCount = (coupons[couponIdx].usedCount || 0) + 1;
            coupons[couponIdx].totalSaved = (coupons[couponIdx].totalSaved || 0) + discount;
            saveCoupons();
        }
    }
    const total = subtotal - discount;

    const order = {
        id: nextOrderId++,
        customer: customer,
        phone: phone,
        address: address,
        items: orderItems.map(i => ({ productId: i.productId, name: i.name, size: i.size, price: i.price, qty: i.qty })),
        subtotal: subtotal,
        discount: discount,
        coupon: couponCode,
        total: total,
        status: status,
        date: new Date().toISOString()
    };

    orders.unshift(order);
    saveOrders();
    closeModal('orderModalOverlay');
    showToast(`Pedido #${String(order.id).padStart(4,'0')} creado exitosamente`, 'success');
    addNotification('order', `Nuevo pedido de ${order.customer} — $${order.total.toLocaleString('es-CO')}${couponCode ? ' (Cupón: ' + couponCode + ')' : ''}`);
}

// ===== PEDIDO SIMULADO (deshabilitado - solo manual) =====
function simulateNewOrder() {
    showToast('Los pedidos automáticos están desactivados. Usa "Nuevo Pedido" para crear uno manualmente.', 'warning');
}
// generateSampleOrders removed - dead code, never called

// ===== CATEGORIES VIEW =====
function renderCategoriesView() {
    const tbody = document.getElementById('categoriesTableBody');
    if (products.length === 0) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state" style="padding:40px;"><h3>Sin categorías</h3></div></td></tr>'; return; }

    let html = '';
    let totalCats = 0;

    for (const [groupKey, group] of Object.entries(categoryHierarchy)) {
        const groupProds = products.filter(p => {
            const meta = getCategoryMeta(p.category);
            return meta.group === groupKey;
        });
        if (groupProds.length === 0) continue;

        html += `<tr style="background:var(--ink);"><td colspan="5" style="padding:12px 14px;font-weight:800;font-size:14px;color:var(--white);"><i class="fas ${group.icon}" style="color:${group.color};margin-right:8px;"></i> ${group.label} <span style="color:var(--fog);font-size:12px;font-weight:600;">(${groupProds.length} productos)</span></td></tr>`;

        for (const [familyKey, family] of Object.entries(group.families)) {
            const familyProds = products.filter(p => {
                const meta = getCategoryMeta(p.category);
                return meta.group === groupKey && meta.family === familyKey;
            });
            if (familyProds.length === 0) continue;

            const familyStock = familyProds.reduce((s, p) => s + p.sizes.filter(sz => !p.outOfStock.includes(sz)).length, 0);
            const familyAvgPrice = Math.round(familyProds.reduce((s, p) => s + p.price, 0) / familyProds.length);

            html += `<tr><td style="padding-left:30px;"><span class="badge" style="background:${family.color}15;color:${family.color};border-color:${family.color}30;font-size:12px;padding:4px 12px;"><i class="fas ${family.icon}" style="margin-right:4px;"></i> ${family.label}</span></td><td style="font-weight:900;font-size:16px;">${familyProds.length}</td><td style="color:var(--fog);">${familyStock} uds</td><td style="font-weight:800;color:var(--gold-light);">$${familyAvgPrice.toLocaleString('es-CO')}</td><td style="color:var(--fog);font-size:11px;">${familyProds.map(p => p.sizes.filter(s => !p.outOfStock.includes(s)).length).reduce((a,b)=>a+b,0)} en stock</td></tr>`;

            // Individual categories within family
            for (const catId of family.categories) {
                const catProds = products.filter(p => p.category === catId);
                if (catProds.length === 0) continue;
                totalCats++;
                const catStock = catProds.reduce((s, p) => s + p.sizes.filter(sz => !p.outOfStock.includes(sz)).length, 0);
                const catAvgPrice = Math.round(catProds.reduce((s, p) => s + p.price, 0) / catProds.length);
                const color = categoryColors[catId] || '#888';
                html += `<tr><td style="padding-left:50px;font-size:12px;color:var(--silver);">└ ${categoryNames[catId] || catId}</td><td style="font-weight:700;font-size:14px;">${catProds.length}</td><td style="color:var(--fog);font-size:12px;">${catStock} uds</td><td style="font-weight:700;color:var(--gold-light);font-size:13px;">$${catAvgPrice.toLocaleString('es-CO')}</td><td></td></tr>`;
            }
        }
    }

    // Otro elemento huérfano: #catCountTotal tampoco existe en admin.html.
    // Igual que con couponSearchBox, esto interrumpía init() a mitad de
    // camino en cada login. Se protege con optional chaining.
    const catCountEl = document.getElementById('catCountTotal');
    if (catCountEl) catCountEl.textContent = totalCats;
    tbody.innerHTML = html || '<tr><td colspan="5"><div class="empty-state" style="padding:40px;"><h3>Sin categorías</h3></div></td></tr>';
}

// ===== INVENTORY =====
function renderInventory() {
    const alerts = document.getElementById('inventoryAlerts');
    const tbody = document.getElementById('inventoryTableBody');
    const lowStock = products.filter(p => p.sizes.filter(s => !p.outOfStock.includes(s)).length <= 2);
    alerts.innerHTML = lowStock.map(p => `<div class="inventory-alert"><i class="fas fa-exclamation-triangle"></i><p>Stock bajo: ${p.name} (${p.sizes.filter(s => !p.outOfStock.includes(s)).length} tallas)</p><button onclick="editProduct(${p.id})">Gestionar</button></div>`).join('');
    if (lowStock.length === 0) alerts.innerHTML = '';
    tbody.innerHTML = products.map(p => {
        const available = p.sizes.filter(s => !p.outOfStock.includes(s));
        const out = p.outOfStock;
        const status = available.length === 0 ? '<span class="badge badge-red">Sin stock</span>' : available.length <= 2 ? '<span class="badge badge-orange">Stock bajo</span>' : '<span class="badge badge-green">OK</span>';
        const meta = getCategoryMeta(p.category);
        return `<tr><td><div class="product-cell"><img class="product-thumb" src="${p.image || ''}" onerror="this.style.opacity='0.3'"><div class="product-cell-info"><div class="product-cell-name">${p.name}</div><div class="product-cell-code">${p.code}</div></div></div></td><td><div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:12px;font-weight:700;color:var(--ivory);">${categoryNames[p.category] || p.category}</span><span style="font-size:10px;color:var(--fog);">${meta.groupLabel} > ${meta.familyLabel}</span></div></td><td><div class="size-pills">${available.map(s => `<span class="size-pill available">${s}</span>`).join('')}</div></td><td><div class="size-pills">${out.map(s => `<span class="size-pill out">${s}</span>`).join('')}</div></td><td>${status}</td></tr>`;
    }).join('');
}

// ===== SETTINGS =====
function loadSettings() {
    try {
        const s = localStorage.getItem('khaos_settings');
        if (s) { const settings = JSON.parse(s); document.getElementById('settingStoreName').value = settings.storeName || 'Khaos Deportivo'; document.getElementById('settingWhatsapp').value = settings.whatsapp || '573105624563'; document.getElementById('settingInstagram').value = settings.instagram || ''; document.getElementById('settingFacebook').value = settings.facebook || ''; document.getElementById('settingColor').value = settings.color || '#D4AF37'; }
    } catch(e) {}
}
function saveSettings() {
    const settings = { storeName: document.getElementById('settingStoreName').value, whatsapp: document.getElementById('settingWhatsapp').value, instagram: document.getElementById('settingInstagram').value, facebook: document.getElementById('settingFacebook').value, color: document.getElementById('settingColor').value };
    try { localStorage.setItem('khaos_settings', JSON.stringify(settings)); } catch(e) {}
    showToast('Configuración guardada', 'success');
}
function resetSettings() {
    document.getElementById('settingStoreName').value = 'Khaos Deportivo';
    document.getElementById('settingWhatsapp').value = '573105624563';
    document.getElementById('settingInstagram').value = 'https://www.instagram.com/khaosdeportivo';
    document.getElementById('settingFacebook').value = 'https://www.facebook.com/share/1Bkqc7LWJW/';
    document.getElementById('settingColor').value = '#D4AF37';
    showToast('Valores restaurados', 'info');
}

// ===== CUPONES =====
let coupons = [];
let nextCouponId = 1;
let currentCouponFilter = 'all';
let currentOrderCoupon = null;
let selectedCouponProducts = []; // Product IDs selected for coupon

const defaultCoupons = [];

function loadCoupons() {
    try {
        const saved = localStorage.getItem('khaos_admin_coupons');
        if (saved) { 
            const parsed = JSON.parse(saved); 
            if (Array.isArray(parsed) && parsed.length > 0) { 
                coupons = parsed; 
                // Migrate old coupons without productIds
                coupons.forEach(c => {
                    if (c.productIds === undefined) c.productIds = [];
                });
                nextCouponId = Math.max(...coupons.map(c => c.id), 0) + 1;
                return;
            }
        }
    } catch(e) {}
    coupons = JSON.parse(JSON.stringify(defaultCoupons));
    nextCouponId = 11;
    saveCoupons();
}

function saveCoupons() { 
    try { localStorage.setItem('khaos_admin_coupons', JSON.stringify(coupons)); } catch(e) {} 
    updateCouponStats(); 
    renderCoupons();
}

function updateCouponStats() {
    const total = coupons.length;
    const active = coupons.filter(c => isCouponActive(c)).length;
    const used = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
    const saved = coupons.reduce((s, c) => s + ((c.totalSaved || 0)), 0);
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('couponTotal', total);
    setText('couponActive', active);
    setText('couponUsed', used);
    setText('couponSaved', '$' + saved.toLocaleString('es-CO'));
    const badge = document.getElementById('sidebarCouponCount');
    if (badge) { badge.textContent = active; badge.style.display = active > 0 ? 'flex' : 'none'; }
    setText('tabCouponAll', total);
    setText('tabCouponActive', active);
    setText('tabCouponExpired', coupons.filter(c => !isCouponActive(c) && isCouponExpired(c)).length);
    setText('tabCouponPct', coupons.filter(c => c.type === 'percentage').length);
    setText('tabCouponFixed', coupons.filter(c => c.type === 'fixed').length);
}

function isCouponExpired(c) {
    if (!c.endDate) return false;
    return new Date(c.endDate) < new Date();
}

function isCouponActive(c) {
    if (!c.active) return false;
    if (c.maxUses > 0 && c.usedCount >= c.maxUses) return false;
    if (c.startDate && new Date(c.startDate) > new Date()) return false;
    if (c.endDate && new Date(c.endDate) < new Date()) return false;
    return true;
}

function openCouponModal() {
    document.getElementById('couponModalTitle').innerHTML = '<i class="fas fa-ticket-alt"></i> Nuevo Cupón';
    document.getElementById('editCouponId').value = '';
    document.getElementById('couponCode').value = '';
    document.getElementById('couponType').value = 'percentage';
    document.getElementById('couponValue').value = '';
    document.getElementById('couponMinPurchase').value = '0';
    document.getElementById('couponMaxUses').value = '0';
    document.getElementById('couponStartDate').value = '';
    document.getElementById('couponEndDate').value = '';
    document.getElementById('couponAppliesTo').value = 'all';
    document.getElementById('couponActiveToggle').classList.add('active');
    // Reset scope to category
    document.getElementById('scopeCategory').checked = true;
    selectedCouponProducts = [];
    toggleCouponScope();
    renderProductSelector();
    renderProductSelectorTags();
    openModal('couponModalOverlay');
}

function editCoupon(id) {
    const c = coupons.find(x => x.id === id); if (!c) return;
    document.getElementById('couponModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Cupón';
    document.getElementById('editCouponId').value = c.id;
    document.getElementById('couponCode').value = c.code;
    document.getElementById('couponType').value = c.type;
    document.getElementById('couponValue').value = c.value;
    document.getElementById('couponMinPurchase').value = c.minPurchase || 0;
    document.getElementById('couponMaxUses').value = c.maxUses || 0;
    document.getElementById('couponStartDate').value = c.startDate || '';
    document.getElementById('couponEndDate').value = c.endDate || '';
    document.getElementById('couponAppliesTo').value = c.appliesTo || 'all';
    const toggle = document.getElementById('couponActiveToggle');
    if (c.active) toggle.classList.add('active'); else toggle.classList.remove('active');
    // Handle scope
    const hasProductIds = c.productIds && c.productIds.length > 0;
    if (hasProductIds) {
        document.getElementById('scopeProduct').checked = true;
        selectedCouponProducts = [...(c.productIds || [])];
    } else {
        document.getElementById('scopeCategory').checked = true;
        selectedCouponProducts = [];
    }
    toggleCouponScope();
    renderProductSelector();
    renderProductSelectorTags();
    openModal('couponModalOverlay');
}

function saveCoupon() {
    const editId = document.getElementById('editCouponId').value;
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseInt(document.getElementById('couponValue').value) || 0;
    const minPurchase = parseInt(document.getElementById('couponMinPurchase').value) || 0;
    const maxUses = parseInt(document.getElementById('couponMaxUses').value) || 0;
    const startDate = document.getElementById('couponStartDate').value;
    const endDate = document.getElementById('couponEndDate').value;
    const appliesTo = document.getElementById('couponAppliesTo').value;
    const active = document.getElementById('couponActiveToggle').classList.contains('active');
    const scopeType = document.querySelector('input[name="couponScope"]:checked').value;

    if (!code) { showToast('El código es obligatorio', 'error'); return; }
    if (value <= 0) { showToast('El valor debe ser mayor a 0', 'error'); return; }
    if (type === 'percentage' && value > 100) { showToast('El porcentaje no puede superar 100%', 'error'); return; }
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) { showToast('La fecha fin debe ser posterior a la inicio', 'error'); return; }

    const existing = coupons.find(c => c.code === code && c.id != (editId || 0));
    if (existing) { showToast('Ya existe un cupón con ese código', 'error'); return; }

    const productIds = scopeType === 'product' ? [...selectedCouponProducts] : [];

    if (editId) {
        const idx = coupons.findIndex(c => c.id == editId);
        if (idx >= 0) coupons[idx] = { ...coupons[idx], code, type, value, minPurchase, maxUses, usedCount: coupons[idx].usedCount || 0, totalSaved: coupons[idx].totalSaved || 0, startDate, endDate, appliesTo, productIds, active };
        showToast('Cupón actualizado', 'success');
    } else {
        coupons.push({ id: nextCouponId++, code, type, value, minPurchase, maxUses, usedCount: 0, totalSaved: 0, startDate, endDate, appliesTo, productIds, active });
        showToast('Cupón creado', 'success');
    }
    saveCoupons();
    closeModal('couponModalOverlay');
}

function deleteCoupon(id) {
    showConfirm('Eliminar cupón', '¿Eliminar este cupón permanentemente?', () => {
        coupons = coupons.filter(c => c.id !== id);
        saveCoupons();
        showToast('Cupón eliminado', 'success');
    });
}

function toggleCouponStatus(id) {
    const c = coupons.find(x => x.id === id);
    if (c) { c.active = !c.active; saveCoupons(); showToast(c.active ? 'Cupón activado' : 'Cupón desactivado', 'success'); }
}

function getFilteredCoupons() {
    let result = [...coupons];
    if (currentCouponFilter === 'active') result = result.filter(c => isCouponActive(c));
    else if (currentCouponFilter === 'expired') result = result.filter(c => isCouponExpired(c));
    else if (currentCouponFilter === 'percentage') result = result.filter(c => c.type === 'percentage');
    else if (currentCouponFilter === 'fixed') result = result.filter(c => c.type === 'fixed');
    // BUG REAL ENCONTRADO: el HTML de la pestaña "Cupones" nunca tuvo un
    // input #couponSearchBox (se ve en admin.html: la vista view-coupons no
    // tiene caja de búsqueda), pero este código intentaba leer su .value sin
    // comprobar que existiera. Eso lanzaba una excepción en CADA login (en
    // init() -> loadCoupons() -> saveCoupons() -> renderCoupons()), y como
    // nada la atrapaba, cortaba a la mitad la inicialización del panel:
    // todo lo que init() programa después de loadCoupons() (gráficas,
    // listeners de eventos, efectos de scroll, notificación de "Panel
    // cargado") se quedaba sin ejecutar. Con el optional chaining de abajo,
    // si el buscador no existe simplemente no se filtra por texto.
    const search = (document.getElementById('couponSearchBox')?.value || '').toLowerCase().trim();
    if (search) result = result.filter(c => c.code.toLowerCase().includes(search));
    return result;
}

function renderCoupons() {
    const tbody = document.getElementById('couponsTableBody');
    const filtered = getFilteredCoupons();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:40px 20px;"><div class="empty-state-icon" style="width:60px;height:60px;font-size:24px;"><i class="fas fa-ticket-alt"></i></div><h3 style="font-size:16px;">Sin cupones</h3><p>Crea cupones para ofrecer descuentos</p><button class="btn btn-primary" onclick="openCouponModal()" style="margin-top:10px;"><i class="fas fa-plus"></i> Nuevo Cupón</button></div></td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(c => {
        const active = isCouponActive(c);
        const expired = isCouponExpired(c);
        const typeLabel = c.type === 'percentage' ? c.value + '%' : '$' + c.value.toLocaleString('es-CO');
        const usesText = c.maxUses > 0 ? `${c.usedCount}/${c.maxUses}` : `${c.usedCount} / ∞`;
        const vigencia = c.startDate && c.endDate ? `${c.startDate} → ${c.endDate}` : c.endDate ? `Hasta ${c.endDate}` : 'Sin vencimiento';
        const statusBadge = active ? '<span class="badge badge-green">Activo</span>' : expired ? '<span class="badge badge-red">Vencido</span>' : '<span class="badge badge-gray">Inactivo</span>';
        // Scope display
        let scopeInfo = '';
        if (c.productIds && c.productIds.length > 0) {
            const productNames = c.productIds.map(pid => {
                const p = products.find(prod => prod.id === pid);
                return p ? p.name : '#' + pid;
            }).slice(0, 2);
            const more = c.productIds.length > 2 ? ` +${c.productIds.length - 2}` : '';
            scopeInfo = `<div class="coupon-scope"><i class="fas fa-box"></i> ${productNames.join(', ')}${more}</div>`;
        } else {
            const scopeLabels = { all: 'Todos', guayo: 'Guayos', sintetica: 'Sintética', futsal: 'Futsal', nino: 'Niño' };
            scopeInfo = `<div class="coupon-scope"><i class="fas fa-layer-group"></i> ${scopeLabels[c.appliesTo] || c.appliesTo}</div>`;
        }
        return `<tr><td style="font-family:var(--font-mono);font-weight:800;color:var(--gold);font-size:14px;">${c.code}</td><td>${c.type === 'percentage' ? '<span class="badge badge-purple">%</span>' : '<span class="badge badge-blue">$</span>'}</td><td style="font-weight:900;">${typeLabel}</td><td style="color:var(--fog);">${c.minPurchase > 0 ? '$' + c.minPurchase.toLocaleString('es-CO') : 'Sin mínimo'}</td><td style="color:var(--fog);">${usesText}</td><td style="color:var(--fog);font-size:12px;">${vigencia}<br>${scopeInfo}</td><td>${statusBadge}</td><td><div class="action-btns"><button class="action-btn edit" onclick="editCoupon(${c.id})" title="Editar"><i class="fas fa-pen"></i></button><button class="action-btn ${active ? 'delete' : 'view'}" onclick="toggleCouponStatus(${c.id})" title="${active ? 'Desactivar' : 'Activar'}"><i class="fas fa-${active ? 'pause' : 'play'}"></i></button><button class="action-btn delete" onclick="deleteCoupon(${c.id})" title="Eliminar"><i class="fas fa-trash"></i></button></div></td></tr>`;
    }).join('');
}

function filterCoupons(filter, btn) {
    currentCouponFilter = filter;
    document.querySelectorAll('#view-coupons .tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderCoupons();
}

// ===== CUPÓN EN PEDIDO =====
function validateOrderCoupon() {
    const code = document.getElementById('orderCouponCode').value.trim().toUpperCase();
    const info = document.getElementById('orderCouponInfo');
    if (!code) { info.style.display = 'none'; currentOrderCoupon = null; updateOrderTotal(); return; }
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) { info.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> Cupón no encontrado</span>'; info.style.display = 'block'; currentOrderCoupon = null; updateOrderTotal(); return; }
    if (!isCouponActive(coupon)) { info.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> Cupón inactivo o vencido</span>'; info.style.display = 'block'; currentOrderCoupon = null; updateOrderTotal(); return; }
    // Check product-specific applicability
    if (coupon.productIds && coupon.productIds.length > 0) {
        const orderProductIds = orderItems.map(i => i.productId).filter(Boolean);
        const hasEligibleProduct = orderProductIds.some(pid => coupon.productIds.includes(pid));
        if (!hasEligibleProduct && orderProductIds.length > 0) {
            info.innerHTML = '<span style="color:var(--warning);"><i class="fas fa-exclamation-circle"></i> Cupón solo aplica a productos específicos</span>';
            info.style.display = 'block';
            currentOrderCoupon = null;
            updateOrderTotal();
            return;
        }
    }
    info.innerHTML = `<span style="color:var(--success);"><i class="fas fa-check-circle"></i> ${coupon.code} — ${coupon.type === 'percentage' ? coupon.value + '%' : '$' + coupon.value.toLocaleString('es-CO')} de descuento</span>`;
    info.style.display = 'block';
}

function applyOrderCoupon() {
    const code = document.getElementById('orderCouponCode').value.trim().toUpperCase();
    if (!code) { showToast('Ingresa un código de cupón', 'warning'); return; }
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) { showToast('Cupón no encontrado', 'error'); return; }
    if (!isCouponActive(coupon)) { showToast('Cupón inactivo o vencido', 'error'); return; }
    // Check product-specific applicability
    if (coupon.productIds && coupon.productIds.length > 0) {
        const orderProductIds = orderItems.map(i => i.productId).filter(Boolean);
        const hasEligibleProduct = orderProductIds.some(pid => coupon.productIds.includes(pid));
        if (!hasEligibleProduct && orderProductIds.length > 0) {
            showToast('Este cupón solo aplica a productos específicos', 'warning');
            return;
        }
    }
    currentOrderCoupon = coupon;
    updateOrderTotal();
    showToast(`Cupón ${coupon.code} aplicado`, 'success');
}

function updateOrderTotal() {
    let subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
    let eligibleSubtotal = subtotal;
    let discount = 0;
    let discountLabel = '';

    if (currentOrderCoupon && subtotal >= (currentOrderCoupon.minPurchase || 0)) {
        // If product-specific, calculate discount only on eligible products
        if (currentOrderCoupon.productIds && currentOrderCoupon.productIds.length > 0) {
            eligibleSubtotal = orderItems
                .filter(i => currentOrderCoupon.productIds.includes(i.productId))
                .reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
        }

        if (currentOrderCoupon.type === 'percentage') {
            discount = Math.round(eligibleSubtotal * currentOrderCoupon.value / 100);
            discountLabel = `${currentOrderCoupon.value}%`;
        } else {
            discount = currentOrderCoupon.value;
            discountLabel = `$${currentOrderCoupon.value.toLocaleString('es-CO')}`;
        }
        if (discount > eligibleSubtotal) discount = eligibleSubtotal;
        if (discount > subtotal) discount = subtotal;

        if (discount > 0) {
            document.getElementById('orderDiscountRow').style.display = 'flex';
            document.getElementById('orderDiscountLabel').textContent = `(${currentOrderCoupon.code} ${discountLabel})`;
            document.getElementById('orderDiscountDisplay').textContent = '-$' + discount.toLocaleString('es-CO');
        } else {
            document.getElementById('orderDiscountRow').style.display = 'none';
        }
    } else {
        document.getElementById('orderDiscountRow').style.display = 'none';
    }
    const total = subtotal - discount;
    document.getElementById('orderSubtotalDisplay').textContent = '$' + subtotal.toLocaleString('es-CO');
    document.getElementById('orderTotalDisplay').textContent = '$' + total.toLocaleString('es-CO');
}

// updateOrderTotal ahora delega a updateOrderTotal
// ===== PRODUCT SELECTOR FOR COUPONS =====
function toggleCouponScope() {
    const scopeType = document.querySelector('input[name="couponScope"]:checked').value;
    const catGroup = document.getElementById('categoryScopeGroup');
    const prodGroup = document.getElementById('productScopeGroup');
    if (scopeType === 'product') {
        catGroup.style.display = 'none';
        prodGroup.style.display = 'block';
    } else {
        catGroup.style.display = 'block';
        prodGroup.style.display = 'none';
    }
}

function toggleProductSelector() {
    const selector = document.getElementById('productSelector');
    selector.classList.toggle('open');
    if (selector.classList.contains('open')) {
        document.getElementById('productSelectorSearch').value = '';
        filterProductSelector();
        document.getElementById('productSelectorSearch').focus();
    }
}

function renderProductSelector() {
    const list = document.getElementById('productSelectorList');
    const searchTerm = (document.getElementById('productSelectorSearch')?.value || '').toLowerCase().trim();
    let filtered = [...products];
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.code.toLowerCase().includes(searchTerm));
    }
    if (filtered.length === 0) {
        list.innerHTML = '<div class="product-selector-empty"><i class="fas fa-search" style="margin-right:6px;"></i>No se encontraron productos</div>';
        return;
    }
    list.innerHTML = filtered.map(p => {
        const isSelected = selectedCouponProducts.includes(p.id);
        return `<div class="product-selector-item ${isSelected ? 'selected' : ''}" onclick="toggleProductSelection(${p.id})">
            <img src="${p.image || ''}" onerror="this.style.display='none'" alt="">
            <div class="product-selector-item-info">
                <div class="product-selector-item-name">${p.name}</div>
                <div class="product-selector-item-code">${p.code} · $${p.price.toLocaleString('es-CO')}</div>
            </div>
            <div class="product-selector-item-check"><i class="fas fa-check"></i></div>
        </div>`;
    }).join('');
}

function filterProductSelector() {
    renderProductSelector();
}

function toggleProductSelection(productId) {
    const idx = selectedCouponProducts.indexOf(productId);
    if (idx >= 0) {
        selectedCouponProducts.splice(idx, 1);
    } else {
        selectedCouponProducts.push(productId);
    }
    renderProductSelector();
    renderProductSelectorTags();
}

function renderProductSelectorTags() {
    const container = document.getElementById('productSelectorTags');
    if (selectedCouponProducts.length === 0) {
        container.innerHTML = '';
        document.getElementById('productSelectorLabel').textContent = 'Seleccionar productos...';
        return;
    }
    document.getElementById('productSelectorLabel').textContent = `${selectedCouponProducts.length} producto(s) seleccionado(s)`;
    container.innerHTML = selectedCouponProducts.map(pid => {
        const p = products.find(prod => prod.id === pid);
        if (!p) return '';
        return `<span class="product-selector-tag">${p.name}<button onclick="event.stopPropagation(); toggleProductSelection(${p.id});" title="Quitar"><i class="fas fa-times"></i></button></span>`;
    }).join('');
}

// Close product selector when clicking outside
document.addEventListener('click', function(e) {
    const selector = document.getElementById('productSelector');
    if (selector && !selector.contains(e.target)) {
        selector.classList.remove('open');
    }
});

// ===== MODALS =====
function openModal(id) {
    const overlay = document.getElementById(id);
    overlay.classList.add('active');
    lockScroll();
}
function closeModal(id) {
    const overlay = document.getElementById(id);
    overlay.classList.remove('active');
    unlockScroll();
}
function closeProductModal() { closeModal('productModalOverlay'); }
function closeImportModal() { closeModal('importModalOverlay'); }
function showImportModal() { document.getElementById('importText').value = ''; openModal('importModalOverlay'); }
function showConfirm(title, message, callback) { document.getElementById('confirmTitle').textContent = title; document.getElementById('confirmMessage').textContent = message; confirmCallback = callback; document.getElementById('confirmBtn').onclick = function() { closeModal('confirmModalOverlay'); if (confirmCallback) confirmCallback(); }; openModal('confirmModalOverlay'); }
function closeConfirmModal() { closeModal('confirmModalOverlay'); confirmCallback = null; }

// ===== EXPORT/IMPORT =====
function exportJSON() { const data = JSON.stringify(products, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'khaos-productos.json'; a.click(); URL.revokeObjectURL(url); showToast('JSON exportado', 'success'); }
function exportCSV() { const headers = ['ID','Nombre','Código','Categoría','Precio','Precio Anterior','Tallas','Agotadas','Badge','Descripción','Imagen']; const rows = products.map(p => [p.id, '"' + p.name + '"', p.code, p.category, p.price, p.oldPrice || '', (p.sizes || []).join(';'), (p.outOfStock || []).join(';'), p.badge || '', '"' + (p.desc || '').replace(/"/g, '""') + '"', p.image || '']); const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'khaos-productos.csv'; a.click(); URL.revokeObjectURL(url); showToast('CSV exportado', 'success'); }
function doImport() { const text = document.getElementById('importText').value.trim(); if (!text) { showToast('Pega los datos primero', 'warning'); return; } try { const parsed = JSON.parse(text); if (!Array.isArray(parsed)) throw new Error('No es array'); if (parsed.length > 0 && (!parsed[0].id || !parsed[0].name)) throw new Error('Formato inválido'); products = parsed; nextId = Math.max(...products.map(p => p.id), 0) + 1; saveProducts(); renderCategoryChips(); closeModal('importModalOverlay'); showToast(`Importados ${products.length} productos`, 'success'); } catch(e) { showToast('Error: formato inválido', 'error'); } }
function confirmReset() { showConfirm('Eliminar todos los productos', '¿Eliminar todos los productos? No se puede deshacer.', () => { products = []; nextId = 1; selectedIds.clear(); saveProducts(); renderCategoryChips(); showToast('Todos los productos eliminados', 'success'); }); }

// ===== SIDEBAR =====
function toggleSidebar(save = true) { const sidebar = document.getElementById('sidebar'); const main = document.getElementById('mainContent'); const icon = document.getElementById('sidebarToggleIcon'); const isCollapsed = sidebar.classList.toggle('collapsed'); main.classList.toggle('expanded'); icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'; if (save) { try { localStorage.setItem('khaos_sidebar_collapsed', isCollapsed); } catch(e) {} } }

// ===== AUTO-HIDE SIDEBAR =====
let lastScrollY = 0;
let scrollTimeout = null;
function initAutoHideSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || window.innerWidth <= 1024) return; // Solo en desktop

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = currentScrollY;

        // No ocultar si está colapsado o si el mouse está sobre el sidebar
        if (sidebar.classList.contains('collapsed')) return;
        if (sidebar.matches(':hover')) return;

        clearTimeout(scrollTimeout);

        if (scrollDirection === 'down' && currentScrollY > 100) {
            // Scrolleando hacia abajo: ocultar después de 500ms
            scrollTimeout = setTimeout(() => {
                sidebar.classList.add('auto-hide');
            }, 500);
        } else {
            // Scrolleando hacia arriba: mostrar inmediatamente
            sidebar.classList.remove('auto-hide');
        }
    }, { passive: true });

    // Mostrar sidebar cuando el mouse se acerca al borde izquierdo
    document.addEventListener('mousemove', function(e) {
        if (e.clientX < 20 && sidebar.classList.contains('auto-hide')) {
            sidebar.classList.remove('auto-hide');
        }
    });
}

// ===== ORIENTATION TOGGLE =====
let orientationForced = false;
function toggleOrientation() {
    orientationForced = !orientationForced;
    document.body.classList.toggle('orientation-forced', orientationForced);

    const icon = document.getElementById('orientationIcon');
    if (icon) {
        icon.className = orientationForced ? 'fas fa-mobile-alt fa-rotate-90' : 'fas fa-mobile-alt';
    }

    // Actualizar también el menú "más opciones"
    const moreIcon = document.getElementById('moreOrientationIcon');
    const moreLabel = document.getElementById('moreOrientationLabel');
    if (moreIcon) moreIcon.className = orientationForced ? 'fas fa-mobile-alt fa-rotate-90' : 'fas fa-mobile-alt';
    if (moreLabel) moreLabel.textContent = orientationForced ? 'Modo vertical' : 'Modo horizontal';

    // Guardar preferencia
    try {
        localStorage.setItem('khaos_orientation_forced', orientationForced);
    } catch(e) {}

    showToast(orientationForced ? 'Modo horizontal activado' : 'Modo vertical activado', 'info');

    // Re-renderizar charts si existen
    setTimeout(() => {
        Object.values(charts).forEach(c => { if (c && c.resize) c.resize(); });
    }, 300);
}

function loadOrientation() {
    try {
        const saved = localStorage.getItem('khaos_orientation_forced');
        if (saved === 'true') {
            orientationForced = true;
            document.body.classList.add('orientation-forced');
            const icon = document.getElementById('orientationIcon');
            if (icon) icon.className = 'fas fa-mobile-alt fa-rotate-90';
            const moreIcon = document.getElementById('moreOrientationIcon');
            const moreLabel = document.getElementById('moreOrientationLabel');
            if (moreIcon) moreIcon.className = 'fas fa-mobile-alt fa-rotate-90';
            if (moreLabel) moreLabel.textContent = 'Modo vertical';
        }
    } catch(e) {}
}
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const isOpen = sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
    if (isOpen) {
        lockScroll();
    } else {
        unlockScroll();
    }
}

// ===== VIEW SWITCHING =====
function switchView(view, el) {
    ['dashboard','products','categories','orders','coupons','inventory','analytics','settings'].forEach(v => { document.getElementById('view-' + v).style.display = 'none'; });
    document.getElementById('view-' + view).style.display = 'block';
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
    else { const link = document.querySelector(`.sidebar-nav a[onclick*="'${view}'"]`); if (link) link.classList.add('active'); }
    const titles = { dashboard: 'Dashboard', products: 'Productos', categories: 'Categorías', orders: 'Pedidos', coupons: 'Cupones', inventory: 'Inventario', analytics: 'Analíticas', settings: 'Ajustes' };
    document.getElementById('pageTitle').textContent = titles[view] || view;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarBackdrop').classList.remove('active');
    unlockScroll();
    if (view === 'analytics') setTimeout(updateCharts, 100);
    if (view === 'inventory') renderInventory();
    if (view === 'orders') renderOrders();
    if (view === 'categories') renderCategoriesView();
    if (view === 'products') { renderTable(); renderCategoryChips(); renderSidebarCategories(); }
}

// ===== DROPDOWN =====
function toggleDropdown(id) { document.querySelectorAll('.dropdown').forEach(d => { if (d.id !== id) d.classList.remove('open'); }); document.getElementById(id).classList.toggle('open'); }

// ===== SPOTLIGHT SEARCH =====
function openSpotlight() {
    document.getElementById('spotlightOverlay').classList.add('active');
    document.getElementById('spotlightInput').value = '';
    lockScroll();
    searchSpotlight();
    // Delay focus to allow overlay to render and keyboard to adjust viewport
    setTimeout(function() {
        var input = document.getElementById('spotlightInput');
        if (input) input.focus();
    }, 100);
}
function closeSpotlight(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('spotlightOverlay').classList.remove('active');
    unlockScroll();
}
function searchSpotlight() {
    const q = document.getElementById('spotlightInput').value.toLowerCase().trim();
    const results = document.getElementById('spotlightResults');
    if (!q) {
        results.innerHTML = `<div class="spotlight-group"><div class="spotlight-group-title">Navegación</div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('dashboard')"><i class="fas fa-chart-pie"></i><span>Dashboard</span><span class="shortcut">Ctrl+1</span></div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('products')"><i class="fas fa-box"></i><span>Productos</span><span class="shortcut">Ctrl+2</span></div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('orders')"><i class="fas fa-shopping-bag"></i><span>Pedidos</span><span class="shortcut">Ctrl+3</span></div>
            <div class="spotlight-item" onclick="closeSpotlight();switchView('analytics')"><i class="fas fa-chart-line"></i><span>Analíticas</span><span class="shortcut">Ctrl+4</span></div>
        </div>`;
        return;
    }
    const matchedProducts = products.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)).slice(0, 5);
    let html = '';
    if (matchedProducts.length > 0) {
        html += `<div class="spotlight-group"><div class="spotlight-group-title">Productos</div>`;
        matchedProducts.forEach(p => { html += `<div class="spotlight-item" onclick="closeSpotlight();switchView('products');editProduct(${p.id})"><i class="fas fa-box" style="color:${categoryColors[p.category]||'#888'}"></i><span>${p.name}</span><span class="shortcut">$${p.price.toLocaleString()}</span></div>`; });
        html += `</div>`;
    }
    const matchedOrders = orders.filter(o => o.customer.toLowerCase().includes(q) || String(o.id).includes(q)).slice(0, 3);
    if (matchedOrders.length > 0) {
        html += `<div class="spotlight-group"><div class="spotlight-group-title">Pedidos</div>`;
        matchedOrders.forEach(o => { html += `<div class="spotlight-item" onclick="closeSpotlight();switchView('orders')"><i class="fas fa-shopping-bag"></i><span>Pedido #${String(o.id).padStart(4,'0')} — ${o.customer}</span><span class="shortcut">$${o.total.toLocaleString()}</span></div>`; });
        html += `</div>`;
    }
    if (matchedProducts.length === 0 && matchedOrders.length === 0) html = `<div class="spotlight-group"><div class="spotlight-item" style="color:var(--fog);cursor:default;"><i class="fas fa-search"></i><span>No se encontraron resultados</span></div></div>`;
    results.innerHTML = html;
}
function navigateSpotlight(e) { if (e.key === 'Escape') closeSpotlight(); }

// ===== NOTIFICATIONS =====
function addNotification(type, message) {
    const notif = { id: Date.now(), type, message, time: new Date().toISOString(), read: false };
    notifications.unshift(notif);
    if (notifications.length > 20) notifications.pop();
    updateNotificationPanel();
    updateNotificationDot();
    showToast(message, type === 'order' ? 'success' : 'info');
}
function updateNotificationPanel() {
    const list = document.getElementById('notifList');
    if (notifications.length === 0) { list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--fog);font-size:13px;">Sin notificaciones</div>'; return; }
    list.innerHTML = notifications.map(n => {
        const time = new Date(n.time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const iconClass = n.type === 'order' ? 'order' : n.type === 'stock' ? 'stock' : 'system';
        const icon = n.type === 'order' ? 'fa-shopping-bag' : n.type === 'stock' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead(${n.id})"><div class="notif-item-icon ${iconClass}"><i class="fas ${icon}"></i></div><div class="notif-item-content"><p>${n.message}</p><span>${time}</span></div></div>`;
    }).join('');
}
function markRead(id) { const n = notifications.find(x => x.id === id); if (n) n.read = true; updateNotificationPanel(); updateNotificationDot(); }
function clearAllNotifications() { notifications.forEach(n => n.read = true); updateNotificationPanel(); updateNotificationDot(); }
function updateNotificationDot() { const dot = document.getElementById('notifDot'); const unread = notifications.filter(n => !n.read).length; dot.style.display = unread > 0 ? 'block' : 'none'; }
function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    const isActive = panel.classList.toggle('active');
    if (isActive) {
        lockScroll();
    } else {
        unlockScroll();
    }
}

// ===== REAL-TIME SIMULATION =====
let _simulationInterval = null;
function startRealtimeSimulation() {
    if (_simulationInterval) clearInterval(_simulationInterval);
    _simulationInterval = setInterval(() => {
        if (Math.random() > 0.7) {
            const types = ['stock', 'system'];
            const type = types[Math.floor(Math.random() * types.length)];
            const messages = {
                stock: ['Stock bajo detectado', 'Inventario actualizado'],
                system: ['Backup completado', 'Sincronización exitosa']
            };
            addNotification(type, messages[type][Math.floor(Math.random() * messages[type].length)]);
        }
    }, 60000);
}
window.addEventListener('beforeunload', () => {
    if (_simulationInterval) clearInterval(_simulationInterval);
});

// ===== TOAST =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation', info: 'fa-info' };
    toast.innerHTML = `<div class="toast-icon"><i class="fas ${icons[type] || icons.success}"></i></div><span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// ===== EVENT LISTENERS =====
let _hasUnsavedChanges = false;
function markUnsaved() { _hasUnsavedChanges = true; }
function clearUnsaved() { _hasUnsavedChanges = false; }

// Global scroll lock for overlays
let _scrollLockActive = false;
let _scrollPosition = 0;
let _touchMoveHandler = null;

function lockScroll() {
    if (_scrollLockActive) return;
    _scrollLockActive = true;
    _scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Prevent touch scrolling on body but allow on scrollable children
    _touchMoveHandler = function(e) {
        var target = e.target;
        var scrollable = false;
        // Check if the target or any parent is scrollable
        while (target && target !== document.body) {
            var style = window.getComputedStyle(target);
            if (style.overflow === 'auto' || style.overflow === 'scroll' || 
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
                // Check if there's actual scrollable content
                if (target.scrollHeight > target.clientHeight) {
                    scrollable = true;
                    break;
                }
            }
            target = target.parentElement;
        }
        if (!scrollable) {
            e.preventDefault();
        }
    };
    document.addEventListener('touchmove', _touchMoveHandler, { passive: false });
    document.addEventListener('wheel', _touchMoveHandler, { passive: false });
}

function unlockScroll() {
    if (!_scrollLockActive) return;
    _scrollLockActive = false;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    if (_touchMoveHandler) {
        document.removeEventListener('touchmove', _touchMoveHandler, { passive: false });
        document.removeEventListener('wheel', _touchMoveHandler, { passive: false });
        _touchMoveHandler = null;
    }
    window.scrollTo(0, _scrollPosition);
}

function initEventListeners() {
    window.addEventListener('beforeunload', function(e) {
        if (_hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    document.addEventListener('click', function(e) { 
    if (!e.target.closest('.dropdown')) document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open')); 
    if (!e.target.closest('.notif-panel') && !e.target.closest('[title="Notificaciones"]')) {
        var notifPanel = document.getElementById('notifPanel');
        if (notifPanel.classList.contains('active')) {
            notifPanel.classList.remove('active');
            unlockScroll();
        }
    }
    if (!e.target.closest('.cat-filter-wrap')) {
        const wrap = document.getElementById('catFilterWrap');
        if (wrap) {
            wrap.classList.remove('open');
            const chevron = document.getElementById('catFilterChevron');
            if (chevron) chevron.style.transform = '';
        }
    }
});
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); document.body.style.overflow = ''; closeSpotlight(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSpotlight(); }
        if (e.ctrlKey && e.key === '1') { e.preventDefault(); switchView('dashboard'); }
        if (e.ctrlKey && e.key === '2') { e.preventDefault(); switchView('products'); }
        if (e.ctrlKey && e.key === '3') { e.preventDefault(); switchView('orders'); }
        if (e.ctrlKey && e.key === '4') { e.preventDefault(); switchView('analytics'); }
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click', function(e) { if (e.target === this) { this.classList.remove('active'); document.body.style.overflow = ''; } }); });


// ===== STORAGE LISTENER: Pedidos desde catálogo =====
function initStorageListener() {
    window.addEventListener('storage', function(e) {
        if (e.key === 'khaos_admin_orders') {
            try {
                const newOrders = JSON.parse(e.newValue || '[]');
                const oldOrders = JSON.parse(e.oldValue || '[]');

                // Detectar pedidos nuevos
                if (newOrders.length > oldOrders.length) {
                    const newOrder = newOrders[0];
                    if (newOrder && newOrder.source === 'web') {
                        // Notificación toast
                        showToast(
                            '🔔 Nuevo pedido web: ' + (newOrder.customer || 'Cliente') + 
                            ' — $' + (newOrder.total || 0).toLocaleString('es-CO'),
                            'success'
                        );

                        // Notificación en panel
                        addNotification('order', 
                            'Nuevo pedido #' + String(newOrder.id).slice(-4) + 
                            ' desde catálogo — $' + (newOrder.total || 0).toLocaleString('es-CO')
                        );

                        // Actualizar datos locales
                        orders = newOrders;
                        nextOrderId = Math.max(...orders.map(o => o.id), 0) + 1;

                        // Actualizar UI si estamos en la vista de pedidos
                        renderOrders();
                        updateOrderStats();

                        // Actualizar dashboard
                        updateDashboard();

                        // Mostrar badge en sidebar
                        const badge = document.getElementById('sidebarOrderCount');
                        if (badge) {
                            const pending = orders.filter(o => o.status === 'pending').length;
                            badge.textContent = pending;
                            badge.style.display = pending > 0 ? 'flex' : 'none';
                        }
                    }
                }
            } catch(err) {
                console.error('Error procesando pedido nuevo:', err);
            }
        }

        // También escuchar cambios en productos del catálogo
        if (e.key === 'khaos_admin_products') {
            try {
                const parsed = JSON.parse(e.newValue);
                if (Array.isArray(parsed)) {
                    products = parsed;
                    nextId = Math.max(...products.map(p => p.id), 0) + 1;
                    saveProducts();
                    renderTable();
                    updateAllStats();
                    updateDashboard();
                    renderCategoriesView();
                    renderInventory();
                    updateCharts();
                    showToast('Catálogo actualizado desde tienda', 'info');
                }
            } catch(err) {}
        }
    });
}
}

// ===== START =====


/* ===== GITHUB SYNC MODULE ===== */
const GITHUB_CONFIG = {
    owner: 'khaosdeportivo',
    repo: 'khaosdeportivo',
    branch: 'main',
    path: 'productos.json',
    apiBase: 'https://api.github.com'
};

// El token ahora vive cifrado (ver TokenVault en admin-a.js). Si la página
// se recargó y el vault quedó bloqueado (sin la clave en memoria), se le
// pide al usuario reingresar su contraseña antes de poder usar el token.
async function getGithubToken() {
    if (!TokenVault.isUnlocked()) {
        if (TokenVault.hasToken()) {
            showToast('Reingresa tu contraseña para desbloquear el token de GitHub', 'warning');
            logout();
        }
        return '';
    }
    return await TokenVault.read();
}

async function saveGithubToken() {
    const token = document.getElementById('settingGithubToken').value.trim();
    if (!token) { showToast('Ingresa un token válido', 'warning'); return; }
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        showToast('El token debe empezar con ghp_ o github_pat_', 'error'); return;
    }
    if (!TokenVault.isUnlocked()) { showToast('Sesión no válida, vuelve a iniciar sesión', 'error'); return; }
    await TokenVault.save(token);
    document.getElementById('settingGithubToken').value = '';
    updateGithubUI();
    showToast('Token guardado (cifrado) correctamente', 'success');
}

function updateGithubUI() {
    const btn = document.getElementById('githubSyncBtn');
    const status = document.getElementById('githubSyncStatus');
    const hasToken = TokenVault.hasToken();

    if (hasToken) {
        btn.disabled = false;
        status.innerHTML = '<span style="color:var(--success);"><i class="fas fa-check-circle"></i> Configurado</span>';
    } else {
        btn.disabled = true;
        status.textContent = 'No configurado — ingresa tu token en Ajustes';
    }

    // Cargar última sync
    try {
        const last = localStorage.getItem('khaos_last_sync');
        if (last) document.getElementById('githubLastSync').textContent = new Date(last).toLocaleString('es-CO');
    } catch(e) {}
}

async function testGithubConnection() {
    const token = await getGithubToken();
    if (!token) { showToast('Primero guarda tu token en Ajustes', 'warning'); return; }

    showLoading('Probando conexión...');
    try {
        const res = await fetch(`${GITHUB_CONFIG.apiBase}/user`, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
            const user = await res.json();
            showToast(`✅ Conectado como ${user.login}`, 'success');
        } else {
            const err = await res.json();
            showToast(`❌ Error: ${err.message || 'Token inválido'}`, 'error');
        }
    } catch(e) {
        showToast('Error de red al conectar con GitHub', 'error');
    } finally {
        hideLoading();
    }
}

async function syncToGithub() {
    const token = await getGithubToken();
    if (!token) { showToast('Token no configurado', 'error'); return; }
    if (products.length === 0) { showToast('No hay productos para sincronizar', 'warning'); return; }

    showLoading('Sincronizando con GitHub...');

    try {
        // 1. Obtener SHA del archivo actual (si existe)
        let sha = null;
        try {
            const getRes = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=${GITHUB_CONFIG.branch}`,
                { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
            );
            if (getRes.ok) {
                const data = await getRes.json();
                sha = data.sha;
            }
        } catch(e) {}

        // 2. Preparar contenido
        const content = {
            productos: products,
            cupones: coupons,
            fechaActualizacion: new Date().toISOString(),
            version: 1
        };
        const base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

        // 3. Subir archivo
        const body = {
            message: `Actualización catálogo — ${new Date().toLocaleString('es-CO')}`,
            content: base64Content,
            branch: GITHUB_CONFIG.branch
        };
        if (sha) body.sha = sha;

        const putRes = await fetch(
            `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );

        if (putRes.ok || putRes.status === 201) {
            const now = new Date().toISOString();
            try { localStorage.setItem('khaos_last_sync', now); } catch(e) {}
            document.getElementById('githubLastSync').textContent = new Date(now).toLocaleString('es-CO');
            showToast('✅ Catálogo sincronizado con GitHub', 'success');
            addNotification('system', 'Catálogo sincronizado exitosamente');
        } else {
            const err = await putRes.json();
            showToast(`❌ Error GitHub: ${err.message || 'Desconocido'}`, 'error');
        }
    } catch(e) {
        showToast('Error al sincronizar: ' + e.message, 'error');
    } finally {
        hideLoading();
    }
}

// Auto-sincronizar al guardar productos (opcional, desactivado por defecto)
let autoSyncEnabled = false;
function toggleAutoSync() {
    autoSyncEnabled = !autoSyncEnabled;
    showToast(autoSyncEnabled ? 'Auto-sync activado' : 'Auto-sync desactivado', 'info');
}

document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    if (!checkAuth()) return;
    init();
});
