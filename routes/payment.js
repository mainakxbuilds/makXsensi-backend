const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order Endpoint
router.post('/create-order', async (req, res) => {
    try {
        const { amount, packName } = req.body;

        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                packName: packName
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID // Send key to frontend
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order'
        });
    }
});

// Verify Payment Endpoint
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            packName,
            amount,
            customerEmail,
            customerPhone,
            customerName
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Save order to database
            const newOrder = new Order({
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                packName,
                amount,
                customerEmail,
                customerPhone,
                customerName,
                status: 'completed'
            });

            await newOrder.save();

            console.log('Payment successful for:', packName, 'Amount:', amount);

            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId: razorpay_order_id
            });

        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment'
        });
    }
});

// Get all orders (admin endpoint - add authentication in production)
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
});

module.exports = router;