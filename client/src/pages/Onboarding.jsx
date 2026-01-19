import { useState } from "react";
import { useExam } from "../contexts/ExamContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Select, SelectItem } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { User, GraduationCap, Calendar, Target } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Aspirant Network</CardTitle>
          <CardDescription>
            Step {step} of 3: Let's set up your profile
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex space-x-2 mt-4">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`h-2 flex-1 rounded-full ${
                  stepNumber <= step ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary mb-4">
                <User className="w-5 h-5" />
                <span className="font-medium">Personal Information</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.username}
                  onChange={(e) => updateFormData("username", e.target.value)}
                  placeholder="Choose a unique username"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Exam Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary mb-4">
                <GraduationCap className="w-5 h-5" />
                <span className="font-medium">Choose Your Primary Exam</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {EXAMS.map((exam) => (
                  <div
                    key={exam.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.primaryExam === exam.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateFormData("primaryExam", exam.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{exam.name}</h3>
                        <p className="text-sm text-gray-600">
                          {exam.description}
                        </p>
                      </div>
                      {formData.primaryExam === exam.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {errors.primaryExam && (
                <p className="text-red-500 text-sm">{errors.primaryExam}</p>
              )}

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  Target Attempt Year
                </label>
                <Select
                  value={formData.attemptYear}
                  onChange={(e) =>
                    updateFormData("attemptYear", parseInt(e.target.value))
                  }
                >
                  {ATTEMPT_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Level Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary mb-4">
                <Target className="w-5 h-5" />
                <span className="font-medium">Select Your Level</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {LEVELS.map((level) => (
                  <div
                    key={level.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.level === level.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateFormData("level", level.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{level.name}</h3>
                        <p className="text-sm text-gray-600">
                          {level.description}
                        </p>
                      </div>
                      {formData.level === level.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {errors.level && (
                <p className="text-red-500 text-sm">{errors.level}</p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>

          <Button onClick={handleNext}>
            {step === 3 ? "Complete Setup" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
