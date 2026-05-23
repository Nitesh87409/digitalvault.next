import { Resend } from 'resend';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation({
  name,
  email,
  download_token,
  amount,
  product_name,
}) {
  await connectDB();
  const settings = await Setting.findOne().lean();
  const supportEmail = settings?.support_email || 'support@digitalvault.in';
  const appName = settings?.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
  const appLogo = settings?.app_logo || '';

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const downloadUrl =
    `${siteUrl}/download?token=${download_token}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="
  font-family:Arial,sans-serif;
  color:#111;
  background:#ffffff;
  padding:24px;
  line-height:1.6;
">

  <div style="
    max-width:520px;
    margin:0 auto;
  ">

    <h2 style="
      margin-bottom:18px;
      font-size:22px;
      color:#111;
    ">
      Order Receipt
    </h2>

    <p>
      Hi ${name},
    </p>

    <p>
      Your order has been confirmed successfully.
    </p>

    <hr style="
      border:none;
      border-top:1px solid #e5e5e5;
      margin:20px 0;
    ">

    <p>
      <strong>Product:</strong><br>
      ${product_name}
    </p>

    <p>
      <strong>Amount Paid:</strong><br>
      ₹${amount?.toLocaleString()}
    </p>

    <p>
      <strong>Download Link:</strong><br>
      <a href="${downloadUrl}">
        Download Files
      </a>
    </p>

    <hr style="
      border:none;
      border-top:1px solid #e5e5e5;
      margin:20px 0;
    ">

    <p style="
      font-size:12px;
      color:#666;
    ">
      ${appLogo ? `<img src="${appLogo}" alt="${appName}" style="max-height: 30px; margin-bottom: 8px;"><br>` : `<strong>${appName}</strong><br>`}
      ${supportEmail}
    </p>

  </div>

</body>
</html>
`;

  try {
    await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: email,
      subject: 'Order Receipt',
      html,
    });

    console.log('Email sent successfully');
    } catch (e) {
    console.error('Email error:', e.message);
    }
    }

    export async function sendEmailOTP({ email, otp }) {
    await connectDB();
    const settings = await Setting.findOne().lean();
    const supportEmail = settings?.support_email || 'support@digitalvault.in';
    const appName = settings?.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
    const appLogo = settings?.app_logo || '';

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;color:#111;background:#ffffff;padding:24px;line-height:1.6;">
    <div style="max-width:520px;margin:0 auto;">
    <h2 style="margin-bottom:18px;font-size:22px;color:#111;">Your Login Code</h2>
    <p>Hi there,</p>
    <p>Your ${appName} login code is:</p>
    <h1 style="font-size:36px;letter-spacing:4px;color:#111;margin:24px 0;">${otp}</h1>
    <p>This code expires in 5 minutes.</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">
    <p style="font-size:12px;color:#666;">${appLogo ? `<img src="${appLogo}" alt="${appName}" style="max-height: 30px; margin-bottom: 8px;"><br>` : `<strong>${appName}</strong><br>`}${supportEmail}</p>
    </div>
    </body>
    </html>
    `;
    try {
    await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: email,
      subject: 'Your Login Code',
      html,
    });
    console.log('OTP Email sent successfully');
    } catch (e) {
    console.error('OTP Email error:', e.message);
    }
    }

export async function sendResetEmailOTP({ email, otp }) {
  await connectDB();
  const settings = await Setting.findOne().lean();
  const supportEmail = settings?.support_email || 'support@digitalvault.in';
  const appName = settings?.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
  const appLogo = settings?.app_logo || '';

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;color:#111;background:#ffffff;padding:24px;line-height:1.6;">
    <div style="max-width:520px;margin:0 auto;">
    <h2 style="margin-bottom:18px;font-size:22px;color:#111;">Password Reset Code</h2>
    <p>Hi there,</p>
    <p>Your ${appName} password reset code is:</p>
    <h1 style="font-size:36px;letter-spacing:4px;color:#111;margin:24px 0;">${otp}</h1>
    <p>This code expires in 5 minutes.</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">
    <p style="font-size:12px;color:#666;">${appLogo ? `<img src="${appLogo}" alt="${appName}" style="max-height: 30px; margin-bottom: 8px;"><br>` : `<strong>${appName}</strong><br>`}${supportEmail}</p>
    </div>
    </body>
    </html>
    `;
  try {
    await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: email,
      subject: 'Password Reset Code',
      html,
    });
    console.log('Reset OTP Email sent successfully');
  } catch (e) {
    console.error('Reset OTP Email error:', e.message);
  }
}

export async function sendBundleConfirmation({
  name,
  email,
  amount,
  product_name,
  payment_id,
  validity_text,
}) {
  await connectDB();
  const settings = await Setting.findOne().lean();
  const supportEmail = settings?.support_email || 'support@digitalvault.in';
  const appName = settings?.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
  const appLogo = settings?.app_logo || '';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
<!DOCTYPE html>
<html>
<body style="
  font-family:Arial,sans-serif;
  color:#111;
  background:#ffffff;
  padding:24px;
  line-height:1.6;
">
  <div style="max-width:520px;margin:0 auto;">
    <h2 style="margin-bottom:18px;font-size:22px;color:#111;">
      🎉 Bundle Purchase Confirmed!
    </h2>
    <p>Hi ${name},</p>
    <p>Your <strong>${product_name || 'Complete Bundle'}</strong> purchase was successful. You now have access to all included products!</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">

    <p><strong>Amount Paid:</strong><br>₹${amount?.toLocaleString()}</p>
    <p><strong>Payment ID:</strong><br>${payment_id}</p>
    <p><strong>Access:</strong><br>${validity_text || 'Lifetime Access'}</p>

    <p>
      <a href="${siteUrl}/my-downloads" style="
        display:inline-block;
        background:#f5c842;
        color:#0a0a0f;
        padding:12px 24px;
        border-radius:8px;
        text-decoration:none;
        font-weight:bold;
        margin:16px 0;
      ">
        Access Your Products →
      </a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">

    <p style="font-size:12px;color:#666;">
      ${appLogo ? `<img src="${appLogo}" alt="${appName}" style="max-height: 30px; margin-bottom: 8px;"><br>` : `<strong>${appName}</strong><br>`}
      ${supportEmail}
    </p>
  </div>
</body>
</html>
`;

  try {
    await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: email,
      subject: `🎉 Bundle Purchase Confirmed - ${appName}`,
      html,
    });
    console.log('Bundle confirmation email sent successfully');
  } catch (e) {
    console.error('Bundle confirmation email error:', e.message);
  }
}

export async function sendAdmin2faOTP({ email, otp }) {
  await connectDB();
  const settings = await Setting.findOne().lean();
  const supportEmail = settings?.support_email || 'support@digitalvault.in';
  const appName = settings?.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
  const appLogo = settings?.app_logo || '';

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;color:#111;background:#ffffff;padding:24px;line-height:1.6;">
    <div style="max-width:520px;margin:0 auto;">
    <h2 style="margin-bottom:18px;font-size:22px;color:#111;">🔐 Admin Verification Code</h2>
    <p>A login attempt was made on the <strong>${appName}</strong> admin panel.</p>
    <p>Your verification code is:</p>
    <h1 style="font-size:36px;letter-spacing:4px;color:#111;margin:24px 0;">${otp}</h1>
    <p>This code expires in <strong>5 minutes</strong>.</p>
    <p style="color:#666;font-size:13px;">If you did not attempt to login, please secure your account immediately.</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">
    <p style="font-size:12px;color:#666;">${appLogo ? `<img src="${appLogo}" alt="${appName}" style="max-height: 30px; margin-bottom: 8px;"><br>` : `<strong>${appName}</strong><br>`}${supportEmail}</p>
    </div>
    </body>
    </html>
    `;
  try {
    await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: email,
      subject: `🔐 Admin Verification Code - ${appName}`,
      html,
    });
    console.log('Admin 2FA OTP email sent successfully');
  } catch (e) {
    console.error('Admin 2FA OTP email error:', e.message);
  }
}