import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sparkles,
  User,
  AtSign,
  Mail,
  Lock,
  Calendar,
  GraduationCap,
  Target,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Clock,
} from "lucide-react";

const EXAMS = [
  "CAT",
  "UPSC",
  "JEE",
  "NEET",
  "GATE",
  "SSC",
  "IBPS",
  "GMAT",
  "GRE",
  "IELTS",
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    primaryExam: "",
    attemptYear: new Date().getFullYear().toString(),
    level: "Beginner",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form

  // OTP States
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const otpInputRefs = useRef([]);

  // Password strength validation
  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password),
    };

    const allValid = Object.values(requirements).every(Boolean);

    return { requirements, allValid };
  };

  const getPasswordStrength = (password) => {
    if (!password) return { label: "", color: "", width: "0%" };

    const { requirements } = validatePassword(password);
    const validCount = Object.values(requirements).filter(Boolean).length;

    if (validCount === 4)
      return { label: "Strong", color: "bg-green-500", width: "100%" };
    if (validCount === 3)
      return { label: "Good", color: "bg-yellow-500", width: "75%" };
    if (validCount === 2)
      return { label: "Fair", color: "bg-orange-500", width: "50%" };
    return { label: "Weak", color: "bg-red-500", width: "25%" };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval;
    if (showOtpSection && timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpSection, timer, canResend]);

  // Format timer to MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow numeric input
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP input keydown
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setOtpError("");

    // Focus last filled input or next empty
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Send OTP API
  const sendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    setApiError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setShowOtpSection(true);
      setTimer(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);

      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (error) {
      setApiError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setResendLoading(true);
    setOtpError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setTimer(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (error) {
      setOtpError(error.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            otp: otpValue,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      setEmailVerified(true);
      setShowOtpSection(false);
      setStep(2); // Move to next step
    } catch (error) {
      setOtpError(error.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Primary exam validation (CRITICAL)
    if (!formData.primaryExam) {
      newErrors.primaryExam = "Primary exam is required";
    }

    // Attempt year validation
    if (!formData.attemptYear) {
      newErrors.attemptYear = "Attempt year is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call signup API
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          primaryExam: formData.primaryExam,
          attemptYear: parseInt(formData.attemptYear),
          level: formData.level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Login with returned token and user data
      login(data.user, data.token);

      // Redirect to home
      navigate("/home");
    } catch (error) {
      console.error("Signup error:", error);
      setApiError(
        error.message || "Failed to create account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.username.trim())
        newErrors.username = "Username is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // If email not verified yet, send OTP
      if (!emailVerified) {
        await sendOtp();
        return;
      }

      // If verified, proceed to step 2
      setStep(2);
    } else if (step === 2) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else {
        const { allValid } = validatePassword(formData.password);
        if (!allValid) {
          newErrors.password = "Password does not meet all requirements";
        }
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary mb-3">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Aspirant Network</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-8 bg-primary"
                  : s < step
                    ? "w-8 bg-primary/50"
                    : "w-8 bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Signup Card */}
        <div className="sidebar-card">
          <h2 className="text-xl font-bold text-foreground text-center mb-1">
            {step === 1 && "Create your account"}
            {step === 2 && "Set your password"}
            {step === 3 && "Exam preferences"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {step === 1 && "Tell us about yourself"}
            {step === 2 && "Choose a secure password"}
            {step === 3 && "Select your target exam"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error */}
            {apiError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-foreground"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border ${
                        errors.name
                          ? "border-destructive"
                          : "border-transparent"
                      } transition-all`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border ${
                        errors.username
                          ? "border-destructive"
                          : "border-transparent"
                      } transition-all`}
                      placeholder="johndoe123"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={emailVerified}
                      className={`w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border ${
                        errors.email
                          ? "border-destructive"
                          : emailVerified
                            ? "border-green-500"
                            : "border-transparent"
                      } transition-all ${emailVerified ? "opacity-75" : ""}`}
                      placeholder="you@example.com"
                    />
                    {emailVerified && (
                      <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                  {emailVerified && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Email verified successfully
                    </p>
                  )}
                </div>

                {/* OTP Section */}
                {showOtpSection && !emailVerified && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            Verify your email
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            We've sent a 6-digit code to{" "}
                            <span className="font-medium text-foreground">
                              {formData.email}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* OTP Input Boxes */}
                      <div className="flex gap-2 justify-center mb-4">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpInputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            className="w-12 h-12 text-center text-lg font-semibold bg-background rounded-lg border-2 border-border focus:border-primary focus:outline-none transition-all"
                          />
                        ))}
                      </div>

                      {/* OTP Error */}
                      {otpError && (
                        <p className="text-sm text-destructive flex items-center justify-center gap-1 mb-3">
                          <AlertCircle className="h-3 w-3" />
                          {otpError}
                        </p>
                      )}

                      {/* Timer / Resend */}
                      <div className="flex items-center justify-center gap-2 text-sm mb-4">
                        {!canResend ? (
                          <>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Resend OTP in{" "}
                              <span className="font-semibold text-foreground">
                                {formatTimer(timer)}
                              </span>
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={resendOtp}
                            disabled={resendLoading}
                            className="text-primary font-semibold hover:underline disabled:opacity-50"
                          >
                            {resendLoading ? "Sending..." : "Resend OTP"}
                          </button>
                        )}
                      </div>

                      {/* Verify Button */}
                      <Button
                        type="button"
                        onClick={verifyOtp}
                        disabled={otp.join("").length !== 6 || otpLoading}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold"
                      >
                        {otpLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                            <span>Verifying...</span>
                          </div>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Verify OTP
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {!showOtpSection && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={otpLoading}
                    className="w-full py-5 rounded-xl text-base font-semibold"
                  >
                    {otpLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="h-5 w-5 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <>
                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border ${
                        errors.password
                          ? "border-destructive"
                          : "border-transparent"
                      } transition-all`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Password strength:
                        </span>
                        <span
                          className={`font-semibold ${
                            getPasswordStrength(formData.password).label ===
                            "Strong"
                              ? "text-green-500"
                              : getPasswordStrength(formData.password).label ===
                                  "Good"
                                ? "text-yellow-500"
                                : getPasswordStrength(formData.password)
                                      .label === "Fair"
                                  ? "text-orange-500"
                                  : "text-red-500"
                          }`}
                        >
                          {getPasswordStrength(formData.password).label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}
                          style={{
                            width: getPasswordStrength(formData.password).width,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1.5">
                      {[
                        {
                          key: "minLength",
                          label: "At least 6 characters",
                          valid: validatePassword(formData.password)
                            .requirements.minLength,
                        },
                        {
                          key: "hasUpperCase",
                          label: "One uppercase letter",
                          valid: validatePassword(formData.password)
                            .requirements.hasUpperCase,
                        },
                        {
                          key: "hasNumber",
                          label: "One number",
                          valid: validatePassword(formData.password)
                            .requirements.hasNumber,
                        },
                        {
                          key: "hasSymbol",
                          label: "One special character (!@#$%^&*)",
                          valid: validatePassword(formData.password)
                            .requirements.hasSymbol,
                        },
                      ].map((req) => (
                        <div
                          key={req.key}
                          className="flex items-center gap-2 text-xs"
                        >
                          {req.valid ? (
                            <div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </div>
                          )}
                          <span
                            className={
                              req.valid
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border ${
                        errors.confirmPassword
                          ? "border-destructive"
                          : "border-transparent"
                      } transition-all`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 py-5 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      !validatePassword(formData.password).allValid ||
                      formData.password !== formData.confirmPassword
                    }
                    className="flex-1 py-5 rounded-xl font-semibold"
                  >
                    Continue
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Exam Preferences */}
            {step === 3 && (
              <>
                {/* Primary Exam */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Primary Exam
                    <span className="text-xs text-muted-foreground">
                      (Cannot change later)
                    </span>
                  </label>
                  <Select
                    value={formData.primaryExam}
                    onValueChange={(value) =>
                      handleSelectChange("primaryExam", value)
                    }
                  >
                    <SelectTrigger
                      className={`w-full py-3 bg-secondary rounded-xl border ${errors.primaryExam ? "border-destructive" : "border-transparent"}`}
                    >
                      <SelectValue placeholder="Select your exam" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {EXAMS.map((exam) => (
                        <SelectItem key={exam} value={exam}>
                          {exam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.primaryExam && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.primaryExam}
                    </p>
                  )}
                </div>

                {/* Attempt Year */}
                <div className="space-y-2">
                  <label
                    htmlFor="attemptYear"
                    className="text-sm font-medium text-foreground flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    Attempt Year
                  </label>
                  <div className="relative">
                    <input
                      id="attemptYear"
                      name="attemptYear"
                      type="number"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 5}
                      value={formData.attemptYear}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Preparation Level
                  </label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      handleSelectChange("level", value)
                    }
                  >
                    <SelectTrigger className="w-full py-3 bg-secondary rounded-xl border border-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 py-5 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 py-5 rounded-xl font-semibold"
                    disabled={loading || !formData.primaryExam}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Login Link */}
            <p className="text-center text-muted-foreground text-sm pt-2">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing up, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
