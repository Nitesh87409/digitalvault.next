export async function sendSMS({ to, message }) {
  const provider = process.env.SMS_PROVIDER || 'mock';

  // In a real application, you would implement provider-specific logic here.
  // Example: MSG91, Twilio, Firebase, etc.
  
  if (provider === 'mock') {
    console.log(`\n[MOCK SMS] to: ${to}`);
    console.log(`[MOCK SMS] Message: ${message}\n`);
    return { success: true, message: 'Mock SMS sent' };
  }

  // Placeholder for real provider integrations
  // if (provider === 'msg91') { ... }
  // if (provider === 'twilio') { ... }

  console.warn(`SMS Provider '${provider}' not implemented. Falling back to mock.`);
  console.log(`\n[MOCK SMS] to: ${to}`);
  console.log(`[MOCK SMS] Message: ${message}\n`);
  return { success: true, message: 'Mock SMS sent (fallback)' };
}
