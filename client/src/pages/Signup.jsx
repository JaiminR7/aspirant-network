import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import Stepper, { Step } from "../components/ui/Stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sparkles, User, AtSign, Mail, Lock, Calendar, GraduationCap,
  Target, AlertCircle, Eye, EyeOff, ChevronRight, ShieldCheck,
  Clock, ArrowLeft, Rocket, CheckCircle2, UserPlus, Fingerprint,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "../layouts/AuthLayout";
import { authService } from "../services/authService";
import { EXAMS, LEVELS } from "../constants/appConstants";


const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // State
  const [activeStep, setActiveStep] = useState(1);
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
  
  // OTP States
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const otpInputRefs = useRef([]);

  // Password Requirements Logic
  const passwordRequirements = [
    { id: 'length', label: '6+ Characters', test: (p) => p.length >= 6 },
    { id: 'uppercase', label: 'Uppercase Letter', test: (p) => /[A-Z]/.test(p) },
    { id: 'number', label: 'Number', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'Special Character', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(p) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.test(formData.password));

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
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

  // Timer Effect
  useEffect(() => {
    let interval;
    if (activeStep === 3 && timer > 0 && !canResend) {
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

  // Logic Functions
  const sendOtp = async () => {
    setLoading(true);
    setApiError("");
    try {
      await authService.sendOtp(formData.email.trim().toLowerCase());
      
      setTimer(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setActiveStep(3); // Move to OTP step
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setApiError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      await authService.verifyOtp({
        email: formData.email.trim().toLowerCase(),
        otp: otpValue,
      });
      
      setEmailVerified(true);
      setActiveStep(4); // Move to Password step
    } catch (error) {
      setApiError(error.message);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await authService.signup({
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        primaryExam: formData.primaryExam,
        examPreference: formData.primaryExam,
        attemptYear: parseInt(formData.attemptYear),
        level: formData.level,
      });
      
      login(data.user, data.token);
      setActiveStep(6); // Success step
      setTimeout(() => navigate("/home"), 2000);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = "Full name is required";
      if (!formData.username.trim()) newErrors.username = "Username is required";
      else if (formData.username.length < 3) newErrors.username = "Username too short";
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Valid email is required";
      }
    }
    if (step === 4) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (!isPasswordValid) newErrors.password = "Please fulfill all requirements";
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
    }
    if (step === 5) {
      if (!formData.primaryExam) newErrors.primaryExam = "Please select an exam";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNext = async (nextStep) => {
    const currentStep = activeStep;
    if (!validateStep(currentStep)) return;

    if (currentStep === 2) {
      await sendOtp();
      return; // setActiveStep happens inside sendOtp on success
    }
    
    if (currentStep === 3) {
      await verifyOtp();
      return;
    }

    if (currentStep === 5) {
      await handleSignup();
      return;
    }

    setActiveStep(nextStep);
  };

  return (
    <AuthLayout
      title={<>Start your journey <br /><span className="text-primary">with the best tools.</span></>}
      subtitle="Join thousands of students who are already using Aspirant Network to ace their exams through collaborative learning."
      footer={
        <p className="text-center text-muted-foreground text-xs font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in here
          </Link>
        </p>
      }
    >
      <Stepper
        activeStep={activeStep}
        onNext={(step) => onNext(step)}
        onBack={(step) => setActiveStep(step)}
        backButtonText="Back"
        nextButtonText="Continue"
        disableStepIndicators={true}
        className="auth-stepper"
        nextButtonProps={{
          style: { display: activeStep === 6 ? 'none' : 'flex' },
          disabled: loading
        }}
      >
        {/* Step 1: Welcome */}
        <Step>
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
              <Rocket className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Join the Network</h2>
            <p className="text-muted-foreground text-sm mb-6">Ready to take your exam preparation to the next level?</p>
            
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-center gap-4 text-left group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Student Account</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Access study materials and circles</p>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-secondary/10 border border-border/30 flex items-center gap-4 text-left grayscale opacity-50">
                <div className="p-2.5 rounded-xl bg-zinc-200 text-zinc-500">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Educator</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </Step>

        {/* Step 2: Basic Info */}
        <Step>
          <div className="py-2">
            <h2 className="text-2xl font-bold tracking-tight mb-2">About You</h2>
            <p className="text-muted-foreground text-sm mb-6">Let's start with some basic information.</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-destructive font-bold ml-1">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                <div className="relative group">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe123"
                    className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
                {errors.username && <p className="text-[10px] text-destructive font-bold ml-1">{errors.username}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-destructive font-bold ml-1">{errors.email}</p>}
              </div>
            </div>
            {apiError && <p className="text-[10px] text-destructive mt-6 font-bold flex items-center gap-2 justify-center uppercase tracking-wider animate-shake"><AlertCircle className="w-3 h-3" /> {apiError}</p>}
          </div>
        </Step>

        {/* Step 3: Verification */}
        <Step>
          <div className="py-2">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Verify Email</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter the 6-digit code sent to <span className="font-bold text-foreground">{formData.email}</span></p>
            
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
                  <button onClick={sendOtp} className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline">
                    Resend Code
                  </button>
                )}
              </div>
              {apiError && <p className="text-[10px] text-destructive mt-4 font-bold flex items-center gap-2 justify-center uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {apiError}</p>}
            </div>
          </div>
        </Step>

        {/* Step 4: Account Setup */}
        <Step>
          <div className="py-2">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Secure Account</h2>
            <p className="text-muted-foreground text-sm mb-6">Create a password for your account.</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Real-time Validation UI */}
                <div className="grid grid-cols-2 gap-2 mt-4 ml-1">
                  {passwordRequirements.map((req) => {
                    const isMet = req.test(formData.password);
                    return (
                      <div key={req.id} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${isMet ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {isMet ? <Check className="w-2.5 h-2.5" strokeWidth={4} /> : <div className="w-1 h-1 bg-current rounded-full" />}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isMet ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {errors.password && <p className="text-[10px] text-destructive font-bold ml-1 mt-2">{errors.password}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-destructive font-bold ml-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        </Step>

        {/* Step 5: Preferences */}
        <Step>
          <div className="py-2">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Preferences</h2>
            <p className="text-muted-foreground text-sm mb-6">Customize your experience by selecting your exam.</p>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Exam</label>
                <Select value={formData.primaryExam} onValueChange={(val) => handleSelectChange('primaryExam', val)}>
                  <SelectTrigger className="w-full py-6 rounded-2xl border-border bg-secondary/30 focus:ring-primary focus:ring-offset-0 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Select exam" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border shadow-xl">
                    {EXAMS.map(exam => (
                      <SelectItem key={exam.value} value={exam.value} className="rounded-xl py-2.5 transition-colors cursor-pointer text-sm">
                        {exam.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.primaryExam && <p className="text-[10px] text-destructive font-bold ml-1">{errors.primaryExam}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Year</label>
                  <input
                    type="number"
                    name="attemptYear"
                    value={formData.attemptYear}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Level</label>
                  <Select value={formData.level} onValueChange={(val) => handleSelectChange('level', val)}>
                    <SelectTrigger className="w-full py-3.5 h-auto rounded-2xl border-border bg-secondary/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value} className="text-sm">{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {apiError && <p className="text-[10px] text-destructive mt-4 font-bold flex items-center gap-2 justify-center uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {apiError}</p>}
          </div>
        </Step>

        {/* Step 6: Success */}
        <Step>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome Aboard!</h2>
            <p className="text-muted-foreground text-sm">Your account has been created. <br />Redirecting to your feed...</p>
            
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        </Step>
      </Stepper>
    </AuthLayout>
  );
};

export default Signup;
