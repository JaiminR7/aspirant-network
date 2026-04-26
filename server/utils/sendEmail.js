const nodemailer = require('nodemailer');

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Aspirant Network" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - OTP',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
              .content { background-color: white; padding: 30px; border-radius: 8px; }
              .otp { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 5px; letter-spacing: 5px; margin: 20px 0; }
              .warning { color: #ff5722; font-size: 14px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <h2>Verify Your Email</h2>
                <p>Thank you for registering with Aspirant Network!</p>
                <p>Your One-Time Password (OTP) for email verification is:</p>
                <div class="otp">${otp}</div>
                <p class="warning">⚠️ This OTP is valid for <strong>2 minutes</strong> only.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <div class="footer">
                  <p>&copy; 2026 Aspirant Network. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

/**
 * Send password reset OTP email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<void>}
 */
const sendPasswordResetOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Aspirant Network" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - Aspirant Network',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
              .content { background-color: white; padding: 30px; border-radius: 8px; }
              .otp { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 5px; letter-spacing: 5px; margin: 20px 0; }
              .warning { color: #ff5722; font-size: 14px; margin-top: 20px; padding: 15px; background-color: #fff3e0; border-left: 4px solid #ff5722; border-radius: 4px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #4CAF50; margin-bottom: 5px;">Aspirant Network</h2>
                  <p style="color: #666; margin-top: 0;">Your Learning Community</p>
                </div>
                <h2>Password Reset OTP</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your Aspirant Network account. Use the code below to proceed:</p>
                <div class="otp">${otp}</div>
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This OTP is valid for <strong>10 minutes</strong> only.</li>
                    <li>If you did not request a password reset, please ignore this email.</li>
                    <li>Never share this code with anyone.</li>
                  </ul>
                </div>
                <div class="footer">
                  <p>&copy; 2026 Aspirant Network. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Failed to send password reset OTP: ${error.message}`);
  }
};

module.exports = { sendOtpEmail, sendPasswordResetOtpEmail };
