/**
 * Centralized constants for the Aspirant Network application.
 * These are shared across multiple components to ensure consistency.
 */

export const EXAMS = [
  { value: "JEE", label: "JEE", fullName: "Joint Entrance Examination" },
  { value: "NEET", label: "NEET", fullName: "National Eligibility cum Entrance Test" },
  { value: "GATE", label: "GATE", fullName: "Graduate Aptitude Test in Engineering" },
  { value: "CAT", label: "CAT", fullName: "Common Admission Test" },
  { value: "UPSC", label: "UPSC", fullName: "Union Public Service Commission" },
  { value: "SSC-10 boards", label: "SSC-10 boards", fullName: "Class 10 Boards" },
  { value: "HSC-12 boards", label: "HSC-12 boards", fullName: "Class 12 Boards" },
];

export const LEVELS = [
  { value: "Beginner", label: "Beginner", description: "Just started preparation" },
  { value: "Intermediate", label: "Intermediate", description: "Comfortable with basics" },
  { value: "Advanced", label: "Advanced", description: "Near exam-ready" },
];

export const STORY_TYPES = [
  { value: "all", label: "All Stories", description: "All shared stories" },
  { value: "Success", label: "Success Story", description: "Share your achievement" },
  { value: "Journey", label: "Journey", description: "Share your preparation journey" },
  { value: "Tips", label: "Tips & Advice", description: "Share helpful tips" },
  { value: "Experience", label: "Experience", description: "Share exam experience" },
  { value: "Motivation", label: "Motivation", description: "Inspire fellow aspirants" },
  { value: "Strategy", label: "Strategy", description: "Share your study strategy" },
];

export const RESOURCE_TYPES = [
  {
    value: "PDF",
    label: "PDF Document",
    iconName: "FileText",
    color: "from-red-500 to-rose-600",
    bg: "bg-red-500/10",
    iconColor: "text-red-400",
  },
  {
    value: "Image",
    label: "Image",
    iconName: "FileImage",
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
];

export const SYSTEM_TAGS = [
  "notes",
  "practice-questions",
  "mock-test",
  "video-lecture",
  "book",
  "reference-material",
  "previous-year-paper",
  "formula-sheet",
  "tips-tricks",
  "cheat-sheet",
];
