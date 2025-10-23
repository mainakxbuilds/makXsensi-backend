const express = require('express');
const router = express.Router();
const { checkEmailService } = require('../utils/emailService');
const mongoose = require('mongoose');

// Health endpoint: checks basic app health and dependencies
router.get('/', async (req, res) => {
    const health = {
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development',
        database: { status: 'unknown' },
        email: { status: 'unknown' }
    };

    // DB check
    try {
        const state = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
        health.database.status = state === 1 ? 'connected' : 'disconnected';
    } catch (err) {
        health.database.status = 'error';
        health.database.error = err.message;
    }

    // Email service check (non-blocking, with timeout)
    try {
        const timeoutMs = 4000;
        const checkPromise = checkEmailService();
        const result = await Promise.race([
            checkPromise,
            new Promise((_, rej) => setTimeout(() => rej(new Error('Email check timeout')), timeoutMs))
        ]);
        health.email = result;
    } catch (err) {
        health.email = { status: 'error', message: err.message };
    }

    res.json(health);
});

module.exports = router;
