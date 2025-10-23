const express = require('express');
const router = express.Router();
const { checkEmailService } = require('../utils/emailService');

router.get('/smtp-test', async (req, res) => {
    try {
        const health = await checkEmailService();
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
