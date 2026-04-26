import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  KeyRound,
  ChevronLeft,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "../layouts/AuthLayout";
import Stepper, { Step } from "../components/ui/Stepper";
import { authService } from "../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef([]);

  // Password Requirements Logic
  const passwordRequirements = [
    { id: 'length', label: '6+ Characters', test: (p) => p.length >= 6 },
    { id: 'uppercase', label: 'Uppercase Letter', test: (p) => /[A-Z]/.test(p) },
    { id: 'number', label: 'Number', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'Special Character', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(p) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.test(newPassword));

  // Timer Effect for OTP
  useEffect(() => {
    let interval;
    if (activeStep === 2 && timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeStep, timer, canResend]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Valid email is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      
      setTimer(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setActiveStep(2);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authService.verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: otpValue,
      });
      
      setActiveStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      setError("Please fulfill all password requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.join(""),
        newPassword,
      });
      
      setActiveStep(4);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onNext = async () => {
    if (activeStep === 1) {
      await handleSendOtp();
    } else if (activeStep === 2) {
      await handleVerifyOtp();
    } else if (activeStep === 3) {
      await handleResetPassword();
    }
  };

  const onBack = (step) => {
    setActiveStep(step);
    setError("");
  };

  return (
    <AuthLayout
      title={<>Secure your <br /><span className="text-primary">account access.</span></>}
      subtitle="Follow the steps to reset your password and get back to your learning journey."
      footer={
        activeStep !== 4 && (
          <p className="text-center text-muted-foreground text-xs font-medium">
            Remembered your password?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        )
      }
    >
      <Stepper
        activeStep={activeStep}
        onNext={onNext}
        onBack={onBack}
        backButtonText="Go Back"
        nextButtonText={
          activeStep === 1 ? "Send OTP" : 
          activeStep === 2 ? "Verify OTP" : 
          activeStep === 3 ? "Reset Password" : 
          "Continue"
        }
        disableStepIndicators={true}
        className="auth-stepper"
        nextButtonProps={{
          style: { display: activeStep === 4 ? 'none' : 'flex' },
          disabled: loading
        }}
      >
        {/* Step 1: Email */}
        <Step>
          <div className="py-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Forgot Password?</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-8">
              Enter your email address to receive a 6-digit verification code.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-[10px] text-destructive mt-4 font-bold flex items-center gap-2 justify-center uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {error}</p>}
            
            <div className="mt-8 pt-4 border-t border-border/50">
              <Link to="/login" className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3" />
                Back to Login
              </Link>
            </div>
          </div>
        </Step>

        {/* Step 2: OTP Verification */}
        <Step>
          <div className="py-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Verify Identity</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Enter the 6-digit code sent to <br /><span className="font-bold text-foreground">{email}</span></p>
            
            <div className="space-y-6">
              <div className="flex gap-2 justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-[14%] aspect-square text-center text-xl font-bold bg-secondary/30 border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="text-center">
                {!canResend ? (
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                    <Clock className="w-3 h-3" />
                    Resend in {formatTimer(timer)}
                  </p>
                ) : (
                  <button onClick={handleSendOtp} className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline">
                    Resend Code
                  </button>
                )}
              </div>
            </div>
            {error && <p className="text-[10px] text-destructive mt-4 font-bold flex items-center gap-2 justify-center uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {error}</p>}
            
            <div className="mt-8 pt-4 border-t border-border/50">
              <button onClick={() => onBack(1)} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                <ChevronLeft className="w-3 h-3" />
                Change Email
              </button>
            </div>
          </div>
        </Step>

        {/* Step 3: New Password */}
        <Step>
          <div className="py-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">New Password</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Create a strong, unique password for your account.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Real-time Validation UI */}
                <div className="grid grid-cols-2 gap-2 mt-4 ml-1">
                  {passwordRequirements.map((req) => {
                    const isMet = req.test(newPassword);
                    return (
                      <div key={req.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isMet ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {isMet ? <Check className="w-3 h-3" strokeWidth={4} /> : <div className="w-1 h-1 bg-current rounded-full" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isMet ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Confirm Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-[10px] text-destructive mt-6 font-bold flex items-center gap-2 justify-center uppercase tracking-wider animate-shake"><AlertCircle className="w-3 h-3" /> {error}</p>}
          </div>
        </Step>

        {/* Step 4: Success */}
        <Step>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Password Reset!</h2>
            <p className="text-muted-foreground text-sm">Your password has been successfully updated. <br />Redirecting to login...</p>
            
            <div className="mt-8">
              <Link to="/login">
                <Button className="w-full rounded-2xl py-6">Back to Login</Button>
              </Link>
            </div>
          </div>
        </Step>
      </Stepper>
    </AuthLayout>
  );
};

export default ForgotPassword;
