const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendOtpEmail, sendPasswordResetOtpEmail } = require('../utils/sendEmail');

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

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    // For signup, if user exists and is verified, they should login
    if (req.path.includes('signup') && existingUser && existingUser.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'account already exists try signing in' 
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'account already exists try signing in'
      });
    }
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
    const { name, username, email, password, primaryExam, examPreference, attemptYear, level } = req.body;

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
        message: 'account already exists try signing in' 
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
    existingUser.examPreference = examPreference || primaryExam;
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
        examPreference: existingUser.examPreference,
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

/**
 * Login via OTP (for existing verified users)
 */
exports.loginByOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail })
      .select('+otpHash +otpExpiry +otpAttempts');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not verified. Please verify your email first.' 
      });
    }

    // Verify OTP (reuse same logic as verifyOtp but issue token)
    if (!user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found. Please request a new OTP.' 
      });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    const isValidOtp = await bcrypt.compare(otp, user.otpHash);

    if (!isValidOtp) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${5 - user.otpAttempts} attempts remaining.` 
      });
    }

    // Success - clear OTP and issue token
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        primaryExam: user.primaryExam,
        examPreference: user.examPreference || user.primaryExam,
        level: user.level
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        primaryExam: user.primaryExam,
        examPreference: user.examPreference || user.primaryExam,
        level: user.level
      }
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
 * Forgot Password - Send OTP to user's email
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
    }

    // Generate 6-digit OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save hashed OTP and expiry to user
    user.passwordResetToken = otpHash;
    user.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP via email
    try {
      await sendPasswordResetOtpEmail(normalizedEmail, otp);
    } catch (emailError) {
      // If email fails, clear reset fields
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'A 6-digit OTP has been sent to your email.'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred. Please try again later.' 
    });
  }
};

/**
 * Verify Password Reset OTP
 */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with reset token fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordResetToken +passwordResetExpiry');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if OTP exists and is not expired
    if (!user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active reset request found. Please request a new OTP.' 
      });
    }

    if (new Date() > user.passwordResetExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, user.passwordResetToken);

    if (!isValidOtp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Reset Password - Verify OTP and update password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP and new password are required' 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with reset token fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordResetToken +passwordResetExpiry');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify OTP again (for security)
    if (!user.passwordResetToken || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Session expired. Please start the process again.'
      });
    }

    const isValidOtp = await bcrypt.compare(otp, user.passwordResetToken);
    if (!isValidOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
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
      message: error.message || 'An error occurred. Please try again later.' 
    });
  }
};
