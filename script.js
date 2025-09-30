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

// Load products from localStorage and update shop
function loadProductsToShop() {
    const products = JSON.parse(localStorage.getItem('alaliProducts')) || [];
    const shopGrid = document.querySelector('.shop-grid');
    
    if (shopGrid && products.length > 0) {
        shopGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/300x200/333/FFFFFF?text=Product+Image'">
                <h3>${product.name}</h3>
                <p class="price">$${parseFloat(product.price).toFixed(2)}</p>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <button class="add-to-cart">Add to Cart</button>
            </div>
        `).join('');
    } else if (shopGrid && products.length === 0) {
        // Show default products if no admin products exist
        shopGrid.innerHTML = `
            <div class="product-card">
                <img src="https://via.placeholder.com/300x200/333/FFFFFF?text=LUXURY+WATCH" alt="Luxury Watch">
                <h3>Premium Watch</h3>
                <p class="price">$299.99</p>
                <button class="add-to-cart">Add to Cart</button>
            </div>
            <div class="product-card">
                <img src="https://via.placeholder.com/300x200/555/FFFFFF?text=DESIGNER+BAG" alt="Designer Bag">
                <h3>Designer Handbag</h3>
                <p class="price">$399.99</p>
                <button class="add-to-cart">Add to Cart</button>
            </div>
            <div class="product-card">
                <img src="https://via.placeholder.com/300x200/777/FFFFFF?text=SMART+DEVICE" alt="Smart Device">
                <h3>Smart Device</h3>
                <p class="price">$199.99</p>
                <button class="add-to-cart">Add to Cart</button>
            </div>
            <div class="product-card">
                <img src="https://via.placeholder.com/300x200/333/FFFFFF?text=PREMIUM+PERFUME" alt="Premium Perfume">
                <h3>Luxury Fragrance</h3>
                <p class="price">$149.99</p>
                <button class="add-to-cart">Add to Cart</button>
            </div>
            <div class="product-card">
                <img src="https://via.placeholder.com/300x200/555/FFFFFF?text=JEWELRY+SET" alt="Jewelry Set">
                <h3>Elegant Jewelry Set</h3>
                <p class="price">$499.99</p>
                <button class="add-to-cart">Add to Cart</button>
            </div>
            <div class="product-card">
                <img src="https://via.placeholder.com/300x200/777/FFFFFF?text=TECH+GADGET" alt="Tech Gadget">
                <h3>Innovative Tech Gadget</h3>
                <p class="price">$249.99</p>
                <button class="add-to-cart">Add to Cart</button>
            </div>
        `;
    }
}

// Load header, footer, and all page content
document.addEventListener('DOMContentLoaded', async function() {
    // Load header and footer
    await loadHTML('header', 'content/header.html');
    await loadHTML('footer', 'content/footer.html');
    
    // Load all page content
    await loadHTML('shop-content', 'content/shop.html');
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

// Initialize navigation event listeners - FIXED VERSION
function initializeNavigation() {
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
        
        // Handle add to cart buttons (delegated event) - NOW WITH AUTH CHECK
        if (e.target.classList.contains('add-to-cart')) {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                const productName = productCard.querySelector('h3').textContent;
                const price = parseFloat(productCard.querySelector('.price').textContent.replace('$', ''));
                addToCart(productName, price);
            }
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

// Cart functionality - UPDATED WITH AUTH CHECK
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productName, price) {
    // Check if user is logged in using the auth system
    if (window.authSystem && !window.authSystem.canAddToCart()) {
        return; // Stop here if user is not logged in
    }
    
    const product = {
        name: productName,
        price: price,
        id: Date.now(),
        addedAt: new Date().toISOString()
    };
    
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show notification
    showNotification(`${productName} added to cart!`);
    updateCartCount();
    
    // Update navigation cart count
    if (window.authSystem) {
        window.authSystem.updateNavigation();
    }
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
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});

// AUTHENTICATION SYSTEM INTEGRATION - UPDATED WITH CART LINK
function initializeAuthSystem() {
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
                return cart.length;
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
                    // User is logged in - show user link
                    const userLink = document.createElement('li');
                    userLink.className = 'auth-link';
                    userLink.innerHTML = `<a href="auth/user.html" class="external-link">My Account</a>`;
                    nav.appendChild(userLink);

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