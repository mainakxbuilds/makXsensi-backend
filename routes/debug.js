const express = require('express');
const router = express.Router();
const { sendPurchaseEmail } = require('../utils/emailService');

// POST /api/debug/send-test-email
// Body: { email?: string, name?: string }
// If DEBUG_SECRET is configured in env, the request must include header 'x-debug-secret' with the same value.
router.post('/send-test-email', async (req, res) => {
    try {
        const debugSecret = process.env.DEBUG_SECRET;
        if (debugSecret) {
            const provided = req.headers['x-debug-secret'];
            if (!provided || provided !== debugSecret) {
                return res.status(401).json({ success: false, message: 'Missing or invalid debug secret' });
            }
        }

        const to = req.body.email || process.env.DEBUG_EMAIL || req.body.to;
        const name = req.body.name || 'Test User';

        if (!to) return res.status(400).json({ success: false, message: 'Missing target email (body.email) or set DEBUG_EMAIL env var' });

        await sendPurchaseEmail({
            email: to,
            name,
            packName: 'Debug Pack',
            amount: 1,
            orderId: `DEBUG-${Date.now()}`
        });

        return res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (err) {
        console.error('Debug email send failed:', err && err.message ? err.message : err);
        return res.status(500).json({ success: false, message: 'Failed to send test email', error: err.message || err });
    }
});

module.exports = router;
