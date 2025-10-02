// Initialize MongoDB with collections and demo data
db = db.getSiblingDB('alali_concepts');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('carts');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.products.createIndex({ "name": 1 });
db.orders.createIndex({ "order_id": 1 }, { unique: true });
db.orders.createIndex({ "user_id": 1 });

// Insert demo admin user
db.users.insertOne({
  firstname: "Admin",
  lastname: "User",
  email: "admin@alali.com",
  password: "$2a$10$8K1p/a0dRTlB0s7B6J2V.OVcK9V9Q2R2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2", // admin123
  role: "admin",
  join_date: new Date(),
  created_at: new Date(),
  updated_at: new Date()
});

// Insert demo products
db.products.insertMany([
  {
    name: "Premium Watch",
    price: 299.99,
    description: "Luxury wristwatch with premium materials",
    image_url: "https://via.placeholder.com/300x200/333/FFFFFF?text=PREMIUM+WATCH",
    category: "watches",
    featured: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Designer Handbag",
    price: 399.99,
    description: "Elegant designer handbag",
    image_url: "https://via.placeholder.com/300x200/555/FFFFFF?text=DESIGNER+BAG",
    category: "handbags",
    featured: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Smart Device",
    price: 199.99,
    description: "Latest smart technology device",
    image_url: "https://via.placeholder.com/300x200/777/FFFFFF?text=SMART+DEVICE",
    category: "electronics",
    featured: false,
    created_at: new Date(),
    updated_at: new Date()
  }
]);

print("✅ MongoDB initialized successfully!");