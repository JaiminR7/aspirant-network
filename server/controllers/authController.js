const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

/**
 * Generate a secure 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to user's email for verification
 */
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered and verified' 
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    if (existingUser && !existingUser.isVerified) {
      // Update existing unverified user with new OTP
      existingUser.otpHash = otpHash;
      existingUser.otpExpiry = otpExpiry;
      existingUser.otpAttempts = 0;
      await existingUser.save();
    } else {
      // Create new user with OTP
      await User.create({
        email: normalizedEmail,
        otpHash,
        otpExpiry,
        otpAttempts: 0,
        isVerified: false,
        // Temporary values - will be updated during signup
        name: 'Temp',
        username: `temp_${Date.now()}`,
        passwordHash: 'Temp@123',
        primaryExam: 'JEE',
        attemptYear: new Date().getFullYear(),
        level: 'Beginner'
      });
    }

    // Send OTP via email
    await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Verify OTP entered by user
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with OTP fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+otpHash +otpExpiry +otpAttempts');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Please request OTP first.' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already verified' 
      });
    }

    // Check if OTP exists
    if (!user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found. Please request a new OTP.' 
      });
    }

    // Check if OTP expired
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Check attempt limit
    if (user.otpAttempts >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.' 
      });
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, user.otpHash);

    if (!isValidOtp) {
      // Increment attempt count
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${5 - user.otpAttempts} attempts remaining.` 
      });
    }

    // OTP verified successfully - clear OTP fields and mark as verified
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, primaryExam, attemptYear, level } = req.body;

    if (!name || !username || !email || !password || !primaryExam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields missing' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not found. Please verify your email first.' 
      });
    }

    // Check if email is verified
    if (!existingUser.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not verified. Please verify your email with OTP first.' 
      });
    }

    // Check if user has already completed signup
    if (existingUser.name !== 'Temp') {
      return res.status(400).json({ 
        success: false, 
        message: 'User already registered. Please login.' 
      });
    }

    // Check if username is already taken
    const usernameExists = await User.findOne({ username: normalizedUsername });
    if (usernameExists && usernameExists.username !== existingUser.username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already taken' 
      });
    }

    // Update user with complete profile
    existingUser.name = name.trim();
    existingUser.username = normalizedUsername;
    existingUser.passwordHash = password;
    existingUser.primaryExam = primaryExam;
    existingUser.attemptYear = attemptYear || new Date().getFullYear();
    existingUser.level = level || 'Beginner';
    
    await existingUser.save();

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      token: generateToken(existingUser._id),
      user: { 
        _id: existingUser._id, 
        name: existingUser.name, 
        username: existingUser.username, 
        email: existingUser.email, 
        primaryExam: existingUser.primaryExam, 
        attemptYear: existingUser.attemptYear, 
        level: existingUser.level 
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, username: user.username, email: user.email, primaryExam: user.primaryExam, level: user.level }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
};

/**
 * Forgot Password - Send reset link to email
 * Generates secure token, hashes it, and sends reset email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response to prevent email enumeration
    const genericResponse = {
      success: true,
      message: 'If this email exists, a password reset link has been sent.'
    };

    // If user doesn't exist, return generic success (security best practice)
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate secure random token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token and expiry to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send email with unhashed token
    try {
      await sendPasswordResetEmail(normalizedEmail, resetToken);
    } catch (emailError) {
      // If email fails, clear reset fields
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    res.status(200).json(genericResponse);

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
};

/**
 * Reset Password - Verify token and update password
 * Validates hashed token, checks expiry, and updates password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(newPassword);

    if (!hasUpperCase || !hasNumber || !hasSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one number, and one special character'
      });
    }

    // Hash the incoming token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching hashed token and non-expired reset
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpiry');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = newPassword;
    
    // Clear reset fields
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
};
