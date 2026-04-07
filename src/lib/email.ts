import nodemailer from 'nodemailer';

/**
 * Utility to send Email OTPs.
 * Uses Nodemailer if credentials are provided in .env
 * Falls back to Console logging if no credentials are found (free/open-source mode).
 */
export async function sendEmailOTP(email: string, otpCode: string): Promise<boolean> {
  const isEmailConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isEmailConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Umpires Call" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Login Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Umpire's Call</h1>
            </div>
            <div style="padding: 30px; background-color: #fafafa;">
              <h2 style="color: #333333; margin-top: 0;">Verification Code</h2>
              <p style="color: #555555; line-height: 1.6;">Hello,</p>
              <p style="color: #555555; line-height: 1.6;">Please use the following 6-digit OTP code to verify your login. This code will expire in 5 minutes.</p>
              <div style="background-color: #ffffff; border: 2px dashed #cbd5e1; border-radius: 6px; padding: 15px; text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 4px;">${otpCode}</span>
              </div>
              <p style="color: #888888; font-size: 13px; line-height: 1.5; margin-bottom: 0;">If you did not request this email, please ignore it.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('[EMAIL] OTP sent successfully to', email);
      return true;
    } catch (e) {
      console.error('[EMAIL error] Nodemailer fetch error:', e);
      return false; // Return false so the frontend knows it failed
    }
  }

  // FALLBACK TO MOCK (If no API keys are present)
  console.log('\n=============================================');
  console.log(`[EMAIL MOCK] Sending to: ${email}`);
  console.log(`[EMAIL MOCK] Subject: Your Login Verification Code`);
  console.log(`[EMAIL MOCK] Code: ${otpCode}`);
  console.log('=============================================\n');
  console.warn('NOTE: No SMTP_ credentials found in .env. Falling back to console logging.');
  
  return true;
}
