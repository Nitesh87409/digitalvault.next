import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOrderConfirmation({ name, email, download_token, amount }) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const downloadUrl = `${siteUrl}/download?token=${download_token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;background:#0a0a0f;color:#e8e8f0;padding:40px 20px;">
      <div style="max-width:560px;margin:0 auto;background:#12121a;border-radius:16px;padding:40px;border:1px solid rgba(245,200,66,0.2)">
        <h1 style="color:#f5c842;margin-bottom:8px;">DigitalVault</h1>
        <h2 style="color:#fff;">🎉 Payment Successful!</h2>
        <p style="color:#9999b3;">Hi ${name}, thank you for your purchase!</p>
        <div style="background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.2);border-radius:12px;padding:20px;margin:24px 0;text-align:center">
          <p style="color:#f5c842;font-size:28px;font-weight:bold;margin:0;">₹${amount?.toLocaleString()}</p>
          <p style="color:#9999b3;font-size:13px;">Order Confirmed</p>
        </div>
        <div style="text-align:center;margin:30px 0">
          <a href="${downloadUrl}" style="background:linear-gradient(135deg,#f5c842,#e0a800);color:#0a0a0f;padding:14px 36px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;">
            ⬇️ Download Now
          </a>
        </div>
        <p style="color:#4b4b6b;font-size:12px;text-align:center;">Need help? Email us at support@digitalvault.in</p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🎉 Your DigitalVault Purchase is Confirmed!',
      html,
    });
  } catch (e) {
    console.error('Email error:', e.message);
  }
}
