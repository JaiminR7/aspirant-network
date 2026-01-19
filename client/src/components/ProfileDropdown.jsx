import { useState } from "react";
import { useExam } from "../contexts/ExamContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Select, SelectItem } from "./ui/select";
import {
  User,
  Settings,
  LogOut,
  Edit3,
  GraduationCap,
  Calendar,
  Target,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

const EXAMS = [
  { id: "CAT", name: "CAT" },
  { id: "JEE", name: "JEE" },
  { id: "NEET", name: "NEET" },
  { id: "UPSC", name: "UPSC" },
];

const LEVELS = [
  { id: "beginner", name: "Beginner" },
  { id: "intermediate", name: "Intermediate" },
  { id: "advanced", name: "Advanced" },
];

const CURRENT_YEAR = new Date().getFullYear();
const ATTEMPT_YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR + i);

export function ProfileDropdown() {
  const { user, updateUser, switchExam, logout } = useExam();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExamSwitchDialogOpen, setIsExamSwitchDialogOpen] = useState(false);
  const [pendingExamSwitch, setPendingExamSwitch] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    level: user?.level || "",
    attemptYear: user?.attemptYear || CURRENT_YEAR + 1,
  });

  const handleEditProfile = () => {
    setEditFormData({
      name: user.name,
      username: user.username,
      level: user.level,
      attemptYear: user.attemptYear,
    });
    setIsEditDialogOpen(true);
    setIsDropdownOpen(false);
  };

  const handleSaveProfile = () => {
    updateUser(editFormData);
    setIsEditDialogOpen(false);
  };

  const handleExamSwitch = (newExam) => {
    if (newExam !== user.primaryExam) {
      setPendingExamSwitch(newExam);
      setIsExamSwitchDialogOpen(true);
    }
    setIsDropdownOpen(false);
  };

  const confirmExamSwitch = () => {
    switchExam(pendingExamSwitch);
    setIsExamSwitchDialogOpen(false);
    setPendingExamSwitch(null);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">
            {user?.primaryExam} • {user?.level}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isDropdownOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500">@{user?.username}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="default" className="text-xs">
                    {user?.primaryExam}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {user?.level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left"
            >
              <Edit3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Edit Profile</span>
            </button>

            <div className="px-3 py-2">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Switch Exam
              </label>
              <Select
                value={user?.primaryExam}
                onChange={(e) => handleExamSwitch(e.target.value)}
                className="text-sm"
              >
                {EXAMS.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-red-50 text-red-600 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={editFormData.username}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Level</label>
              <Select
                value={editFormData.level}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    level: e.target.value,
                  }))
                }
              >
                {LEVELS.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target Attempt Year
              </label>
              <Select
                value={editFormData.attemptYear}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    attemptYear: parseInt(e.target.value),
                  }))
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exam Switch Confirmation Dialog */}
      <Dialog
        open={isExamSwitchDialogOpen}
        onOpenChange={setIsExamSwitchDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Switch Primary Exam?</span>
            </DialogTitle>
            <DialogDescription>
              You're about to switch from <strong>{user?.primaryExam}</strong>{" "}
              to <strong>{pendingExamSwitch}</strong>.
              <br />
              <br />
              This will change your entire feed to show content specific to{" "}
              {pendingExamSwitch}. Your profile and progress will be updated
              accordingly.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsExamSwitchDialogOpen(false);
                setPendingExamSwitch(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmExamSwitch}>
              Yes, Switch to {pendingExamSwitch}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
