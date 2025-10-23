const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        required: true
    },
    packName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    customerEmail: {
        type: String,
        required: false
    },
    customerPhone: {
        type: String,
        required: false
    },
    customerName: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);