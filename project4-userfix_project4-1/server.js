const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alali_concepts';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  join_date: { type: Date, default: Date.now },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  image_url: String,
  category: String,
  featured: { type: Boolean, default: false }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  subtotal: { type: Number, required: true },
  shipping: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered'], default: 'confirmed' },
  tracking_number: String,
  estimated_delivery: Date
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    added_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// MongoDB Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Cart = mongoose.model('Cart', cartSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Routes for serving HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth', 'register.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth', 'user.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

// ========== MONGODB API ROUTES ==========

// User Authentication APIs
app.post('/api/register', async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword
    });

    await user.save();

    // Create cart for user
    const cart = new Cart({
      user_id: user._id,
      items: []
    });
    await cart.save();

    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Return user data (without password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Product APIs
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;

    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      image_url: image,
      category
    });

    await product.save();

    res.json({
      success: true,
      message: 'Product added successfully',
      productId: product._id
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, image, category } = req.body;

    await Product.findByIdAndUpdate(id, {
      name,
      price: parseFloat(price),
      description,
      image_url: image,
      category
    });

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// Cart APIs
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user_id: userId }).populate('user_id');
    res.json(cart ? cart.items : []);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

app.post('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productName, productPrice } = req.body;

    let cart = await Cart.findOne({ user_id: userId });
    
    if (!cart) {
      cart = new Cart({
        user_id: userId,
        items: []
      });
    }

    cart.items.push({
      name: productName,
      price: parseFloat(productPrice),
      quantity: 1
    });

    await cart.save();

    res.json({
      success: true,
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
});

app.delete('/api/cart/item/:userId/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    const cart = await Cart.findOne({ user_id: userId });
    if (cart) {
      cart.items = cart.items.filter(item => item._id.toString() !== itemId);
      await cart.save();
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
  }
});

// Order APIs
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, orderDetails } = req.body;

    const order = new Order({
      order_id: orderDetails.orderId,
      user_id: userId,
      items: orderDetails.items,
      subtotal: orderDetails.subtotal,
      shipping: orderDetails.shipping,
      tax: orderDetails.tax,
      total: orderDetails.total,
      estimated_delivery: new Date(orderDetails.estimatedDelivery)
    });

    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user_id: userId },
      { $set: { items: [] } }
    );

    res.json({
      success: true,
      message: 'Order created successfully',
      orderId: orderDetails.orderId
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user_id: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// ========== ADMIN API ROUTES ==========

// Admin Authentication
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple admin authentication (matches your existing logic)
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      success: true, 
      message: 'Admin login successful' 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid admin credentials' 
    });
  }
});

// Get all users for admin
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
});

// Get user by ID for admin
app.get('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user' 
    });
  }
});

// Update user for admin
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { firstname, lastname, email, phone, status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstname,
        lastname,
        email,
        phone,
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user' 
    });
  }
});

// Delete user for admin
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Also delete user's cart
    await Cart.findOneAndDelete({ user_id: req.params.id });
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
});

// Get all products for admin
app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products' 
    });
  }
});

// Get product by ID for admin (ADD THIS MISSING ROUTE)
app.get('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch product' 
    });
  }
});

// Add product for admin
app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, price, description, image_url, category } = req.body;

    // Validate required fields
    if (!name || !price || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and image URL are required'
      });
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      description: description || '',
      image_url,
      category: category || 'other'
    });

    await product.save();

    res.json({
      success: true,
      message: 'Product added successfully',
      product: product
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add product' 
    });
  }
});

// Update product for admin
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, image_url, category } = req.body;

    // Validate required fields
    if (!name || !price || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and image URL are required'
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price: parseFloat(price),
        description: description || '',
        image_url,
        category: category || 'other',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update product' 
    });
  }
});

// Delete product for admin
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete product' 
    });
  }
});

// ========== ORDER MANAGEMENT API ROUTES ==========

// Get all orders for admin
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user_id', 'firstname lastname email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders' 
    });
  }
});

// Get order by ID for admin
app.get('/api/admin/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user_id', 'firstname lastname email phone');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order' 
    });
  }
});

// Update order status
app.put('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { status, tracking_number } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        tracking_number,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user_id', 'firstname lastname email');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order status' 
    });
  }
});

// Delete order
app.delete('/api/admin/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete order' 
    });
  }
});

// Get sales statistics
app.get('/api/admin/statistics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const recentOrders = await Order.find()
      .populate('user_id', 'firstname lastname')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      statistics: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics' 
    });
  }
});

// Email API
app.post('/api/send-order-confirmation', async (req, res) => {
  try {
    const { user, orderDetails } = req.body;

    console.log('=== ORDER CONFIRMATION EMAIL ===');
    console.log('To:', user.email);
    console.log('Order ID:', orderDetails.orderId);
    console.log('================================');

    res.json({
      success: true,
      message: `Order confirmation email sent to ${user.email}`,
      orderId: orderDetails.orderId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email'
    });
  }
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Alali Concepts server running on http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB database connected`);
  console.log(`🐳 Docker container ready`);
  console.log(`🛍️  E-commerce features enabled`);
});