const SibApiV3Sdk = require('@getbrevo/brevo');
let _brevoAvailable = true;
let apiInstance;

try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
} catch (err) {
    _brevoAvailable = false;
    console.error('Failed to initialize Brevo:', err.message);
}

// Email template for successful purchase
const getPurchaseEmailTemplate = (order) => {
    const discordLink = process.env.DISCORD_INVITE_LINK || 'https://discord.gg/FjBGpr8gBJ';
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .order-details { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .button { display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Thank You for Your Purchase!</h2>
                ${order.name ? `<p>Dear ${order.name},</p>` : '<p>Hello,</p>'}
            </div>
            
            <div class="order-details">
                <p><strong>Package:</strong> ${order.packName}</p>
                <p><strong>Amount Paid:</strong> ₹${order.amount}</p>
                <p><strong>Order ID:</strong> ${order.orderId}</p>
            </div>
            
            <div style="margin-top: 30px;">
                <p>To get started:</p>
                <p>1. Join our Discord community using the link below:</p>
                <p><a href="${discordLink}" class="button" style="color: #fff;">Join Discord Community</a></p>
                <p>2. Once you're in, verify your email and get instant access to your purchase!</p>
            </div>
            
            <div style="margin-top: 30px; font-size: 14px; color: #666;">
                <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
                <p>Best regards,<br>Team MakXsensi</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Brevo send with retry mechanism
const sendWithRetry = async (mailData, retries = 3, initialDelay = 1000) => {
    if (!_brevoAvailable) {
        throw new Error('Brevo module @getbrevo/brevo is not installed in this environment');
    }

    if (!apiInstance) {
        throw new Error('Brevo API is not initialized. Check if BREVO_API_KEY is set.');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Add request trace ID for debugging
            const traceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Convert to Brevo format
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = mailData.subject;
            sendSmtpEmail.htmlContent = mailData.html;
            sendSmtpEmail.sender = { 
                email: mailData.from,
                name: "MakXsensi"
            };
            sendSmtpEmail.to = [{
                email: mailData.to,
                name: mailData.name || undefined
            }];
            sendSmtpEmail.headers = {
                'X-Trace-ID': traceId,
                ...mailData.headers
            };

            console.log(`[${traceId}] Attempting to send email (attempt ${attempt}/${retries})...`);

            const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
            
            console.log(`[${traceId}] Email sent successfully:`, {
                messageId: response.messageId,
                recipient: mailData.to,
                attempt
            });
            
            return response;

        } catch (error) {
            console.error(`Email sending attempt ${attempt}/${retries} failed:`, {
                error: error.message,
                code: error.code,
                response: error.response?.body,
                timestamp: new Date().toISOString()
            });

            if (attempt === retries) {
                throw new Error(`Failed to send email after ${retries} attempts: ${error.message}`);
            }

            // Calculate delay with exponential backoff and jitter
            const delay = Math.min(
                initialDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random()),
                15000 // Cap at 15 seconds
            );

            console.log(`Waiting ${Math.round(delay)}ms before retry ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Main email sending function
async function sendPurchaseEmail(data) {
    const { email, name, packName, amount, orderId } = data;

    if (!email) {
        console.error('Email sending failed: No email address provided');
        throw new Error('Email address is required');
    }

    if (!_sendgridAvailable) {
        throw new Error('SendGrid module @sendgrid/mail is not installed in this environment');
    }

    if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
    }

    console.log('Preparing to send email:', {
        to: email,
        name,
        packName,
        amount,
        orderId
    });

    const msg = {
        to: email,
        from: {
            email: process.env.EMAIL_USER || 'noreply@makxsensi.com',
            name: 'MakXsensi Support'
        },
        subject: 'Thank You for Your Purchase! 🎉',
        html: getPurchaseEmailTemplate({
            name,
            packName,
            amount,
            orderId
        })
    };

    return await sendWithRetry(msg);
}

// Health check function
const checkEmailService = async () => {
    if (!_sendgridAvailable) {
        return { status: 'error', message: 'SendGrid module @sendgrid/mail not installed' };
    }

    if (!process.env.SENDGRID_API_KEY) {
        return { status: 'error', message: 'SendGrid API key not configured' };
    }

    try {
        // Test API key validity by making a simple API call
        const response = await fetch('https://api.sendgrid.com/v3/mail/settings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return { status: 'healthy', message: 'SendGrid API connection verified' };
        } else {
            const error = await response.text();
            return { 
                status: 'error',
                message: `SendGrid API error: ${response.status} ${error}`
            };
        }
    } catch (error) {
        return {
            status: 'error',
            message: `SendGrid connection failed: ${error.message}`
        };
    }
};

module.exports = {
    sendPurchaseEmail,
    checkEmailService
};