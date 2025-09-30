// Admin Panel JavaScript
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
    document.getElementById('add-product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const productData = {
            name: formData.get('product-name'),
            price: formData.get('product-price'),
            description: formData.get('product-description'),
            image: formData.get('product-image'),
            category: formData.get('product-category')
        };
        
        // Check if we're editing
        const editingId = this.getAttribute('data-editing');
        
        if (editingId) {
            updateProduct(editingId, productData);
        } else {
            addProduct(productData);
        }
    });
    
    // Cancel edit button
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        resetProductForm();
    });
    
    // Initial load of products
    if (isLoggedIn) {
        loadProducts();
    }
    
    function showLogin() {
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
    }
    
    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadProducts();
    }
    
    function loadProducts() {
        const products = getProducts();
        const productsList = document.getElementById('products-list');
        
        if (products.length === 0) {
            productsList.innerHTML = '<p>No products yet. Add your first product above.</p>';
            return;
        }
        
        productsList.innerHTML = products.map(product => `
            <div class="product-item">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/100x80/333/FFFFFF?text=Image+Error'">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">$${parseFloat(product.price).toFixed(2)}</p>
                    <p class="description">${product.description || 'No description'}</p>
                    <small>Category: ${product.category}</small>
                </div>
                <div class="product-actions">
                    <button class="btn-edit" data-product-id="${product.id}">Edit</button>
                    <button class="btn-danger" data-product-id="${product.id}">Delete</button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to the new buttons
        attachProductEventListeners();
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
    
    function getProducts() {
        const products = localStorage.getItem('alaliProducts');
        return products ? JSON.parse(products) : [];
    }
    
    function saveProducts(products) {
        localStorage.setItem('alaliProducts', JSON.stringify(products));
    }
    
    function addProduct(productData) {
        // Validate required fields
        if (!productData.name || !productData.price || !productData.image) {
            alert('Please fill in all required fields (Name, Price, and Image URL).');
            return;
        }
        
        const products = getProducts();
        const newProduct = {
            id: Date.now().toString(),
            name: productData.name,
            price: parseFloat(productData.price),
            description: productData.description,
            image: productData.image,
            category: productData.category,
            featured: false
        };
        
        products.push(newProduct);
        saveProducts(products);
        loadProducts();
        document.getElementById('add-product-form').reset();
        showNotification('Product added successfully!');
    }
    
    function updateProduct(productId, productData) {
        // Validate required fields
        if (!productData.name || !productData.price || !productData.image) {
            alert('Please fill in all required fields (Name, Price, and Image URL).');
            return;
        }
        
        const products = getProducts();
        const index = products.findIndex(p => p.id === productId);
        
        if (index !== -1) {
            products[index] = {
                ...products[index],
                name: productData.name,
                price: parseFloat(productData.price),
                description: productData.description,
                image: productData.image,
                category: productData.category
            };
            
            saveProducts(products);
            loadProducts();
            resetProductForm();
            showNotification('Product updated successfully!');
        }
    }
    
    function deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        
        const products = getProducts();
        const filteredProducts = products.filter(p => p.id !== productId);
        saveProducts(filteredProducts);
        loadProducts();
        showNotification('Product deleted successfully!');
    }
    
    function editProduct(productId) {
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-category').value = product.category;
            
            document.getElementById('add-product-form').setAttribute('data-editing', product.id);
            document.getElementById('submit-product-btn').textContent = 'Update Product';
            document.getElementById('cancel-edit-btn').style.display = 'inline-block';
            
            // Scroll to form
            document.getElementById('add-product-form').scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    function resetProductForm() {
        document.getElementById('add-product-form').reset();
        document.getElementById('add-product-form').removeAttribute('data-editing');
        document.getElementById('submit-product-btn').textContent = 'Add Product';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    }
    
    function showNotification(message) {
        // Remove existing notification
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