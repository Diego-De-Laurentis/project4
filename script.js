
// --- API base patch (adds Render base URL when running on LWS) ---
(function(){
  try {
    const ORIG_FETCH = window.fetch.bind(window);
    const API_BASE = (window.API_BASE || '').replace(/\/$/,'');
    window.fetch = function(input, init){
      try {
        let url = (typeof input === 'string') ? input : input.url;
        if (url && url.startsWith('/api/')) {
          const newUrl = API_BASE ? (API_BASE + url) : url;
          if (typeof input === 'string') return ORIG_FETCH(newUrl, init);
          return ORIG_FETCH(new Request(newUrl, input), init);
        }
      } catch(e) { /* ignore */ }
      return ORIG_FETCH(input, init);
    };
  } catch(e) { /* ignore */ }
})();
// --- end API base patch ---
// ========== COOKIE MANAGEMENT FUNCTIONS ==========

// Set a cookie
function setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookie;
}

// Get a cookie value
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
        }
    }
    return null;
}

// Delete a cookie
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Check if cookies are enabled
function areCookiesEnabled() {
    try {
        setCookie('cookies_test', 'enabled', 1);
        const enabled = getCookie('cookies_test') === 'enabled';
        deleteCookie('cookies_test');
        return enabled;
    } catch (e) {
        return false;
    }
}

// Show cookie consent banner
function showCookieConsent() {
    if (getCookie('cookies_accepted')) {
        return; // Already accepted
    }

    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #333;
        color: white;
        padding: 1.5rem;
        z-index: 10000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        border-top: 1px solid #555;
    `;

    banner.innerHTML = `
        <div style="flex: 1; min-width: 300px;">
            <h3 style="margin: 0 0 0.5rem 0; color: white;">Cookie Consent</h3>
            <p style="margin: 0; color: #ccc; font-size: 0.9rem;">
                We use cookies to enhance your experience, remember your preferences, and keep you logged in. 
                By continuing to browse, you agree to our use of cookies.
            </p>
        </div>
        <div style="display: flex; gap: 1rem;">
            <button id="cookie-accept" class="btn" style="background: #27ae60;">Accept All</button>
            <button id="cookie-settings" class="btn btn-secondary">Settings</button>
        </div>
    `;

    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('cookie-accept').addEventListener('click', () => {
        setCookie('cookies_accepted', 'true', 365);
        setCookie('cookies_necessary', 'true', 365);
        setCookie('cookies_preferences', 'true', 365);
        setCookie('cookies_analytics', 'true', 365);
        banner.remove();
        showNotification('Cookie preferences saved!');
    });

    document.getElementById('cookie-settings').addEventListener('click', () => {
        showCookieSettings();
    });
}

// Show detailed cookie settings
function showCookieSettings() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
    `;

    const settings = document.createElement('div');
    settings.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        color: #333;
    `;

    const necessaryChecked = getCookie('cookies_necessary') !== null ? 'checked' : 'checked disabled';
    const preferencesChecked = getCookie('cookies_preferences') === 'true' ? 'checked' : '';
    const analyticsChecked = getCookie('cookies_analytics') === 'true' ? 'checked' : '';

    settings.innerHTML = `
        <h2 style="color: #000; margin-bottom: 1rem;">Cookie Settings</h2>
        
        <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                <div>
                    <h4 style="margin: 0; color: #000;">Necessary Cookies</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">
                        Required for the website to function properly. Cannot be disabled.
                    </p>
                </div>
                <input type="checkbox" id="necessary-cookies" ${necessaryChecked}>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                <div>
                    <h4 style="margin: 0; color: #000;">Preference Cookies</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">
                        Remember your settings and preferences for a better experience.
                    </p>
                </div>
                <input type="checkbox" id="preference-cookies" ${preferencesChecked}>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                <div>
                    <h4 style="margin: 0; color: #000;">Analytics Cookies</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">
                        Help us understand how visitors interact with our website.
                    </p>
                </div>
                <input type="checkbox" id="analytics-cookies" ${analyticsChecked}>
            </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="save-cookie-settings" class="btn" style="background: #27ae60;">Save Preferences</button>
            <button id="close-cookie-settings" class="btn btn-secondary">Close</button>
        </div>
    `;

    modal.appendChild(settings);
    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('save-cookie-settings').addEventListener('click', () => {
        const preferences = document.getElementById('preference-cookies').checked;
        const analytics = document.getElementById('analytics-cookies').checked;

        setCookie('cookies_accepted', 'true', 365);
        setCookie('cookies_necessary', 'true', 365);
        setCookie('cookies_preferences', preferences ? 'true' : 'false', 365);
        setCookie('cookies_analytics', analytics ? 'true' : 'false', 365);

        modal.remove();
        document.getElementById('cookie-consent-banner')?.remove();
        showNotification('Cookie preferences saved!');
    });

    document.getElementById('close-cookie-settings').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Save user preferences to cookies
function saveUserPreferences() {
    if (getCookie('cookies_preferences') !== 'true') return;

    const preferences = {
        theme: 'light', // Could be extended for dark mode
        language: 'en',
        currency: 'USD',
        lastVisit: new Date().toISOString()
    };

    setCookie('user_preferences', JSON.stringify(preferences), 30);
}

// Load user preferences from cookies
function loadUserPreferences() {
    if (getCookie('cookies_preferences') !== 'true') return null;

    try {
        const prefs = getCookie('user_preferences');
        return prefs ? JSON.parse(prefs) : null;
    } catch (e) {
        return null;
    }
}

// Enhanced session management with cookies
function manageUserSession(user) {
    if (user && getCookie('cookies_necessary') === 'true') {
        // Store user session in cookie (limited data for security)
        const sessionData = {
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            role: user.role,
            loggedInAt: new Date().toISOString()
        };
        setCookie('user_session', JSON.stringify(sessionData), 1); // 1 day expiry
        
        // Also keep in localStorage for compatibility
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
}

// Check for existing session on page load
function checkExistingSession() {
    const sessionCookie = getCookie('user_session');
    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie);
            // Restore user session
            localStorage.setItem('currentUser', JSON.stringify(session));
            console.log('Session restored from cookies');
            return session;
        } catch (e) {
            console.error('Invalid session cookie');
            deleteCookie('user_session');
        }
    }
    return null;
}

// Clear user session (logout)
function clearUserSession() {
    deleteCookie('user_session');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart'); // Also clear cart on logout
    
    // Clear all auth-related cookies
    deleteCookie('user_preferences');
}

// Track page view for analytics (if enabled)
function trackPageView() {
    if (getCookie('cookies_analytics') !== 'true') return;

    const pageViews = parseInt(getCookie('page_views') || '0') + 1;
    setCookie('page_views', pageViews.toString(), 365);
    
    console.log(`Page view tracked: ${pageViews}`);
}

// ========== PRODUCT LOADING FROM BACKEND ==========

const API_BASE = ''; // Same-origin, adjust if backend runs elsewhere

async function loadProductsToShop() {
    const shopGrid = document.querySelector('.shop-grid');
    if (!shopGrid) return;

    shopGrid.innerHTML = `
      <div class="product-card"><div class="skeleton-thumb"></div><h3 class="skeleton-text">Loading…</h3></div>
      <div class="product-card"><div class="skeleton-thumb"></div><h3 class="skeleton-text">Loading…</h3></div>
      <div class="product-card"><div class="skeleton-thumb"></div><h3 class="skeleton-text">Loading…</h3></div>
    `;

    try {
        const res = await fetch(`${API_BASE}/api/products`, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
        const products = await res.json();

        if (!Array.isArray(products) || products.length === 0) {
            shopGrid.innerHTML = `<p class="no-products">No products available. Please check back later.</p>`;
            return;
        }

        shopGrid.innerHTML = products.map(p => {
            const img = p.image_url || 'https://via.placeholder.com/300x200/333/FFFFFF?text=No+Image';
            const name = p.name ?? 'Unnamed Product';
            const price = (typeof p.price === 'number' ? p.price : parseFloat(p.price || 0));
            const desc = p.description ? `<p class="product-description">${p.description}</p>` : '';

            return `
              <div class="product-card" data-id="${p._id}">
                <img src="${img}" alt="${name}" onerror="this.src='https://via.placeholder.com/300x200/333/FFFFFF?text=Product+Image'">
                <h3>${name}</h3>
                <p class="price">$${price.toFixed(2)}</p>
                ${desc}
                <button class="add-to-cart" data-name="${name}" data-price="${price}">Add to Cart</button>
              </div>
            `;
        }).join('');

        // Removed duplicate add-to-cart event listener (global handler handles this)

    } catch (err) {
        console.error('Error loading products:', err);
        shopGrid.innerHTML = `<p class="no-products">Error loading products. Please try again later.</p>`;
    }
}

// Ensure load runs on shop.html
document.addEventListener('DOMContentLoaded', () => {
    const onShopPage =
        location.pathname.endsWith('/content/shop.html') ||
        location.pathname.endsWith('shop.html') ||
        document.querySelector('.shop-grid');

    if (onShopPage) {
        loadProductsToShop();
    }
});

// ========== UPDATED AUTHENTICATION SYSTEM ==========

// AUTHENTICATION SYSTEM INTEGRATION - UPDATED WITH COOKIE SUPPORT
function initializeAuthSystem() {
    // Check for existing session first
    checkExistingSession();

    // Create a simple auth system if it doesn't exist
    if (!window.authSystem) {
        window.authSystem = {
            isLoggedIn: function() {
                const user = localStorage.getItem('currentUser');
                return user !== null;
            },
            isAdmin: function() {
                const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                return user.role === 'admin';
            },
            canAddToCart: function() {
                if (!this.isLoggedIn()) {
                    showNotification('Please log in to add items to cart');
                    setTimeout(() => {
                        window.location.href = 'auth/login.html';
                    }, 1500);
                    return false;
                }
                return true;
            },
            getCartCount: function() {
                const cart = JSON.parse(localStorage.getItem('cart')) || [];
                return cart.reduce((total, item) => total + (item.quantity || 1), 0);
            },
            login: function(user) {
                manageUserSession(user);
                this.updateNavigation();
                saveUserPreferences();
            },
            logout: function() {
                clearUserSession();
                this.updateNavigation();
                showNotification('Logged out successfully');
            },
            updateNavigation: function() {
                const nav = document.querySelector('nav ul');
                if (!nav) return;

                // Remove existing dynamic links
                const existingDynamicLinks = nav.querySelectorAll('.auth-link, .admin-link, .cart-link');
                existingDynamicLinks.forEach(link => link.remove());

                // Always show cart link (dynamic)
                const cartLink = document.createElement('li');
                cartLink.className = 'cart-link';
                cartLink.innerHTML = `<a href="content/cart.html" class="external-link">Cart (<span id="nav-cart-count">${this.getCartCount()}</span>)</a>`;
                nav.appendChild(cartLink);

                if (this.isLoggedIn()) {
                    // User is logged in - show user link and logout
                    const userLink = document.createElement('li');
                    userLink.className = 'auth-link';
                    userLink.innerHTML = `<a href="auth/user.html" class="external-link">My Account</a>`;
                    nav.appendChild(userLink);

                    const logoutLink = document.createElement('li');
                    logoutLink.className = 'auth-link';
                    logoutLink.innerHTML = `<a href="#" id="logout-link" class="external-link">Logout</a>`;
                    nav.appendChild(logoutLink);

                    // Add logout handler
                    setTimeout(() => {
                        document.getElementById('logout-link')?.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.logout();
                            setTimeout(() => {
                                window.location.href = 'index.html';
                            }, 1000);
                        });
                    }, 100);

                    // Add admin link if user is admin
                    if (this.isAdmin()) {
                        const adminLink = document.createElement('li');
                        adminLink.className = 'admin-link';
                        adminLink.innerHTML = `<a href="admin/admin.html" class="external-link">Admin</a>`;
                        nav.appendChild(adminLink);
                    }
                } else {
                    // User is not logged in - show login link
                    const loginLink = document.createElement('li');
                    loginLink.className = 'auth-link';
                    loginLink.innerHTML = `<a href="auth/login.html" class="external-link">Login</a>`;
                    nav.appendChild(loginLink);
                }
            }
        };
    }
    
    // Update navigation with auth links
    window.authSystem.updateNavigation();
}

// ========== UPDATED CART FUNCTIONALITY WITH COOKIE SUPPORT ==========

// Cart functionality - UPDATED WITH COOKIE SUPPORT
let cart = normalizeCartItems(JSON.parse(localStorage.getItem('cart')) || []);

// Save cart to cookies (if preferences allow)
function saveCartToCookies() {
    if (getCookie('cookies_preferences') === 'true' && cart.length > 0) {
        setCookie('user_cart', JSON.stringify(cart), 7); // 7 days expiry
    }
}

// Load cart from cookies
// --- CART COOKIE CLEANUP ---
function clearCartCookiesIfEmpty() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        deleteCookie('user_cart');
    }
}

function loadCartFromCookies() {
    if (getCookie('cookies_preferences') === 'true') {
        const cartCookie = getCookie('user_cart');
        if (cartCookie) {
            try {
                const cookieCart = JSON.parse(cartCookie);
                if (Array.isArray(cookieCart) && cookieCart.length > 0) {
                    // Merge cookie cart with current cart, preferring cookie items
                    const currentIds = new Set(cart.map(item => item.id));
                    cookieCart.forEach(item => {
                        if (!currentIds.has(item.id)) {
                            cart.push(item);
                        }
                    });
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    console.log('Cart loaded from cookies');
                }
            } catch (e) {
                console.error('Error loading cart from cookies:', e);
            }
        }
    }
}

// Enhanced addToCart with cookie support
function addToCart(productName, price) {
    // Dedup guard: prevent accidental double-trigger within 200ms for the same item
    try {
        const key = String(productName || '').trim().toLowerCase();
        const now = Date.now();
        window.__cartAddGate = window.__cartAddGate || {};
        if (window.__cartAddGate[key] && (now - window.__cartAddGate[key]) < 200) {
            return; // drop duplicate
        }
        window.__cartAddGate[key] = now;
    } catch (e) { /* noop */ }

    // Check if user is logged in using the auth system
    if (window.authSystem && !window.authSystem.canAddToCart()) {
        return; // Stop here if user is not logged in
    }
    
    // Normalize cart in case of legacy entries
    cart = normalizeCartItems(cart);
    
    // Try to find existing item by name (case-insensitive)
    const key = productName.trim().toLowerCase();
    const idx = cart.findIndex(it => (it.name || '').trim().toLowerCase() === key);
    if (idx !== -1) {
        // increment quantity and recompute line price
        cart[idx].quantity += 1;
        cart[idx].unitPrice = price; // keep latest price as unit price
        cart[idx].price = cart[idx].unitPrice * cart[idx].quantity;
        cart[idx].updatedAt = new Date().toISOString();
    } else {
        const product = {
            id: Date.now(),
            name: productName,
            unitPrice: price,
            quantity: 1,
            price: price,
            addedAt: new Date().toISOString()
        };
        cart.push(product);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    saveCartToCookies(); // Save to cookies
    
    // Show notification
    showNotification(`${productName} added to cart!`);
    updateCartCount();
    
    // Update navigation cart count
    if (window.authSystem) {
        window.authSystem.updateNavigation();
    }
}

// ========== UPDATED MAIN INITIALIZATION ==========

// Load header, footer, and all page content
document.addEventListener('DOMContentLoaded', async function() {
    // Check cookie support
    if (!areCookiesEnabled()) {
        console.warn('Cookies are disabled - some features may not work properly');
    }

    // Show cookie consent banner if not accepted
    setTimeout(() => {
        showCookieConsent();
    }, 1000);

    // Load user preferences
    const preferences = loadUserPreferences();
    if (preferences) {
        console.log('Loaded user preferences:', preferences);
    }

    // Load cart from cookies
    loadCartFromCookies();

    // Track page view for analytics
    trackPageView();

    // Load header and footer
    await loadHTML('header', 'content/header.html');
    await loadHTML('footer', 'content/footer.html');
    
    // Load all page content
    await loadHTML('shop-content', 'content/shop.html');
    // Ensure products load after shop.html is inserted
    loadProductsToShop();
    await loadHTML('about-content', 'content/about.html');
    await loadHTML('contact-content', 'content/contact.html');
    
    // Initialize navigation after a short delay to ensure DOM is ready
    setTimeout(() => {
        initializeNavigation();
        
        // Show home page by default
        showHomePage();
        
        // Check if there's a hash in URL and navigate to that page
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== 'home' && hash !== '') {
            showPage(hash);
            setActiveNavLink(hash);
        }
        
        // Initialize auth system and update navigation
        initializeAuthSystem();
    }, 100);
});

// ========== REST OF YOUR EXISTING CODE ==========

// Function to load HTML content (similar to PHP include)
async function loadHTML(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
    }
}

// Function to show specific page content
function showPage(pageName) {
    const mainContent = document.querySelector('main');
    
    // Hide all sections and page content
    const homeSections = mainContent.querySelectorAll('.hero, .featured-products');
    const pageSections = mainContent.querySelectorAll('.page-section');
    
    // Hide home sections
    homeSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Hide all page sections
    pageSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the requested page
    const targetPage = document.getElementById(`${pageName}-content`);
    if (targetPage) {
        targetPage.style.display = 'block';
        console.log(`Showing page: ${pageName}`); // Debug log
        
        // Load products if showing shop page
        if (pageName === 'shop') {
            loadProductsToShop();
        }
        
        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`Page not found: ${pageName}-content`);
    }
}

// Function to set active navigation link
function setActiveNavLink(activePage) {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${activePage}`) {
            link.classList.add('active');
        }
    });
}

// Initialize navigation event listeners - FIXED VERSION
function initializeNavigation() {
    
    // Guard: ensure we don't attach duplicate global click listener
    if (window.__navHandlerInstalled) { return; }
    window.__navHandlerInstalled = true;
// Add click event listener to the document for navigation
    document.addEventListener('click', function(e) {
        // Handle navigation clicks - ONLY for hash links (internal navigation)
        if (e.target.matches('nav a[href^="#"]') || e.target.closest('nav a[href^="#"]')) {
            e.preventDefault();
            const link = e.target.matches('nav a') ? e.target : e.target.closest('nav a');
            const target = link.getAttribute('href').replace('#', '');
            
            console.log('Internal navigation clicked:', target); // Debug log
            
            if (target === 'home') {
                showHomePage();
            } else if (target === 'shop' || target === 'about' || target === 'contact') {
                showPage(target);
                setActiveNavLink(target);
            }
            
            // Update URL hash
            window.location.hash = target;
        }
        
        // Handle add to cart buttons (delegated event) - robust & single-call
const btn = e.target.closest('.add-to-cart');
if (btn) {
    const name = btn.getAttribute('data-name') || btn.closest('.product-card')?.querySelector('h3')?.textContent || 'Unknown Item';
    const priceAttr = btn.getAttribute('data-price');
    let price = parseFloat(priceAttr ?? 'NaN');
    if (isNaN(price)) {
        const card = btn.closest('.product-card');
        const priceText = card?.querySelector('.price')?.textContent?.replace('$','') ?? '0';
        price = parseFloat(priceText) || 0;
    }
    addToCart(name, price);
}

// Handle contact form submission

        if (e.target.type === 'submit' && e.target.closest('.contact-form')) {
            e.preventDefault();
            handleContactForm();
        }
    });
}

// Show home page (hero + featured products)
function showHomePage() {
    const mainContent = document.querySelector('main');
    const hero = mainContent.querySelector('.hero');
    const featuredProducts = mainContent.querySelector('.featured-products');
    const pageSections = mainContent.querySelectorAll('.page-section');
    
    // Show home sections
    if (hero) hero.style.display = 'flex';
    if (featuredProducts) featuredProducts.style.display = 'block';
    
    // Hide other pages
    pageSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Set home as active
    setActiveNavLink('home');
    
    // Update URL hash
    window.location.hash = 'home';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle contact form submission
function handleContactForm() {
    const form = document.querySelector('.contact-form');
    const formData = new FormData(form);
    
    // Simple form validation
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#e74c3c';
        } else {
            field.style.borderColor = '#ddd';
        }
    });
    
    if (isValid) {
        showNotification('Thank you for your message! We will get back to you soon.');
        form.reset();
    } else {
        showNotification('Please fill in all required fields.');
    }
}

// --- CART HELPERS ---
function normalizeCartItems(items) {
    return (items || []).map(it => {
        if (typeof it.quantity !== 'number' || it.quantity < 1) it.quantity = 1;
        if (typeof it.unitPrice !== 'number') it.unitPrice = (typeof it.price === 'number' ? it.price : 0);
        // keep legacy price for compatibility but prefer unitPrice
        it.price = it.unitPrice * it.quantity;
        return it;
    });
}

function showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateCartCount() {
    try {
        const items = normalizeCartItems(JSON.parse(localStorage.getItem('cart')) || []);
        const totalQty = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
        const countEl = document.querySelector('.cart-count');
        if (countEl) countEl.textContent = totalQty;
    } catch(e) {
        const countEl = document.querySelector('.cart-count');
        if (countEl) countEl.textContent = '0';
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});

// Enhanced notification system for auth messages
function showAuthNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.backgroundColor = type === 'error' ? '#e74c3c' : '#333';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Override the original showNotification to handle auth messages
const originalShowNotification = showNotification;
showNotification = function(message) {
    // If it's an auth-related message, use the styled version
    if (message.includes('log in') || message.includes('Please login')) {
        showAuthNotification(message, 'error');
    } else {
        originalShowNotification(message);
    }
};