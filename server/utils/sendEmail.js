const nodemailer = require('nodemailer');

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (email, otp) => {
  try {
    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: `"Aspirant Network" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - OTP',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
              }
              .otp {
                font-size: 32px;
                font-weight: bold;
                color: #4CAF50;
                text-align: center;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 5px;
                letter-spacing: 5px;
                margin: 20px 0;
              }
              .warning {
                color: #ff5722;
                font-size: 14px;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #777;
              }
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

    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

/**
 * Send password reset email with reset link
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Unhashed reset token for URL
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Aspirant Network" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
              }
              .warning {
                color: #ff5722;
                font-size: 14px;
                margin-top: 20px;
                padding: 15px;
                background-color: #fff3e0;
                border-left: 4px solid #ff5722;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #777;
              }
              .link {
                color: #4CAF50;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password for your Aspirant Network account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetUrl}" class="button">Reset Password</a>
                <p>Or copy and paste this link in your browser:</p>
                <p class="link">${resetUrl}</p>
                <div class="warning">
                  <strong>⚠️ Important:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link is valid for <strong>15 minutes</strong> only</li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
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
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };
