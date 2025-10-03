class CartPage {
    constructor() {
        // 🧠 Warenkorb laden & normalisieren
        this.cart = (JSON.parse(localStorage.getItem('cart')) || []).map(it => {
            // Standardwerte setzen
            if (typeof it.quantity !== 'number' || it.quantity < 1) it.quantity = 1;

            // unitPrice berechnen, falls nicht vorhanden
            if (typeof it.unitPrice !== 'number') {
                if (typeof it.price === 'number' && it.quantity > 0) {
                    it.unitPrice = it.price / it.quantity;
                } else {
                    it.unitPrice = 0;
                }
            }

            // Preis neu berechnen
            it.price = it.unitPrice * it.quantity;
            return it;
        });

        this.loadCartItems();
        this.updateCartSummary();
        this.updateMainCartCount();
        this.attachEventListeners();
    }

    // 🛒 Warenkorb speichern
    saveCart() {
        this.cart = this.cart.map(it => {
            if (typeof it.quantity !== 'number' || it.quantity < 1) it.quantity = 1;
            if (typeof it.unitPrice !== 'number') {
                if (typeof it.price === 'number' && it.quantity > 0) {
                    it.unitPrice = it.price / it.quantity;
                } else {
                    it.unitPrice = 0;
                }
            }
            it.price = it.unitPrice * it.quantity;
            return it;
        });
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    // load cart
    loadCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const itemsCount = document.getElementById('cart-items-count');

        if (!this.cart || this.cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyCart.style.display = 'block';
            itemsCount.textContent = '0';
            return;
        }

        emptyCart.style.display = 'none';
        itemsCount.textContent = this.cart.reduce((sum, it) => sum + it.quantity, 0);

        // Debug: show items in the console
        console.log('Rendering cart items:', this.cart);

        cartItemsContainer.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item" data-item-id="${item.id || index}">
                <div class="cart-item-image-placeholder">
                    <img src="https://via.placeholder.com/100x80/333/FFFFFF?text=PRODUCT" 
                         alt="${item.name || 'Product'}" class="cart-item-image"
                         onerror="this.src='https://via.placeholder.com/100x80/333/FFFFFF?text=PRODUCT'">
                </div>
                <div class="cart-item-info">
                    <h3>${item.name || 'Unnamed Item'}</h3>
                    <p class="price">$${item.unitPrice.toFixed(2)} each</p>
                    <p class="item-id">Item ID: ${item.id || 'N/A'}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease-btn" data-index="${index}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn increase-btn" data-index="${index}">+</button>
                    </div>
                    <div class="line-total" style="font-weight:600;">
                        $${(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // 🧮 Bestellsumme aktualisieren
    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    // 🧮 Anzahl im Header aktualisieren
    updateMainCartCount() {
        const totalQty = this.cart.reduce((sum, it) => sum + (it.quantity || 1), 0);
        const countEl = document.querySelector('.cart-count');
        if (countEl) countEl.textContent = totalQty;
    }

    // 🛠️ Event-Handler für Buttons
    attachEventListeners() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('click', (e) => {
                const btn = e.target;
                if (!(btn instanceof HTMLElement)) return;

                // 🗑️ Entfernen
                if (btn.classList.contains('remove-btn')) {
                    const index = parseInt(btn.getAttribute('data-index'), 10);
                    if (!isNaN(index)) {
                        this.cart.splice(index, 1);
                        this.saveCart();
                        this.loadCartItems();
                        this.updateCartSummary();
                        this.updateMainCartCount();
                    }
                    return;
                }

                // ➕ Menge erhöhen
                if (btn.classList.contains('increase-btn')) {
                    const index = parseInt(btn.getAttribute('data-index'), 10);
                    if (!isNaN(index)) {
                        this.cart[index].quantity += 1;
                        this.saveCart();
                        this.loadCartItems();
                        this.updateCartSummary();
                        this.updateMainCartCount();
                    }
                    return;
                }

                // ➖ Menge verringern
                if (btn.classList.contains('decrease-btn')) {
                    const index = parseInt(btn.getAttribute('data-index'), 10);
                    if (!isNaN(index)) {
                        this.cart[index].quantity -= 1;
                        if (this.cart[index].quantity <= 0) {
                            this.cart.splice(index, 1);
                        }
                        this.saveCart();
                        this.loadCartItems();
                        this.updateCartSummary();
                        this.updateMainCartCount();
                    }
                    return;
                }
            });
        }

        // 🛍️ Checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.handleCheckout();
            });
        }
    }

    // ✅ Bestellung abschließen
    handleCheckout() {
        if (!this.cart || this.cart.length === 0) {
            this.showNotification('Your cart is empty.', 'error');
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            this.showNotification('Please log in to complete your purchase.', 'error');
            setTimeout(() => { window.location.href = '../auth/login.html'; }, 1200);
            return;
        }

        const orderDetails = this.generateOrderDetails();
        this.saveOrderToHistory(currentUser.id, orderDetails);

        // 🧹 Warenkorb leeren
        this.cart = [];
        this.saveCart();
        this.loadCartItems();
        this.updateCartSummary();
        this.updateMainCartCount();

        this.showNotification('Order placed successfully!', 'success');
        setTimeout(() => { window.location.href = '../auth/user.html'; }, 1000);
    }

    // 🧾 Bestelldaten generieren
    generateOrderDetails() {
        const items = this.cart.map(it => ({ ...it }));
        const subtotal = items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        return {
            orderId: 'ALC-' + Date.now(),
            items,
            subtotal,
            shipping,
            tax,
            total,
            status: 'confirmed',
            orderDate: new Date().toLocaleString(),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };
    }

    // 💾 Bestellung speichern
    saveOrderToHistory(userId, order) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return;
        if (!Array.isArray(users[idx].orders)) users[idx].orders = [];
        users[idx].orders.push(order);
        localStorage.setItem('users', JSON.stringify(users));
    }

    // 📢 Notification
    showNotification(message, type = 'info') {
        alert(message);
    }
}

// 🚀 Direkt initialisieren (kein DOMContentLoaded nötig!)
if (document.querySelector('.cart-main')) {
    new CartPage();
}

window.CartPage = CartPage;
