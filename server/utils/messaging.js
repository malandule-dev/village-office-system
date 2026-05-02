/**
 * Messaging utility — Twilio SMS & WhatsApp
 * Falls back gracefully if Twilio credentials are not configured.
 */

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

/**
 * Send an SMS message.
 * @returns {Promise<boolean>} true if sent, false if Twilio not configured
 */
async function sendSMS(to, body) {
  const client = getClient();
  if (!client) {
    console.log(`[SMS — not configured] To: ${to}\n${body}`);
    return false;
  }
  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to.startsWith('+') ? to : `+27${to.replace(/^0/, '')}`, // ZA number normalisation
    });
    return true;
  } catch (err) {
    console.error(`SMS send failed to ${to}:`, err.message);
    return false;
  }
}

/**
 * Send a WhatsApp message.
 * @returns {Promise<boolean>} true if sent, false if not configured
 */
async function sendWhatsApp(to, body) {
  const client = getClient();
  if (!client) {
    console.log(`[WhatsApp — not configured] To: ${to}\n${body}`);
    return false;
  }
  try {
    const normalized = to.startsWith('+') ? to : `+27${to.replace(/^0/, '')}`;
    await client.messages.create({
      body,
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
      to: `whatsapp:${normalized}`,
    });
    return true;
  } catch (err) {
    console.error(`WhatsApp send failed to ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendSMS, sendWhatsApp };
