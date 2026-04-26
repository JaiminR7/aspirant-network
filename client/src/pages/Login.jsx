import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import Stepper, { Step } from "../components/ui/Stepper";
import { 
  Sparkles, Mail, Lock, AlertCircle, Eye, EyeOff, 
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import AuthLayout from "../layouts/AuthLayout";
import { authService } from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // State
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };


  const handleSubmitPassword = async () => {
    if (!formData.password) {
      setErrors({ password: "Password is required" });
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const data = await authService.login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      
      login(data.user, data.token);
      setActiveStep(3);
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const onNext = async () => {
    if (activeStep === 1) {
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setErrors({ email: "Valid email is required" });
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      await handleSubmitPassword();
    }
  };

  return (
    <AuthLayout
      title={<>Welcome back to your <br /><span className="text-primary">learning journey.</span></>}
      subtitle="Sign in to access your dashboard, connect with your circle, and continue growing with your community."
      footer={
        <p className="text-center text-muted-foreground text-xs font-medium">
          New to Aspirant Network?{" "}
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <Stepper
        activeStep={activeStep}
        onNext={onNext}
        onBack={(step) => setActiveStep(step)}
        backButtonText="Back"
        nextButtonText="Continue"
        disableStepIndicators={true}
        className="auth-stepper"
        nextButtonProps={{
          style: { display: activeStep >= 3 ? 'none' : 'flex' },
          disabled: loading
        }}
      >
        {/* Step 1: Welcome & Email */}
        <Step>
          <div className="py-2">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter your email to continue your journey.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-destructive font-bold flex items-center gap-1.5 ml-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
              </div>
            </div>
          </div>
        </Step>

        {/* Step 2: Password */}
        <Step>
          <div className="py-2">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Password</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter your account password.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
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
                {errors.password && <p className="text-[10px] text-destructive font-bold ml-1">{errors.password}</p>}
              </div>
              
              <div className="flex justify-end px-1">
                <Link to="/forgot-password" size="sm" className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline">
                  Forgot?
                </Link>
              </div>
            </div>
            {apiError && <p className="text-[10px] text-destructive mt-4 font-bold flex items-center gap-2 justify-center uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {apiError}</p>}
          </div>
        </Step>

        {/* Step 3: Success & Authenticating */}
        <Step>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <ShieldCheck className="w-8 h-8 text-green-500" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Success!</h2>
            <p className="text-muted-foreground text-sm">Authenticating your session... <br />Redirecting to dashboard.</p>
            
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        </Step>
      </Stepper>
    </AuthLayout>
  );
};

export default Login;
