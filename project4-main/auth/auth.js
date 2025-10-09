// Authentication System
class AuthSystem {
    // 🧰 Hilfsfunktion: Cart-Items normalisieren
    normalizeCartItems(items) {
        return (items || []).map(it => {
            if (typeof it.quantity !== 'number' || it.quantity < 1) it.quantity = 1;
            if (typeof it.unitPrice !== 'number') it.unitPrice = (typeof it.price === 'number' ? it.price : 0);
            it.price = it.unitPrice * it.quantity;
            return it;
        });
    }

    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.attachEventListeners();
    }

    // 📥 Aktuellen Benutzer laden
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        }
    }

    // 💾 Benutzer speichern
    saveCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateUI();
    }

    // 📝 Benutzer registrieren
    register(userData) {
        const users = this.getUsers();

        if (users.find(user => user.email === userData.email)) {
            throw new Error('Email already registered');
        }

        if (userData.password !== userData.confirmPassword) {
            throw new Error('Passwords do not match');
        }

        const newUser = {
            id: Date.now().toString(),
            firstname: userData.firstname,
            lastname: userData.lastname,
            email: userData.email,
            password: userData.password, // ⚠️ In echten Projekten: hashen!
            role: 'user',
            joinDate: new Date().toISOString(),
            orders: []
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        this.saveCurrentUser(newUser);
        return newUser;
    }

    // 🔑 Login
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) throw new Error('Invalid email or password');

        this.saveCurrentUser(user);
        return user;
    }

    // 🚪 Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
    }

    // 📚 Alle Benutzer laden
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    // 🟢 Ist eingeloggt?
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 👤 Ist Admin?
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // 🔄 UI aktualisieren
    updateUI() {
        this.updateNavigation();
        if (window.location.pathname.includes('user.html')) {
            this.updateUserPage();
        }
    }

    // 🔁 Navigation aktualisieren
    updateNavigation() {
        const nav = document.querySelector('nav ul');
        if (!nav) return;

        nav.querySelectorAll('.auth-link, .admin-link').forEach(link => link.remove());

        if (this.isLoggedIn()) {
            const userLink = document.createElement('li');
            userLink.className = 'auth-link';
            userLink.innerHTML = `<a href="auth/user.html">My Account</a>`;
            nav.appendChild(userLink);

            if (this.isAdmin()) {
                const adminLink = document.createElement('li');
                adminLink.className = 'admin-link';
                adminLink.innerHTML = `<a href="../admin/admin.html">Admin</a>`;
                nav.appendChild(adminLink);
            }
        } else {
            const loginLink = document.createElement('li');
            loginLink.className = 'auth-link';
            loginLink.innerHTML = `<a href="auth/login.html">Login</a>`;
            nav.appendChild(loginLink);
        }
    }

    // 👤 Benutzerseite aktualisieren
    updateUserPage() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('user-fullname').textContent =
            `${this.currentUser.firstname} ${this.currentUser.lastname}`;
        document.getElementById('user-email').textContent = this.currentUser.email;
        document.getElementById('user-join-date').textContent =
            new Date(this.currentUser.joinDate).toLocaleDateString();
        document.getElementById('user-role').textContent =
            this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);

        if (this.isAdmin()) {
            document.getElementById('admin-section').style.display = 'block';
        }

        this.updateCartSummary();
        this.updateOrderHistory();
    }

    // 🛒 Cart-Zusammenfassung aktualisieren
    updateCartSummary() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartSummary = document.getElementById('cart-summary');

        if (cart.length === 0) {
            cartSummary.innerHTML = '<p class="no-items">Your cart is empty</p>';
            return;
        }

        const normalized = this.normalizeCartItems(cart);
        const total = normalized.reduce((sum, item) => sum + item.price, 0);
        cartSummary.innerHTML = `
            <div class="cart-items">
                ${normalized.map(item => `
                    <div class="cart-item">
                        <div class="cart-info">
                            <h3>${item.name}</h3>
                            <p>$${item.unitPrice.toFixed(2)} × ${item.quantity} = $${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="cart-total" style="text-align: right; margin-top: 1rem; font-weight: 600;">
                Total: $${total.toFixed(2)}
            </div>
        `;
    }

    // 📜 Bestellhistorie anzeigen ✅
    updateOrderHistory() {
        const ordersContainer = document.getElementById('order-history');
        if (!ordersContainer) return;

        const users = this.getUsers();
        const currentUser = this.currentUser;
        const user = users.find(u => u.id === currentUser.id);

        if (!user || !Array.isArray(user.orders) || user.orders.length === 0) {
            ordersContainer.innerHTML = `<p class="no-orders">You haven't placed any orders yet.</p>`;
            return;
        }

        const sortedOrders = [...user.orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        ordersContainer.innerHTML = sortedOrders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h3>Order #${order.orderId}</h3>
                    <p><strong>Date:</strong> ${order.orderDate}</p>
                    <p><strong>Status:</strong> ${order.status || 'Processing'}</p>
                    <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <p><strong>${item.name}</strong></p>
                            <p>${item.quantity} × $${item.unitPrice.toFixed(2)}</p>
                            <p><strong>Total:</strong> $${(item.quantity * item.unitPrice).toFixed(2)}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="order-summary" style="margin-top: 1rem;">
                    <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
                    <p><strong>Shipping:</strong> $${order.shipping.toFixed(2)}</p>
                    <p><strong>Tax:</strong> $${order.tax.toFixed(2)}</p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    }

    // 🔗 Event-Listener
    attachEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    // 🔐 Login
    handleLogin() {
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            this.login(email, password);
            this.showNotification('Login successful!');
            setTimeout(() => window.location.href = '../index.html', 1000);
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // 📝 Registrierung
    handleRegister() {
        try {
            const formData = new FormData(document.getElementById('register-form'));
            const userData = {
                firstname: formData.get('firstname'),
                lastname: formData.get('lastname'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            this.register(userData);
            this.showNotification('Account created successfully!');
            setTimeout(() => window.location.href = '../index.html', 1000);
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // 🚪 Logout
    handleLogout() {
        this.logout();
        this.showNotification('Logged out successfully');
        setTimeout(() => window.location.href = 'login.html', 1000);
    }

    // 📣 Toast-Nachricht
    showNotification(message, type = 'success') {
        const existing = document.querySelector('.auth-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    // 🛒 Check ob Hinzufügen erlaubt ist
    canAddToCart() {
        if (!this.isLoggedIn()) {
            this.showNotification('Please log in to add items to cart', 'error');
            setTimeout(() => {
                window.location.href = 'auth/login.html';
            }, 1500);
            return false;
        }
        return true;
    }
}

// 🔥 Auth-System initialisieren
const auth = new AuthSystem();

// 🧪 Demo-Accounts anlegen
function initializeDemoAccounts() {
    const users = auth.getUsers();

    if (!users.find(u => u.email === 'user@alali.com')) {
        users.push({
            id: '1',
            firstname: 'Demo',
            lastname: 'User',
            email: 'user@alali.com',
            password: 'user123',
            role: 'user',
            joinDate: new Date().toISOString(),
            orders: []
        });
    }

    if (!users.find(u => u.email === 'admin@alali.com')) {
        users.push({
            id: '2',
            firstname: 'Admin',
            lastname: 'User',
            email: 'admin@alali.com',
            password: 'admin123',
            role: 'admin',
            joinDate: new Date().toISOString(),
            orders: []
        });
    }

    localStorage.setItem('users', JSON.stringify(users));
}

// 📦 Demo-Accounts beim Laden erstellen
document.addEventListener('DOMContentLoaded', function () {
    initializeDemoAccounts();

    if (!window.location.pathname.includes('/auth/') && !window.location.pathname.includes('/admin/')) {
        auth.updateUI();
    }
});

// 🌐 Global verfügbar machen
window.authSystem = auth;
