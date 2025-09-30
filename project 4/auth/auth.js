// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.attachEventListeners();
    }

    // Load current user from localStorage
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        }
    }

    // Save current user to localStorage
    saveCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateUI();
    }

    // Register new user
    register(userData) {
        const users = this.getUsers();
        
        // Check if email already exists
        if (users.find(user => user.email === userData.email)) {
            throw new Error('Email already registered');
        }

        // Validate password match
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Passwords do not match');
        }

        const newUser = {
            id: Date.now().toString(),
            firstname: userData.firstname,
            lastname: userData.lastname,
            email: userData.email,
            password: userData.password, // In real app, hash this!
            role: 'user',
            joinDate: new Date().toISOString(),
            orders: []
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto-login after registration
        this.saveCurrentUser(newUser);
        return newUser;
    }

    // Login user
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }

        this.saveCurrentUser(user);
        return user;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
    }

    // Get all users from localStorage
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Update UI based on authentication state
    updateUI() {
        // Update navigation in main site
        this.updateNavigation();
        
        // Update user page if we're on it
        if (window.location.pathname.includes('user.html')) {
            this.updateUserPage();
        }
    }

    // Update navigation in main site
    updateNavigation() {
        const nav = document.querySelector('nav ul');
        if (!nav) return;

        // Remove existing auth links
        const existingAuthLinks = nav.querySelectorAll('.auth-link, .admin-link');
        existingAuthLinks.forEach(link => link.remove());

        if (this.isLoggedIn()) {
            // User is logged in - show user link and logout
            const userLink = document.createElement('li');
            userLink.className = 'auth-link';
            userLink.innerHTML = `<a href="auth/user.html">My Account</a>`;
            nav.appendChild(userLink);

            // Add admin link if user is admin
            if (this.isAdmin()) {
                const adminLink = document.createElement('li');
                adminLink.className = 'admin-link';
                adminLink.innerHTML = `<a href="../admin/admin.html">Admin</a>`;
                nav.appendChild(adminLink);
            }
        } else {
            // User is not logged in - show login/register links
            const loginLink = document.createElement('li');
            loginLink.className = 'auth-link';
            loginLink.innerHTML = `<a href="auth/login.html">Login</a>`;
            nav.appendChild(loginLink);
        }
    }

    // Update user page content
    updateUserPage() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Update profile information
        document.getElementById('user-fullname').textContent = 
            `${this.currentUser.firstname} ${this.currentUser.lastname}`;
        document.getElementById('user-email').textContent = this.currentUser.email;
        document.getElementById('user-join-date').textContent = 
            new Date(this.currentUser.joinDate).toLocaleDateString();
        document.getElementById('user-role').textContent = 
            this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);

        // Show admin section if user is admin
        if (this.isAdmin()) {
            document.getElementById('admin-section').style.display = 'block';
        }

        // Update cart summary
        this.updateCartSummary();
    }

    // Update cart summary on user page
    updateCartSummary() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartSummary = document.getElementById('cart-summary');
        
        if (cart.length === 0) {
            cartSummary.innerHTML = '<p class="no-items">Your cart is empty</p>';
            return;
        }

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartSummary.innerHTML = `
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-info">
                            <h3>${item.name}</h3>
                            <p>$${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="cart-total" style="text-align: right; margin-top: 1rem; font-weight: 600;">
                Total: $${total.toFixed(2)}
            </div>
        `;
    }

    // Attach event listeners
    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    // Handle login
    handleLogin() {
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            this.login(email, password);
            this.showNotification('Login successful!');
            
            // Redirect to main page after short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Handle register
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
            
            // Redirect to main page after short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Handle logout
    handleLogout() {
        this.logout();
        this.showNotification('Logged out successfully');
        
        // Redirect to login page after short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existing = document.querySelector('.auth-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Check if user can add to cart (must be logged in)
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

// Initialize auth system
const auth = new AuthSystem();

// Create demo accounts on first load
function initializeDemoAccounts() {
    const users = auth.getUsers();
    
    // Only create demo accounts if they don't exist
    if (!users.find(u => u.email === 'user@alali.com')) {
        const demoUser = {
            id: '1',
            firstname: 'Demo',
            lastname: 'User',
            email: 'user@alali.com',
            password: 'user123',
            role: 'user',
            joinDate: new Date().toISOString(),
            orders: []
        };
        users.push(demoUser);
    }
    
    if (!users.find(u => u.email === 'admin@alali.com')) {
        const demoAdmin = {
            id: '2',
            firstname: 'Admin',
            lastname: 'User',
            email: 'admin@alali.com',
            password: 'admin123',
            role: 'admin',
            joinDate: new Date().toISOString(),
            orders: []
        };
        users.push(demoAdmin);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
}

// Initialize demo accounts when auth system loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoAccounts();
    
    // Update UI if we're on the main site
    if (!window.location.pathname.includes('/auth/') && !window.location.pathname.includes('/admin/')) {
        auth.updateUI();
    }
});

// Make auth system globally available
window.authSystem = auth;