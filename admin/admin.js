// Admin Panel JavaScript - Complete MongoDB Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel loaded');
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    const loginSection = document.getElementById('admin-login');
    const dashboardSection = document.getElementById('admin-dashboard');
    
    if (isLoggedIn) {
        showDashboard();
    } else {
        showLogin();
    }
    
    // Login form handler
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple authentication
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            showDashboard();
            showNotification('Login successful!');
        } else {
            alert('Invalid credentials! Use: admin / admin123');
        }
    });
    
    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        showLogin();
        showNotification('Logged out successfully');
    });
    
    // Product form handler
    document.getElementById('add-product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const productData = {
            name: formData.get('product-name'),
            description: formData.get('product-description'),
            image_url: formData.get('product-image'),
            category: formData.get('product-category')
        ,
      price: 0
    };
        
        // Check if we're editing
        const editingId = this.getAttribute('data-editing');
        
        try {
            if (editingId) {
                await updateProduct(editingId, productData);
            } else {
                await addProduct(productData);
            }
        } catch (error) {
            console.error('Product operation error:', error);
            alert('Operation failed. Please try again.');
        }
    });
    
    // Cancel edit button
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        resetProductForm();
    });
    
    // Initial load
    if (isLoggedIn) {
        showDashboard();
    }
    
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
    
    // ========== PRODUCT MANAGEMENT ==========
    async function loadProducts() {
        try {
            const response = await fetch('/api/admin/products');
            const data = await response.json();
            
            const productsList = document.getElementById('products-list');
            
            if (!data.success || !data.products || data.products.length === 0) {
                productsList.innerHTML = '<p class="no-products">No products yet. Add your first product above.</p>';
                return;
            }
            
            productsList.innerHTML = data.products.map(product => `
                <div class="product-item">
                    <img src="${product.image_url}" alt="${product.name}" class="product-image" 
                         onerror="this.src='https://via.placeholder.com/100x80/333/FFFFFF?text=Image+Error'">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="description">${product.description || 'No description'}</p>
                        <small>Category: ${product.category}</small>
                        <small>ID: ${product._id}</small>
                    </div>
                    <div class="product-actions">
                        <button class="btn-edit" data-product-id="${product._id}">Edit</button>
                        <button class="btn-danger" data-product-id="${product._id}">Delete</button>
                    </div>
                </div>
            `).join('');
            
            attachProductEventListeners();
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('products-list').innerHTML = '<p class="no-products">Error loading products.</p>';
        }
    }
    
    function attachProductEventListeners() {
        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                editProduct(productId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                deleteProduct(productId);
            });
        });
    }
    
    async function addProduct(productData) {
        if (!productData.name || !productData.image_url) {
            alert('Please fill in all required fields (Name and Image URL).');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an error. Please check the console.');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            await loadProducts();
            document.getElementById('add-product-form').reset();
            showNotification('Product added successfully!');
        } catch (error) {
            console.error('Add product error:', error);
            alert('Failed to add product: ' + error.message);
        }
    }
    
    async function updateProduct(productId, productData) {
        if (!productData.name || !productData.image_url) {
            alert('Please fill in all required fields (Name and Image URL).');
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            await loadProducts();
            resetProductForm();
            showNotification('Product updated successfully!');
        } catch (error) {
            alert(error.message || 'Failed to update product');
        }
    }
    
    async function deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            await loadProducts();
            showNotification('Product deleted successfully!');
        } catch (error) {
            alert(error.message || 'Failed to delete product');
        }
    }
    
    async function editProduct(productId) {
        try {
            const response = await fetch(`/api/admin/products/${productId}`);
            const data = await response.json();
            
            if (data.success && data.product) {
                const product = data.product;
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-description').value = product.description || '';
                document.getElementById('product-image').value = product.image_url;
                document.getElementById('product-category').value = product.category;
                
                document.getElementById('add-product-form').setAttribute('data-editing', product._id);
                document.getElementById('submit-product-btn').textContent = 'Update Product';
                document.getElementById('cancel-edit-btn').style.display = 'inline-block';
                
                document.getElementById('add-product-form').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Failed to load product data.');
        }
    }
    
    function resetProductForm() {
        document.getElementById('add-product-form').reset();
        document.getElementById('add-product-form').removeAttribute('data-editing');
        document.getElementById('submit-product-btn').textContent = 'Add Product';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    }
    
    // ========== USER MANAGEMENT ==========
    async function loadUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            
            const usersList = document.getElementById('users-list');
            
            if (!data.success || !data.users || data.users.length === 0) {
                usersList.innerHTML = '<p class="no-users">No users yet. Users will appear here when they register on the site.</p>';
                return;
            }
            
            usersList.innerHTML = data.users.map(user => `
                <div class="user-item">
                    <div class="user-avatar">
                        ${user.firstname ? user.firstname.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div class="user-info">
                        <h3>${user.firstname} ${user.lastname || ''}</h3>
                        <p class="email">${user.email}</p>
                        <p class="phone">${user.phone || 'No phone provided'}</p>
                        <small>Joined: ${new Date(user.createdAt).toLocaleDateString()}</small>
                        <small>Role: ${user.role}</small>
                        <div class="user-status status-${user.status || 'active'}">
                            ${(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn-edit" data-user-id="${user._id}">Edit</button>
                        <button class="btn-danger" data-user-id="${user._id}">Delete</button>
                    </div>
                </div>
            `).join('');
            
            attachUserEventListeners();
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('users-list').innerHTML = '<p class="no-users">Error loading users.</p>';
        }
    }
    
    function attachUserEventListeners() {
        document.querySelectorAll('.user-actions .btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                editUser(userId);
            });
        });
        
        document.querySelectorAll('.user-actions .btn-danger').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                deleteUser(userId);
            });
        });
    }
    
    async function editUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            const data = await response.json();
            
            if (data.success && data.user) {
                const user = data.user;
                const newFirstName = prompt('Enter new first name:', user.firstname);
                if (newFirstName && newFirstName.trim() !== '') {
                    const newLastName = prompt('Enter new last name:', user.lastname || '');
                    const newEmail = prompt('Enter new email:', user.email);
                    const newPhone = prompt('Enter new phone:', user.phone || '');
                    const newStatus = prompt('Enter status (active/inactive):', user.status || 'active');
                    
                    const userData = {
                        firstname: newFirstName.trim(),
                        lastname: newLastName.trim(),
                        email: newEmail,
                        phone: newPhone,
                        status: newStatus && ['active', 'inactive'].includes(newStatus.toLowerCase()) 
                               ? newStatus.toLowerCase() 
                               : 'active'
                    };
                    
                    const updateResponse = await fetch(`/api/admin/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });
                    
                    const updateData = await updateResponse.json();
                    
                    if (updateData.success) {
                        await loadUsers();
                        showNotification('User updated successfully!');
                    } else {
                        throw new Error(updateData.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert(error.message || 'Failed to update user.');
        }
    }
    
    async function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            await loadUsers();
            showNotification('User deleted successfully!');
        } catch (error) {
            alert(error.message || 'Failed to delete user');
        }
    }
    
    // ========== ORDER MANAGEMENT ==========
    async function loadOrders() {
        try {
            const response = await fetch('/api/admin/orders');
            const data = await response.json();
            
            const ordersList = document.getElementById('orders-list');
            
            if (!data.success || !data.orders || data.orders.length === 0) {
                ordersList.innerHTML = '<p class="no-orders">No orders yet.</p>';
                return;
            }
            
            ordersList.innerHTML = data.orders.map(order => `
                <div class="order-item">
                    <div class="order-header">
                        <div class="order-id">Order #${order.order_id}</div>
                        <div class="order-status status-${order.status}">${order.status}</div>
                    </div>
                    
                    <div class="order-details">
                        <div class="order-customer">
                            <h4>${order.user_id?.firstname} ${order.user_id?.lastname}</h4>
                            <p>${order.user_id?.email}</p>
                            <small>Placed: ${new Date(order.createdAt).toLocaleDateString()}</small>
                        </div>
                        
                        <div class="order-shipping">
                            <strong>Shipping: $${order.shipping.toFixed(2)}</strong><br>
                            <strong>Tax: $${order.tax.toFixed(2)}</strong>
                        </div>
                        
                        <div class="order-totals">
                            <div class="total-amount">Total: $${order.total.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div class="order-items">
                        <h5>Items (${order.items.length}):</h5>
                        <ul class="order-item-list">
                            ${order.items.map(item => `
                                <li>
                                    <span>${item.name}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="order-actions">
                        <select class="status-select" data-order-id="${order._id}">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                        <button class="btn-edit" data-order-id="${order._id}">View Details</button>
                        <button class="btn-danger" data-order-id="${order._id}">Delete</button>
                    </div>
                </div>
            `).join('');
            
            attachOrderEventListeners();
        } catch (error) {
            console.error('Error loading orders:', error);
            document.getElementById('orders-list').innerHTML = '<p class="no-orders">Error loading orders.</p>';
        }
    }
    
    function attachOrderEventListeners() {
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                const orderId = this.getAttribute('data-order-id');
                const newStatus = this.value;
                updateOrderStatus(orderId, newStatus);
            });
        });
        
        document.querySelectorAll('.order-actions .btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = this.getAttribute('data-order-id');
                viewOrderDetails(orderId);
            });
        });
        
        document.querySelectorAll('.order-actions .btn-danger').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = this.getAttribute('data-order-id');
                deleteOrder(orderId);
            });
        });
    }
    
    async function updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Order status updated successfully!');
                loadOrders();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert(error.message || 'Failed to update order status');
            loadOrders();
        }
    }
    
    async function viewOrderDetails(orderId) {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`);
            const data = await response.json();
            
            if (data.success) {
                const order = data.order;
                const details = `
                    Order ID: ${order.order_id}
                    Customer: ${order.user_id?.firstname} ${order.user_id?.lastname}
                    Email: ${order.user_id?.email}
                    Status: ${order.status}
                    Total: $${order.total.toFixed(2)}
                    Items: ${order.items.length}
                    Created: ${new Date(order.createdAt).toLocaleString()}
                `;
                alert(details);
            }
        } catch (error) {
            alert('Failed to load order details');
        }
    }
    
    async function deleteOrder(orderId) {
        if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Order deleted successfully!');
                loadOrders();
                loadStatistics();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert(error.message || 'Failed to delete order');
        }
    }
    
    // ========== STATISTICS ==========
    async function loadStatistics() {
        try {
            const response = await fetch('/api/admin/statistics');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('total-users').textContent = data.statistics.totalUsers;
                document.getElementById('total-products').textContent = data.statistics.totalProducts;
                document.getElementById('total-orders').textContent = data.statistics.totalOrders;
                document.getElementById('total-revenue').textContent = `$${data.statistics.totalRevenue.toFixed(2)}`;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
    
    // ========== NOTIFICATION SYSTEM ==========
    function showNotification(message) {
        const existing = document.querySelector('.admin-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});