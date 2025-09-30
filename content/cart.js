// Cart Page Functionality
class CartPage {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    init() {
        this.loadCartItems();
        this.attachEventListeners();
        this.updateCartSummary();
    }

    // Load cart items from localStorage
    loadCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const cartItemsCount = document.getElementById('cart-items-count');

        if (this.cart.length === 0) {
            cartItemsContainer.style.display = 'none';
            emptyCart.style.display = 'block';
            cartItemsCount.textContent = '0';
            return;
        }

        cartItemsContainer.style.display = 'flex';
        emptyCart.style.display = 'none';
        cartItemsCount.textContent = this.cart.length;

        cartItemsContainer.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-image-placeholder">
                    <img src="https://via.placeholder.com/100x80/333/FFFFFF?text=PRODUCT" 
                         alt="${item.name}" class="cart-item-image"
                         onerror="this.src='https://via.placeholder.com/100x80/333/FFFFFF?text=PRODUCT'">
                </div>
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p class="price">$${item.price.toFixed(2)}</p>
                    <p class="item-id">Item ID: ${item.id}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease-btn" data-index="${index}">-</button>
                        <span class="quantity-display">1</span>
                        <button class="quantity-btn increase-btn" data-index="${index}">+</button>
                    </div>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Update cart summary (subtotal, shipping, tax, total)
    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0);
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'FREE';
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    // Remove item from cart
    removeItem(index) {
        if (index >= 0 && index < this.cart.length) {
            const removedItem = this.cart[index];
            this.cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(this.cart));
            
            this.loadCartItems();
            this.updateCartSummary();
            this.updateMainCartCount();
            
            this.showNotification(`"${removedItem.name}" removed from cart`);
        }
    }

    // Update quantity (for future enhancement)
    updateQuantity(index, change) {
        // Currently each item is separate in cart
        // This can be enhanced to handle multiple quantities of same item
        this.showNotification('Quantity feature coming soon!');
    }

    // Update main site cart count
    updateMainCartCount() {
        // Update the navigation cart count
        if (window.authSystem) {
            window.authSystem.updateNavigation();
        }
    }

    // Attach event listeners
    attachEventListeners() {
        // Remove button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.removeItem(index);
            }

            // Quantity buttons (for future enhancement)
            if (e.target.classList.contains('decrease-btn')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.updateQuantity(index, -1);
            }

            if (e.target.classList.contains('increase-btn')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.updateQuantity(index, 1);
            }

            // Checkout button
            if (e.target.id === 'checkout-btn') {
                this.handleCheckout();
            }
        });
    }

    // Handle checkout process with email confirmation
    handleCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'error');
            return;
        }

        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('currentUser') !== null;
        
        if (!isLoggedIn) {
            this.showNotification('Please log in to proceed with checkout');
            setTimeout(() => {
                window.location.href = 'auth/login.html';
            }, 1500);
            return;
        }

        // Get user information
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const orderDetails = this.generateOrderDetails();
        
        // Show checkout confirmation modal
        this.showCheckoutConfirmation(user, orderDetails);
    }

    // Generate order details
    generateOrderDetails() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0);
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        return {
            orderId: 'ALC-' + Date.now(),
            items: [...this.cart],
            subtotal: subtotal,
            shipping: shipping,
            tax: tax,
            total: total,
            orderDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
    }

    // Show checkout confirmation modal
    showCheckoutConfirmation(user, orderDetails) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'checkout-modal';
        modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            text-align: center;
        `;

        modalContent.innerHTML = `
            <h2 style="color: #000; margin-bottom: 1rem;">Order Confirmation</h2>
            <div style="text-align: left; margin-bottom: 1.5rem;">
                <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
                <p><strong>Customer:</strong> ${user.firstname} ${user.lastname}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Order Date:</strong> ${orderDetails.orderDate}</p>
                <p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery}</p>
            </div>

            <div style="text-align: left; margin-bottom: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem;">
                <h3 style="color: #000; margin-bottom: 0.5rem;">Order Summary</h3>
                ${orderDetails.items.map(item => `
                    <div style="display: flex; justify-content: between; margin-bottom: 0.5rem;">
                        <span>${item.name}</span>
                        <span style="margin-left: auto;">$${item.price.toFixed(2)}</span>
                    </div>
                `).join('')}
                <div style="border-top: 1px solid #eee; margin-top: 0.5rem; padding-top: 0.5rem;">
                    <div style="display: flex; justify-content: between;">
                        <span>Subtotal:</span>
                        <span>$${orderDetails.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: between;">
                        <span>Shipping:</span>
                        <span>$${orderDetails.shipping.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: between;">
                        <span>Tax:</span>
                        <span>$${orderDetails.tax.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: between; font-weight: bold; margin-top: 0.5rem;">
                        <span>Total:</span>
                        <span>$${orderDetails.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
                <h4 style="color: #000; margin-bottom: 0.5rem;">Email Confirmation</h4>
                <p style="color: #666; font-size: 0.9rem;">
                    A confirmation email has been sent to <strong>${user.email}</strong> 
                    with your order details and tracking information.
                </p>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="confirm-checkout" class="btn" style="background: #27ae60;">Confirm & Send Email</button>
                <button id="cancel-checkout" class="btn btn-secondary">Cancel</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Add event listeners to modal buttons
        modalContent.querySelector('#confirm-checkout').addEventListener('click', () => {
            this.processOrder(user, orderDetails);
            modalOverlay.remove();
        });

        modalContent.querySelector('#cancel-checkout').addEventListener('click', () => {
            modalOverlay.remove();
        });

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
    }

    // Process the order and send email confirmation
    processOrder(user, orderDetails) {
        // Show processing notification
        this.showNotification('Processing your order...', 'info');

        // Simulate API call delay
        setTimeout(() => {
            // Save order to user's order history
            this.saveOrderToHistory(user, orderDetails);
            
            // Simulate email sending
            this.sendEmailConfirmation(user, orderDetails);
            
            // Clear cart
            this.cart = [];
            localStorage.setItem('cart', JSON.stringify(this.cart));
            
            // Update UI
            this.loadCartItems();
            this.updateCartSummary();
            this.updateMainCartCount();
            
            // Show success message
            this.showNotification(`Order confirmed! Confirmation email sent to ${user.email}`, 'success');
            
            // Show order completion modal
            setTimeout(() => {
                this.showOrderCompleteModal(orderDetails);
            }, 1000);
            
        }, 2000);
    }

    // Save order to user's order history
    saveOrderToHistory(user, orderDetails) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            if (!users[userIndex].orders) {
                users[userIndex].orders = [];
            }
            
            users[userIndex].orders.push({
                ...orderDetails,
                status: 'confirmed',
                trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase()
            });
            
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    // Simulate sending email confirmation
    sendEmailConfirmation(user, orderDetails) {
        const emailContent = this.generateEmailContent(user, orderDetails);
        
        // In a real application, you would send this to your backend
        // For demo purposes, we'll log it and store it locally
        console.log('Email sent to:', user.email);
        console.log('Email content:', emailContent);
        
        // Store email in localStorage for demo purposes
        const sentEmails = JSON.parse(localStorage.getItem('sentEmails')) || [];
        sentEmails.push({
            to: user.email,
            subject: `Order Confirmation - ${orderDetails.orderId}`,
            content: emailContent,
            sentAt: new Date().toISOString()
        });
        localStorage.setItem('sentEmails', JSON.stringify(sentEmails));
    }

    // Generate email content
    generateEmailContent(user, orderDetails) {
        return `
            Dear ${user.firstname} ${user.lastname},

            Thank you for your order with Alali Concepts!

            ORDER DETAILS:
            Order ID: ${orderDetails.orderId}
            Order Date: ${orderDetails.orderDate}
            Estimated Delivery: ${orderDetails.estimatedDelivery}

            ITEMS:
            ${orderDetails.items.map(item => `- ${item.name}: $${item.price.toFixed(2)}`).join('\n')}

            ORDER SUMMARY:
            Subtotal: $${orderDetails.subtotal.toFixed(2)}
            Shipping: $${orderDetails.shipping.toFixed(2)}
            Tax: $${orderDetails.tax.toFixed(2)}
            Total: $${orderDetails.total.toFixed(2)}

            Your order is being processed and you will receive another email when it ships.

            Thank you for choosing Alali Concepts!

            Best regards,
            The Alali Concepts Team
        `;
    }

    // Show order completion modal
    showOrderCompleteModal(orderDetails) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
            text-align: center;
        `;

        modalContent.innerHTML = `
            <div style="color: #27ae60; font-size: 3rem; margin-bottom: 1rem;">✓</div>
            <h2 style="color: #000; margin-bottom: 1rem;">Order Complete!</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">
                Your order <strong>${orderDetails.orderId}</strong> has been confirmed.<br>
                A confirmation email has been sent with all the details.
            </p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
                <p style="margin: 0; color: #333;">
                    <strong>Order Total: $${orderDetails.total.toFixed(2)}</strong>
                </p>
            </div>
            <button id="close-modal" class="btn" style="width: 100%;">Continue Shopping</button>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        modalContent.querySelector('#close-modal').addEventListener('click', () => {
            modalOverlay.remove();
            // Redirect to home page
            window.location.href = '../index.html';
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                window.location.href = '../index.html';
            }
        });
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existing = document.querySelector('.cart-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.textContent = message;
        
        if (type === 'error') {
            notification.style.backgroundColor = '#e74c3c';
        } else if (type === 'info') {
            notification.style.backgroundColor = '#3498db';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize cart page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the cart page
    if (document.querySelector('.cart-main')) {
        new CartPage();
    }
});

// Make cart functions available globally
window.CartPage = CartPage;