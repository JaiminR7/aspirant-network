import { useState } from "react";
import { useExam } from "../contexts/ExamContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { User, GraduationCap, Calendar, Target, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

const EXAMS = [
  { id: "CAT", name: "CAT", description: "Common Admission Test" },
  { id: "JEE", name: "JEE", description: "Joint Entrance Examination" },
  {
    id: "NEET",
    name: "NEET",
    description: "National Eligibility cum Entrance Test",
  },
  { id: "UPSC", name: "UPSC", description: "Union Public Service Commission" },
];

const LEVELS = [
  { id: "beginner", name: "Beginner", description: "Just started preparation" },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Some experience with the exam",
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Experienced and confident",
  },
];

const CURRENT_YEAR = new Date().getFullYear();
const ATTEMPT_YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR + i);

export function Onboarding() {
  const { completeOnboarding } = useExam();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    primaryExam: "",
    attemptYear: CURRENT_YEAR + 1,
    level: "",
  });
  const [errors, setErrors] = useState({});

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.username.trim())
        newErrors.username = "Username is required";
    }

    if (currentStep === 2) {
      if (!formData.primaryExam)
        newErrors.primaryExam = "Please select an exam";
    }

    if (currentStep === 3) {
      if (!formData.level) newErrors.level = "Please select your level";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        // Complete onboarding
        completeOnboarding({
          ...formData,
          id: Date.now(),
          joinedAt: new Date().toISOString(),
        });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Join Aspirant Network</h1>
          <p className="text-muted-foreground mt-1">
            Step {step} of 3: Let's set up your profile
          </p>
        </div>

        <div className="sidebar-card p-6">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  stepNumber <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <User className="w-5 h-5" />
                </div>
                <span className="font-semibold text-foreground">Personal Information</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  value={formData.username}
                  onChange={(e) => updateFormData("username", e.target.value)}
                  placeholder="Choose a unique username"
                />
                {errors.username && (
                  <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Exam Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-semibold text-foreground">Choose Your Primary Exam</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {EXAMS.map((exam) => (
                  <div
                    key={exam.id}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      formData.primaryExam === exam.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-muted-foreground/30"
                    }`}
                    onClick={() => updateFormData("primaryExam", exam.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{exam.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exam.description}
                        </p>
                      </div>
                      {formData.primaryExam === exam.id && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {errors.primaryExam && (
                <p className="text-red-400 text-sm">{errors.primaryExam}</p>
              )}

              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target Attempt Year
                </label>
                <select
                  value={formData.attemptYear}
                  onChange={(e) =>
                    updateFormData("attemptYear", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {ATTEMPT_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Level Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Target className="w-5 h-5" />
                </div>
                <span className="font-semibold text-foreground">Select Your Level</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {LEVELS.map((level) => (
                  <div
                    key={level.id}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      formData.level === level.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-muted-foreground/30"
                    }`}
                    onClick={() => updateFormData("level", level.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{level.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {level.description}
                        </p>
                      </div>
                      {formData.level === level.id && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {errors.level && (
                <p className="text-red-400 text-sm">{errors.level}</p>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={step === 1}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <Button onClick={handleNext} className="rounded-full">
              {step === 3 ? "Complete Setup" : "Next"}
              {step < 3 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
