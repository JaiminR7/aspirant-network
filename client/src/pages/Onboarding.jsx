  import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { 
  Rocket, User, AtSign, GraduationCap, 
  Calendar, BarChart, FileText, CheckCircle2,
  AlertCircle, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { EXAMS, LEVELS, STAGES } from "../constants/appConstants";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const { login, user: mongoUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    primaryExam: "",
    stage: "",
    level: "",
    bio: ""
  });

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setFormData(prev => ({
        ...prev,
        name: clerkUser.fullName || "",
        username: clerkUser.username || clerkUser.emailAddresses[0].emailAddress.split('@')[0].replace(/[^a-z0-9_]/g, '_')
      }));
    }
  }, [isLoaded, clerkUser]);

  // If already onboarded, redirect to home
  useEffect(() => {
    if (mongoUser && mongoUser.onboarded) {
      navigate("/home");
    }
  }, [mongoUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.username || !formData.primaryExam || !formData.stage || !formData.level) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      
      // 1. Sync user first to ensure they exist in DB
      await authService.syncClerkUser({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: formData.name,
        profilePicture: clerkUser.imageUrl
      });

      // 2. Complete onboarding
      const response = await authService.onboardUser({
        clerkId: clerkUser.id,
        ...formData
      });

      if (response.success) {
        // Update local auth context
        login(response.data, token);
        navigate("/home");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-from),transparent_40%)] from-primary/10 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-from),transparent_40%)] from-primary/5 opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden relative z-10"
      >
        <div className="bg-primary p-8 md:p-12 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Rocket className="w-6 h-6" />
            </div>
            <span className="font-bold tracking-widest text-xs uppercase">Welcome to the Network</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            Let's personalize your <br /> <span className="text-white/80">learning experience.</span>
          </h1>
          <p className="text-primary-foreground/70 max-w-md text-sm md:text-base">
            Tell us a bit about your goals so we can connect you with the right circle and resources.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-5 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                <AtSign className="w-3 h-3" /> Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe_24"
                className="w-full px-5 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>

            {/* Exam */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                <GraduationCap className="w-3 h-3" /> Target Exam
              </label>
              <Select
                name="primaryExam"
                value={formData.primaryExam}
                onValueChange={(value) => setFormData(prev => ({ ...prev, primaryExam: value }))}
              >
                <SelectTrigger className="w-full h-12 px-5 bg-muted/50 border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  {EXAMS.map(exam => (
                    <SelectItem key={exam.value} value={exam.value}>{exam.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Current Stage
              </label>
              <Select
                name="stage"
                value={formData.stage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
              >
                <SelectTrigger className="w-full h-12 px-5 bg-muted/50 border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                <BarChart className="w-3 h-3" /> Aspirant Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {LEVELS.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, level: level.value }))}
                    className={`px-4 py-3 rounded-2xl border transition-all text-xs font-bold uppercase tracking-tight ${
                      formData.level === level.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Short Bio (Optional)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Share a bit about your journey..."
                rows={3}
                className="w-full px-5 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full py-6 rounded-[1.5rem] shadow-xl shadow-primary/20 text-base font-bold flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Complete Onboarding
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            
            <p className="text-center text-muted-foreground text-xs font-medium">
              You can always update these details later in your profile settings.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
