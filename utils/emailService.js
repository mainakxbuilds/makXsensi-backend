/**
 * Clean Brevo email service
 * Exports:
 * - sendPurchaseEmail(order)  -> sends purchase confirmation email via Brevo
 * - checkEmailService() -> performs a lightweight API-key check
 *
 * Requirements:
 * - Environment variable BREVO_API_KEY must be set.
 * - Optionally set EMAIL_USER to override sender.
 */

const DEFAULT_FROM = process.env.EMAIL_USER || 'noreply@makxsensi.com';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

const fetchFn = (typeof fetch !== 'undefined') ? fetch : null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPurchaseEmailTemplate(order) {
  const discordLink = process.env.DISCORD_INVITE_LINK || 'https://discord.gg/FjBGpr8gBJ';
  return `\n<!doctype html>\n<html>\n<head><meta charset="utf-8"><title>Thanks for your purchase</title></head>\n<body style="font-family:Arial,Helvetica,sans-serif;color:#333;">\n  <div style="max-width:700px;margin:0 auto;padding:20px;">\n    <h2>Thank you${order.name ? `, ${order.name}` : ''}!</h2>\n    <p>Your purchase was successful.</p>\n    <ul>\n      <li><strong>Package:</strong> ${order.packName}</li>\n      <li><strong>Amount:</strong> ₹${order.amount}</li>\n      <li><strong>Order ID:</strong> ${order.orderId}</li>\n    </ul>\n    <p>Join our Discord to get started: <a href="${discordLink}">${discordLink}</a></p>\n    <p>Best regards,<br/>MakXsensi Team</p>\n  </div>\n</body>\n</html>\n`;
}

async function sendWithRetry(payload, retries = 3, initialDelay = 800) {
  if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY not configured');
  if (!fetchFn) throw new Error('global fetch not available in this runtime');

  for (let attempt = 1; attempt <= retries; attempt++) {
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    try {
      console.log(`[email][${traceId}] Sending via Brevo (attempt ${attempt}/${retries})`);
      const res = await fetchFn('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch (e) { body = text; }

      if (!res.ok) {
        const err = new Error(`Brevo API ${res.status}: ${JSON.stringify(body)}`);
        err.status = res.status;
        err.body = body;
        throw err;
      }

      console.log(`[email][${traceId}] Sent success`, { status: res.status, body });
      return body;
    } catch (err) {
      console.error(`[email][${traceId}] Send failure:`, err && err.message ? err.message : err);
      if (attempt === retries) throw err;
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random()), 15000);
      console.log(`[email][${traceId}] Retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
}

/**
 * sendPurchaseEmail
 * data: { email, name, packName, amount, orderId }
 */
async function sendPurchaseEmail(data = {}) {
  const { email, name, packName = '', amount = '', orderId = '' } = data;
  if (!email) throw new Error('recipient email required');
  if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY not configured');

  const html = getPurchaseEmailTemplate({ name, packName, amount, orderId });

  const payload = {
    sender: { email: DEFAULT_FROM, name: 'MakXsensi' },
    to: [{ email, name: name || undefined }],
    subject: `Thank you for your purchase${packName ? ` — ${packName}` : ''}`,
    htmlContent: html
  };

  return await sendWithRetry(payload);
}

async function checkEmailService() {
  if (!BREVO_API_KEY) return { status: 'error', message: 'BREVO_API_KEY not set' };
  if (!fetchFn) return { status: 'error', message: 'fetch not available' };
  try {
    const res = await fetchFn('https://api.brevo.com/v3/account', { headers: { 'api-key': BREVO_API_KEY } });
    if (res.ok) return { status: 'healthy', message: 'Brevo API key validated' };
    const text = await res.text();
    return { status: 'error', message: `Brevo responded ${res.status}: ${text}` };
  } catch (err) {
    return { status: 'error', message: `Brevo check failed: ${err.message}` };
  }
}

module.exports = { sendPurchaseEmail, checkEmailService };