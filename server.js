const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB()
    .then(() => console.log('Database connection established'))
    .catch(err => {
        console.error('Failed to establish DB connection at startup:', err.message);
        // Let the process die so Render can attempt a restart or you can investigate
        process.exit(1);
    });

// CORS configuration: allow the configured frontend or fallback to localhost during dev
const allowedOrigins = new Set([
    process.env.FRONTEND_URL,
    'https://makxsensi.vercel.app',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000'
].filter(Boolean));

const corsOptions = {
    origin: (origin, callback) => {
        // allow requests with no origin (mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        console.warn('Blocked CORS request from', origin);
        return callback(new Error('Not allowed by CORS'), false);
    },
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