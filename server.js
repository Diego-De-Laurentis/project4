const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images)
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

// API Routes for email functionality
app.post('/api/send-order-confirmation', async (req, res) => {
    try {
        const { user, orderDetails } = req.body;

        // Create email content
        const emailContent = `
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

        // In a real application, configure nodemailer with your email service
        // For demo purposes, we'll just log the email
        console.log('=== ORDER CONFIRMATION EMAIL ===');
        console.log('To:', user.email);
        console.log('Subject:', `Order Confirmation - ${orderDetails.orderId}`);
        console.log('Content:', emailContent);
        console.log('================================');

        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));

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

// API route to get products (optional - for future backend integration)
app.get('/api/products', (req, res) => {
    // This could connect to a database in the future
    const products = JSON.parse(require('fs').readFileSync('products.json', 'utf8') || '[]');
    res.json(products);
});

// API route to save products (for admin panel)
app.post('/api/products', (req, res) => {
    try {
        const products = req.body;
        require('fs').writeFileSync('products.json', JSON.stringify(products, null, 2));
        res.json({ success: true, message: 'Products saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save products' });
    }
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Alali Concepts server running on http://localhost:${PORT}`);
    console.log(`📧 Email simulation enabled`);
    console.log(`🛍️  E-commerce features ready`);
});