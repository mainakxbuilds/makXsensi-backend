const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
<<<<<<< HEAD:backend/server.js
=======
const allowedOrigins = [
    process.env.FRONTEND_URL,          // Production URL
    'https://maksensi.vercel.app',     // Vercel domain
    'http://127.0.0.1:5500',          // Local development
    'http://localhost:5500',
    'http://localhost:3000'
];

>>>>>>> 0b62b9d (chore: update CORS and env config for Vercel deployment):server.js
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const paymentRoutes = require('./routes/payment');

// Use routes
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'MakXsensi API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'MakXsensi Backend API',
        endpoints: {
            health: '/health',
            createOrder: 'POST /api/payment/create-order',
            verifyPayment: 'POST /api/payment/verify'
        }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});