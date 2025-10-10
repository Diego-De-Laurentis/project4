// Admin Panel JavaScript - MongoDB/REST compatible
document.addEventListener('DOMContentLoaded', function () {
  console.log('Admin panel loaded');

  // ---- simple admin "login" (local only) ----
  const loginSection = document.getElementById('admin-login');
  const dashboardSection = document.getElementById('admin-dashboard');
  const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  isLoggedIn ? showDashboard() : showLogin();

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if (u === 'admin' && p === 'admin123') {
      localStorage.setItem('adminLoggedIn', 'true');
      showDashboard();
      notify('Login successful');
    } else {
      alert('Invalid credentials! Use: admin / admin123');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    showLogin();
    notify('Logged out');
  });

  function showLogin() {
    loginSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }
  function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loadProducts();
    loadUsers();
    loadOrders();
    loadStatistics();
  }

  // ================== PRODUCTS ==================
  document.getElementById('add-product-form').addEventListener('submit', onSubmitProduct);
  document.getElementById('cancel-edit-btn').addEventListener('click', resetProductForm);

  async function loadProducts() {
    try {
      const r = await fetch('/api/admin/products', { credentials: 'include' });
      const raw = await safeJson(r);
      const products = normalizeList(raw, 'products');

      const wrap = document.getElementById('products-list');
      if (!products.length) {
        wrap.innerHTML = '<p class="no-products">No products yet. Add your first product above.</p>';
        return;
      }

      wrap.innerHTML = products.map(p => `
        <div class="product-item">
          <img src="${p.image_url || ''}" alt="${p.name || ''}" class="product-image"
               onerror="this.src='https://via.placeholder.com/100x80/333/FFF?text=No+Image'">
          <div class="product-info">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="price">$${Number(p.price ?? 0).toFixed(2)}</p>
            <p class="description">${escapeHtml(p.description || 'No description')}</p>
            <small>Category: ${escapeHtml(p.category || '')}</small>
            <small>ID: ${p._id || '-'}</small>
          </div>
          <div class="product-actions">
            <button class="btn-edit" data-product-id="${p._id || ''}" disabled title="Edit route not enabled on server">Edit</button>
            <button class="btn-danger" data-product-id="${p._id || ''}" disabled title="Delete route not enabled on server">Delete</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading products:', err);
      document.getElementById('products-list').innerHTML = '<p class="no-products">Error loading products.</p>';
    }
  }

  async function onSubmitProduct(e) {
    e.preventDefault();
    const f = e.target;

    const product = {
      name: f.querySelector('[name="product-name"]').value.trim(),
      price: Number(f.querySelector('[name="product-price"]').value),
      description: f.querySelector('[name="product-description"]').value.trim(),
      image_url: f.querySelector('[name="product-image"]').value.trim(),
      category: f.querySelector('[name="product-category"]').value.trim()
    };

    if (!product.name || !Number.isFinite(product.price) || !product.image_url) {
      alert('Please fill Name, Price and Image URL.'); return;
    }

    try {
      const r = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(product)
      });

      const data = await safeJson(r);
      if (!r.ok) {
        // Backend liefert {error: "..."} oder {message: "..."}
        const msg = data?.error || data?.message || `HTTP ${r.status}`;
        throw new Error(msg);
      }

      e.target.reset();
      notify('Product added');
      await loadProducts();
    } catch (err) {
      console.error('Add product error:', err);
      alert('Failed to add product: ' + (err.message || err));
    }
  }

  function resetProductForm() {
    const f = document.getElementById('add-product-form');
    f.reset();
    f.removeAttribute('data-editing');
    document.getElementById('submit-product-btn').textContent = 'Add Product';
    document.getElementById('cancel-edit-btn').style.display = 'none';
  }

  // ================== USERS ==================
  async function loadUsers() {
    try {
      const r = await fetch('/api/admin/users', { credentials: 'include' });
      const raw = await safeJson(r);
      const users = normalizeList(raw, 'users');

      const wrap = document.getElementById('users-list');
      if (!users.length) {
        wrap.innerHTML = '<p class="no-users">No users yet.</p>'; return;
        }
      wrap.innerHTML = users.map(u => `
        <div class="user-item">
          <div class="user-avatar">${(u.firstname || 'U').charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <h3>${escapeHtml((u.firstname || '') + ' ' + (u.lastname || ''))}</h3>
            <p class="email">${escapeHtml(u.email || '')}</p>
            <p class="phone">${escapeHtml(u.phone || 'No phone')}</p>
            <small>Joined: ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</small>
            <small>Role: ${escapeHtml(u.role || '')}</small>
          </div>
          <div class="user-actions">
            <button class="btn-edit" disabled title="Edit route not enabled on server">Edit</button>
            <button class="btn-danger" disabled title="Delete route not enabled on server">Delete</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading users:', err);
      document.getElementById('users-list').innerHTML = '<p class="no-users">Error loading users.</p>';
    }
  }

  // ================== ORDERS (stub) ==================
  async function loadOrders() {
    try {
      const r = await fetch('/api/admin/orders', { credentials: 'include' });
      const raw = await safeJson(r);
      const orders = normalizeList(raw, 'orders');

      const wrap = document.getElementById('orders-list');
      if (!orders.length) { wrap.innerHTML = '<p class="no-orders">No orders yet.</p>'; return; }
      wrap.innerHTML = orders.map(o => `
        <div class="order-item">
          <div class="order-header">
            <div class="order-id">Order #${escapeHtml(o.order_id || '')}</div>
            <div class="order-status">${escapeHtml(o.status || 'pending')}</div>
          </div>
          <div class="order-totals">
            <div class="total-amount">Total: $${Number(o.total || 0).toFixed(2)}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading orders:', err);
      document.getElementById('orders-list').innerHTML = '<p class="no-orders">Error loading orders.</p>';
    }
  }

  // ================== STATISTICS ==================
  async function loadStatistics() {
    try {
      const r = await fetch('/api/admin/statistics', { credentials: 'include' });
      const data = await safeJson(r);

      // Unterstützt beides:
      // {products, users, orders, revenueCents}
      // oder {success:true, statistics:{...}}
      const stats = data?.statistics || data || {};
      const users = stats.totalUsers ?? stats.users ?? 0;
      const products = stats.totalProducts ?? stats.products ?? 0;
      const orders = stats.totalOrders ?? stats.orders ?? 0;
      const revenue = (stats.totalRevenue ?? (stats.revenueCents ? stats.revenueCents / 100 : 0));

      document.getElementById('total-users').textContent = users;
      document.getElementById('total-products').textContent = products;
      document.getElementById('total-orders').textContent = orders;
      document.getElementById('total-revenue').textContent = `$${Number(revenue).toFixed(2)}`;
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }

  // ================== helpers ==================
  function notify(msg) {
    const n = document.createElement('div');
    n.className = 'admin-notification';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
  }

  async function safeJson(res) {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const t = await res.text();
      throw new Error(`Non-JSON response: ${t.slice(0, 200)}`);
    }
    return res.json();
  }

  function normalizeList(payload, key) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload[key])) return payload[key];
    if (payload && payload.success && Array.isArray(payload.data)) return payload.data;
    return [];
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
