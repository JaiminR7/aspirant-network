import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Settings as SettingsIcon,
  User,
  Target,
  Lock,
  AlertTriangle,
  Save,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Trash2,
} from "lucide-react";

const LEVELS = [
  {
    value: "Beginner",
    label: "Beginner",
    description: "Just started preparation",
  },
  {
    value: "Intermediate",
    label: "Intermediate",
    description: "Comfortable with basics",
  },
  { value: "Advanced", label: "Advanced", description: "Near exam-ready" },
];

const EXAMS = [
  { value: "CAT", label: "CAT", fullName: "Common Admission Test" },
  { value: "UPSC", label: "UPSC", fullName: "Union Public Service Commission" },
  { value: "JEE", label: "JEE", fullName: "Joint Entrance Examination" },
  {
    value: "NEET",
    label: "NEET",
    fullName: "National Eligibility cum Entrance Test",
  },
  {
    value: "GATE",
    label: "GATE",
    fullName: "Graduate Aptitude Test in Engineering",
  },
  { value: "SSC", label: "SSC", fullName: "Staff Selection Commission" },
  {
    value: "IBPS",
    label: "IBPS",
    fullName: "Institute of Banking Personnel Selection",
  },
  {
    value: "GMAT",
    label: "GMAT",
    fullName: "Graduate Management Admission Test",
  },
  { value: "GRE", label: "GRE", fullName: "Graduate Record Examination" },
  {
    value: "IELTS",
    label: "IELTS",
    fullName: "International English Language Testing System",
  },
];

const GOAL_VISIBILITY = [
  { value: "Public", label: "Public", description: "Visible to everyone" },
  {
    value: "Connections",
    label: "Connections",
    description: "Only visible to connections",
  },
  { value: "Private", label: "Private", description: "Only visible to you" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, token, updateUser, logout } = useAuth();
  const { addToast } = useToast();

  // Form states
  const [level, setLevel] = useState("");
  const [goalText, setGoalText] = useState("");
  const [goalVisibility, setGoalVisibility] = useState("Public");
  const [activityVisibility, setActivityVisibility] = useState(true);
  const [allowAnonymousPosting, setAllowAnonymousPosting] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examConfirmation, setExamConfirmation] = useState("");

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setLevel(user.level || "");
      setGoalText(user.goal?.text || "");
      setGoalVisibility(user.goal?.visibility || "Public");
      setActivityVisibility(user.privacy?.activityVisibility ?? true);
      setAllowAnonymousPosting(user.privacy?.allowAnonymousPosting ?? false);
      setSelectedExam(user.primaryExam || "");
    }
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const updates = {
        level,
        goal: {
          text: goalText,
          visibility: goalVisibility,
        },
        privacy: {
          activityVisibility,
          allowAnonymousPosting,
        },
      };

      const response = await fetch("http://localhost:5000/api/users/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update settings");
      }

      const data = await response.json();

      // Update user in context
      if (updateUser) {
        updateUser(data.user);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
      setError(error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePrimaryExam = async () => {
    if (examConfirmation !== "CHANGE EXAM") {
      setError("Please type 'CHANGE EXAM' to confirm");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:5000/api/users/change-exam",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ primaryExam: selectedExam }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to change exam");
      }

      const data = await response.json();

      // Update user in context
      if (updateUser) {
        updateUser(data.user);
      }

      setShowExamModal(false);
      setExamConfirmation("");
      setSuccess(true);

      // Optionally redirect to home or show success message
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error changing exam:", error);
      setError(error.message || "Failed to change exam");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account");
      }

      addToast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
        variant: "success",
        duration: 3000,
      });

      // Logout and redirect to home
      setTimeout(() => {
        logout();
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError(error.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openExamChangeModal = () => {
    setShowExamModal(true);
    setExamConfirmation("");
    setError(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            Please log in to access settings
          </p>
          <Button onClick={() => navigate("/login")} className="rounded-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Success Message */}
        {success && (
          <div className="feed-card p-4 border-emerald-500/50 bg-emerald-500/10">
            <div className="flex items-center text-emerald-400">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">Settings updated successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="feed-card p-4 border-destructive/50 bg-destructive/10">
            <div className="flex items-center text-destructive">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{String(error)}</p>
            </div>
          </div>
        )}

        {/* Preparation Level */}
        <div className="sidebar-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Preparation Level
              </h3>
              <p className="text-sm text-muted-foreground">
                Update your current preparation level
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="level" className="text-muted-foreground text-sm">
              Level
            </Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger
                id="level"
                className="bg-secondary border-border rounded-xl"
              >
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((lvl) => (
                  <SelectItem key={lvl.value} value={lvl.value}>
                    <div>
                      <div className="font-medium">{lvl.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {lvl.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Goal Settings */}
        <div className="sidebar-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Goal</h3>
              <p className="text-sm text-muted-foreground">
                Set your preparation goal and control who can see it
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-muted-foreground text-sm">
                Your Goal
              </Label>
              <Textarea
                id="goal"
                placeholder="E.g., Crack JEE Advanced with rank under 1000"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                maxLength={200}
                rows={3}
                className="bg-secondary border-border rounded-xl resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {goalText.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="goalVisibility"
                className="text-muted-foreground text-sm"
              >
                Goal Visibility
              </Label>
              <Select value={goalVisibility} onValueChange={setGoalVisibility}>
                <SelectTrigger
                  id="goalVisibility"
                  className="bg-secondary border-border rounded-xl"
                >
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_VISIBILITY.map((visibility) => (
                    <SelectItem key={visibility.value} value={visibility.value}>
                      <div>
                        <div className="font-medium">{visibility.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {visibility.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="sidebar-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Privacy Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Control your privacy and visibility preferences
              </p>
            </div>
          </div>
          <div className="space-y-0">
            {/* Activity Visibility */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div className="flex-grow">
                <p className="font-medium text-foreground">
                  Activity Visibility
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Allow others to see your questions, answers, and resources
                </p>
              </div>
              <Button
                variant={activityVisibility ? "default" : "outline"}
                size="sm"
                onClick={() => setActivityVisibility(!activityVisibility)}
                className="ml-4 rounded-full"
              >
                {activityVisibility ? "Public" : "Private"}
              </Button>
            </div>

            {/* Anonymous Posting */}
            <div className="flex items-center justify-between py-4">
              <div className="flex-grow">
                <p className="font-medium text-foreground">Anonymous Posting</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable option to post questions and answers anonymously
                </p>
              </div>
              <Button
                variant={allowAnonymousPosting ? "default" : "outline"}
                size="sm"
                onClick={() => setAllowAnonymousPosting(!allowAnonymousPosting)}
                className="ml-4 rounded-full"
              >
                {allowAnonymousPosting ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
        </div>

        {/* Primary Exam (Critical Setting) */}
        <div className="sidebar-card p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Primary Exam</h3>
              <p className="text-sm text-amber-400/80">
                Changing your primary exam will affect all your content
                visibility
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Exam</p>
              <p className="text-2xl font-bold text-foreground">
                {user.primaryExam}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={openExamChangeModal}
              className="rounded-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              Change Exam
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="sidebar-card p-6 border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. This
                action will permanently delete all your data including
                questions, answers, resources, and stories.
              </p>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate("/profile/" + user.username)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Exam Change Confirmation Modal */}
      <Dialog open={showExamModal} onOpenChange={setShowExamModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Change Primary Exam
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This is a critical action that will affect your entire experience
              on the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm text-amber-400 font-medium mb-2">
                ⚠️ Important Consequences:
              </p>
              <ul className="text-sm text-amber-400/80 space-y-1 ml-4 list-disc">
                <li>Your feed will show content from the new exam</li>
                <li>
                  Old content will remain but may not be visible in main feed
                </li>
                <li>Recommendations will be based on the new exam</li>
                <li>You can change back later if needed</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="newExam"
                className="text-muted-foreground text-sm"
              >
                Select New Exam
              </Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger
                  id="newExam"
                  className="bg-secondary border-border rounded-xl"
                >
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {EXAMS.map((exam) => (
                    <SelectItem key={exam.value} value={exam.value}>
                      <div>
                        <div className="font-medium">{exam.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {exam.fullName}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmation"
                className="text-muted-foreground text-sm"
              >
                Type{" "}
                <span className="font-bold text-foreground">CHANGE EXAM</span>{" "}
                to confirm
              </Label>
              <input
                id="confirmation"
                type="text"
                className="flex h-10 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                value={examConfirmation}
                onChange={(e) => setExamConfirmation(e.target.value)}
                placeholder="Type CHANGE EXAM"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExamModal(false);
                setExamConfirmation("");
                setError(null);
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePrimaryExam}
              disabled={
                loading ||
                examConfirmation !== "CHANGE EXAM" ||
                selectedExam === user.primaryExam
              }
              className="rounded-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Confirm Change"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 mb-4">
                <p className="text-sm text-foreground font-medium mb-2">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    Your profile and account information
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    All your questions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    All your answers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    All your resources
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    All your activity and reputation
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="delete-password"
                  className="text-sm font-medium text-foreground"
                >
                  Enter your password to confirm
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError("");
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive border border-transparent transition-all"
                  />
                </div>
                {deleteError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {deleteError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white"
              >
                {deleteLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
