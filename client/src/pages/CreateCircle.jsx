import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../context/AuthContext";
import { useExam } from "../context/ExamContext";
import { circleService } from "../services/circleService";
import { subjectService } from "../services/subjectService";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const CreateCircle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentExam } = useExam();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [formData, setFormData] = useState({
    exam: currentExam || user?.primaryExam || "",
    level: user?.level || "Beginner",
    name: "",
    description: "",
    subject: "",
    isPrivate: false,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await subjectService.getSubjects();
      setSubjects((res.data || []).map((s) => s.name));
    } catch {
      setSubjects([]);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await circleService.list({
        exam: formData.exam,
        level: formData.level,
        subject: formData.subject || undefined,
        sort: "most-active",
        limit: 8,
      });
      setSuggestions(res.data || []);
      setStep(2);
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to fetch suggestions",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (confirmCreate = false) => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        level: formData.level,
        subject: formData.subject || undefined,
        isPrivate: formData.isPrivate,
        confirmCreate,
      };

      const res = await circleService.create(payload);
      navigate(`/circles/${res.data._id}`);
    } catch (e) {
      if (e.response?.status === 409) {
        setSuggestions(e.response.data.suggestions || []);
      }
      setError(
        e.response?.data?.message || e.message || "Failed to create circle",
      );
    } finally {
      setLoading(false);
    }
  };

  const canContinueStep1 = formData.exam && formData.level;
  const canCreate =
    formData.name.trim().length >= 5 && formData.description.trim().length > 0;

  return (
    <div className="py-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Create Study Circle
        </h1>
        <p className="text-sm text-muted-foreground">
          Step-based setup with circle suggestions before creation.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="content-card">
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Badge
            className={step >= 1 ? "bg-primary/10 text-primary border-0" : ""}
          >
            1. Exam & Level
          </Badge>
          <Badge
            className={step >= 2 ? "bg-primary/10 text-primary border-0" : ""}
          >
            2. Suggestions
          </Badge>
          <Badge
            className={step >= 3 ? "bg-primary/10 text-primary border-0" : ""}
          >
            3. Circle Details
          </Badge>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <select
                value={formData.exam}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, exam: e.target.value }))
                }
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">Select Exam</option>
                {[user?.primaryExam, user?.secondaryExam]
                  .filter(Boolean)
                  .map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
              </select>

              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, level: e.target.value }))
                }
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm w-full"
            >
              <option value="">Subject (optional)</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <div className="flex justify-end">
              <Button
                disabled={!canContinueStep1 || loading}
                onClick={fetchSuggestions}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Existing circles you may want to join first:
            </p>
            {suggestions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No similar circles found. You can create a new one.
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((circle) => (
                  <div
                    key={circle._id}
                    className="rounded-lg border border-border p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {circle.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {circle.level}
                        {circle.subject ? ` · ${circle.subject}` : ""} ·{" "}
                        {circle.memberCount || 0} members
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/circles/${circle._id}`)}
                    >
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Create New Circle</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Circle name (min 5 chars)"
            />
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="What is this circle about?"
            />
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPrivate: e.target.checked,
                  }))
                }
              />
              Private circle
            </label>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!canCreate || loading}
                  onClick={() => handleCreate(true)}
                >
                  Create Anyway
                </Button>
                <Button
                  disabled={!canCreate || loading}
                  onClick={() => handleCreate(false)}
                >
                  Create Circle
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCircle;
