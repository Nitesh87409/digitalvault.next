import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation({
  name,
  email,
  download_token,
  amount,
  product_name,
}) {
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
      DigitalVault<br>
      support@digitalvault.in
    </p>

  </div>

</body>
</html>
`;

  try {
    await resend.emails.send({
      from: 'DigitalVault <onboarding@resend.dev>',
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
    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;color:#111;background:#ffffff;padding:24px;line-height:1.6;">
    <div style="max-width:520px;margin:0 auto;">
    <h2 style="margin-bottom:18px;font-size:22px;color:#111;">Your Login Code</h2>
    <p>Hi there,</p>
    <p>Your DigitalVault login code is:</p>
    <h1 style="font-size:36px;letter-spacing:4px;color:#111;margin:24px 0;">${otp}</h1>
    <p>This code expires in 5 minutes.</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">
    <p style="font-size:12px;color:#666;">DigitalVault<br>support@digitalvault.in</p>
    </div>
    </body>
    </html>
    `;
    try {
    await resend.emails.send({
      from: 'DigitalVault <onboarding@resend.dev>',
      to: email,
      subject: 'Your Login Code',
      html,
    });
    console.log('OTP Email sent successfully');
    } catch (e) {
    console.error('OTP Email error:', e.message);
    }
    }