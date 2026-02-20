import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subjectService } from "../services/subjectService";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  BookOpen,
  Video,
  FileImage,
  ExternalLink,
  Tag,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

const RESOURCE_TYPES = [
  {
    value: "PDF",
    label: "PDF Document",
    icon: FileText,
    color: "from-red-500 to-rose-600",
    bg: "bg-red-500/10",
    iconColor: "text-red-400",
  },
  {
    value: "Image",
    label: "Image",
    icon: FileImage,
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
];

// System tags options
const SYSTEM_TAGS = [
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

const AddResource = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    url: "",
    publicId: "",
    externalLink: "",
    subject: "",
    subjectName: "",
    topic: "",
    topicName: "",
    systemTags: [],
    userTags: [],
    userTagInput: "",
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Log authentication state on mount
  useEffect(() => {
    console.log("🔐 Auth State:", {
      isAuthenticated: !!token && !!user,
      hasToken: !!token,
      hasUser: !!user,
      userExam: user?.primaryExam,
      userName: user?.name,
    });
  }, [user, token]);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    if (formData.subject) {
      fetchTopics(formData.subject);
    } else {
      setTopics([]);
      setFormData((prev) => ({ ...prev, topic: "", topicName: "" }));
    }
  }, [formData.subject]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      setApiError(""); // Clear previous errors
      console.log("🔍 Fetching subjects...");
      const response = await subjectService.getSubjects();
      console.log("📦 Response received:", response);

      if (response.success && Array.isArray(response.data)) {
        console.log("✅ Subjects loaded:", response.data.length);
        setSubjects(response.data);
        setApiError(""); // Clear error on success
      } else {
        console.error("❌ Invalid response format:", response);
        setApiError("Failed to load subjects: Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // More specific error messages
      if (error.response?.status === 401) {
        setApiError("Please log in to continue");
      } else if (error.response?.status === 400) {
        setApiError("Please complete your profile setup (select an exam)");
      } else {
        setApiError(error.response?.data?.message || "Failed to load subjects");
      }
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      setLoadingTopics(true);
      const response = await subjectService.getTopicsBySubject(subjectId);
      if (response.success && Array.isArray(response.data)) {
        setTopics(response.data);
      } else {
        console.error("Invalid response format:", response);
        setTopics([]);
        setApiError("Failed to load topics: Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setApiError(error.response?.data?.message || "Failed to load topics");
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
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
    if (name === "subject") {
      const selectedSubject = subjects.find((s) => s._id === value);
      setFormData((prev) => ({
        ...prev,
        subject: value,
        subjectName: selectedSubject?.name || "",
        topic: "",
        topicName: "",
      }));
    } else if (name === "topic") {
      const selectedTopic = topics.find((t) => t._id === value);
      setFormData((prev) => ({
        ...prev,
        topic: value,
        topicName: selectedTopic?.name || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Reset file when type changes
      if (name === "type") {
        setSelectedFile(null);
        setFilePreview(null);
        setFormData((prev) => ({
          ...prev,
          url: "",
          publicId: "",
          externalLink: "",
        }));
      }
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSystemTagToggle = (tag) => {
    setFormData((prev) => {
      const isSelected = prev.systemTags.includes(tag);
      return {
        ...prev,
        systemTags: isSelected
          ? prev.systemTags.filter((t) => t !== tag)
          : [...prev.systemTags, tag],
      };
    });
  };

  const handleAddUserTag = () => {
    const tag = formData.userTagInput.trim().toLowerCase();
    if (!tag) return;

    if (formData.userTags.length >= 3) {
      setErrors((prev) => ({
        ...prev,
        userTags: "Maximum 3 user tags allowed",
      }));
      return;
    }

    if (tag.length > 30) {
      setErrors((prev) => ({
        ...prev,
        userTags: "Tag cannot exceed 30 characters",
      }));
      return;
    }

    if (formData.userTags.includes(tag)) {
      setErrors((prev) => ({
        ...prev,
        userTags: "Tag already added",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      userTags: [...prev.userTags, tag],
      userTagInput: "",
    }));

    setErrors((prev) => ({
      ...prev,
      userTags: "",
    }));
  };

  const handleRemoveUserTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      userTags: prev.userTags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleUserTagKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUserTag();
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = {
      PDF: ["application/pdf"],
      Image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    };

    const currentType = formData.type;
    if (!allowedTypes[currentType]?.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        file: `Invalid file type. ${currentType === "PDF" ? "Only PDF files allowed." : "Only image files (JPEG, PNG, WebP, GIF) allowed."}`,
      }));
      return;
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        file: "File size cannot exceed 25MB",
      }));
      return;
    }

    setSelectedFile(file);
    setErrors((prev) => ({ ...prev, file: "" }));

    // Create preview for images
    if (currentType === "Image") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Upload file to Cloudinary
  const uploadFileToCloudinary = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", selectedFile);

      const response = await fetch(
        "http://localhost:5000/api/resources/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload file");
      }

      setUploadProgress(100);
      return data.data; // { url, publicId, fileName, fileSize, mimeType }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFormData((prev) => ({ ...prev, url: "", publicId: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title cannot exceed 200 characters";
    }

    // Description validation (optional)
    if (formData.description.trim() && formData.description.trim().length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = "Resource type is required";
    }

    // URL/Link validation based on type
    if (formData.type === "Link" || formData.type === "Video") {
      if (!formData.externalLink.trim()) {
        newErrors.externalLink = "URL is required for this resource type";
      } else {
        try {
          new URL(formData.externalLink);
        } catch {
          newErrors.externalLink = "Invalid URL format";
        }
      }
    } else if (formData.type === "PDF" || formData.type === "Image") {
      // Check if file is selected or already uploaded
      if (!selectedFile && !formData.url) {
        newErrors.file = "Please select a file to upload";
      }
    }

    // Subject validation
    if (!formData.subject) {
      newErrors.subject = "Subject is required";
    }

    // Topic validation
    if (!formData.topic) {
      newErrors.topic = "Topic is required";
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
      let uploadedFileData = null;

      // Upload file to Cloudinary if PDF or Image type
      if (
        (formData.type === "PDF" || formData.type === "Image") &&
        selectedFile
      ) {
        try {
          uploadedFileData = await uploadFileToCloudinary();
        } catch (uploadError) {
          setApiError("Failed to upload file. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Prepare request body based on resource type
      const requestBody = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        subject: formData.subject,
        subjectName: formData.subjectName,
        topic: formData.topic,
        topicName: formData.topicName,
        systemTags: formData.systemTags,
        userTags: formData.userTags,
      };

      // Add appropriate URL field based on type
      if (formData.type === "Link" || formData.type === "Video") {
        requestBody.externalLink = formData.externalLink.trim();
      } else if (formData.type === "PDF" || formData.type === "Image") {
        if (uploadedFileData) {
          requestBody.url = uploadedFileData.url;
          requestBody.publicId = uploadedFileData.publicId;
        } else {
          requestBody.url = formData.url;
          requestBody.publicId = formData.publicId;
        }
      }

      console.log("📤 Sending request body:", requestBody);
      console.log(
        "📋 systemTags type:",
        typeof requestBody.systemTags,
        "isArray:",
        Array.isArray(requestBody.systemTags),
      );

      const response = await fetch("http://localhost:5000/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add resource");
      }

      // Redirect to resources page
      navigate("/resources");
    } catch (error) {
      console.error("Add resource error:", error);
      setApiError(error.message || "Failed to add resource. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const hasTitle =
      formData.title.trim().length >= 5 && formData.title.trim().length <= 200;
    const hasDescription =
      formData.description.trim().length >= 20 &&
      formData.description.trim().length <= 1000;
    const hasType = !!formData.type;
    const hasSubject = !!formData.subject;
    const hasTopic = !!formData.topic;

    let hasValidContent = false;
    if (formData.type === "Link" || formData.type === "Video") {
      hasValidContent = !!formData.externalLink.trim();
    } else if (formData.type === "PDF" || formData.type === "Image") {
      hasValidContent = !!selectedFile || !!formData.url;
    }

    return (
      hasTitle &&
      hasDescription &&
      hasType &&
      hasSubject &&
      hasTopic &&
      hasValidContent
    );
  };

  const getValidationMessage = () => {
    if (formData.title.trim().length < 5) {
      return `Title needs ${5 - formData.title.trim().length} more characters`;
    }
    if (formData.description.trim().length < 20) {
      return `Description needs ${20 - formData.description.trim().length} more characters`;
    }
    if (!formData.type) {
      return "Please select a resource type";
    }
    if (!formData.subject) {
      return "Please select a subject";
    }
    if (!formData.topic) {
      return "Please select a topic";
    }
    if (
      (formData.type === "Link" || formData.type === "Video") &&
      !formData.externalLink.trim()
    ) {
      return "Please provide a resource URL";
    }
    if (
      (formData.type === "PDF" || formData.type === "Image") &&
      !selectedFile &&
      !formData.url
    ) {
      return "Please upload a file";
    }
    return "";
  };

  const needsExternalLink =
    formData.type === "Link" || formData.type === "Video";
  const needsFileUpload = formData.type === "PDF" || formData.type === "Image";

  // Get selected resource type info
  const selectedTypeInfo = RESOURCE_TYPES.find(
    (t) => t.value === formData.type,
  );

  // Calculate form completion percentage
  const calculateProgress = () => {
    let completed = 0;
    let total = 6;

    if (formData.title.trim().length >= 5) completed++;
    if (formData.description.trim().length >= 20) completed++;
    if (formData.type) completed++;
    if (formData.subject) completed++;
    if (formData.topic) completed++;
    if (
      (needsExternalLink && formData.externalLink.trim()) ||
      (needsFileUpload && (selectedFile || formData.url))
    )
      completed++;

    return Math.round((completed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Share a Resource
            </CardTitle>
            <CardDescription>
              Help fellow aspirants preparing for {user?.primaryExam}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Error */}
              {apiError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {apiError}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Resource Title *
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.title.length}/200)
                  </span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Complete Algebra Notes for JEE"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description *
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.description.length}/1000)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what this resource contains and how it can help other aspirants..."
                  className={`min-h-[150px] ${
                    errors.description ? "border-destructive" : ""
                  }`}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Resource Type Selection */}
              <div className="space-y-2">
                <Label>Resource Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {RESOURCE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleSelectChange("type", type.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${type.iconColor}`} />
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type}</p>
                )}
              </div>

              {/* External Link (for Video/Link types) */}
              {needsExternalLink && (
                <div className="space-y-2">
                  <Label htmlFor="externalLink">
                    Resource URL *
                    <span className="text-xs text-muted-foreground ml-2">
                      (YouTube, Google Drive, etc.)
                    </span>
                  </Label>
                  <Input
                    id="externalLink"
                    name="externalLink"
                    type="url"
                    value={formData.externalLink}
                    onChange={handleChange}
                    placeholder="https://example.com/resource"
                    className={errors.externalLink ? "border-destructive" : ""}
                  />
                  {errors.externalLink && (
                    <p className="text-sm text-destructive">
                      {errors.externalLink}
                    </p>
                  )}
                </div>
              )}

              {/* File Upload (for PDF/Image types) */}
              {needsFileUpload && (
                <div className="space-y-2">
                  <Label>
                    Upload {formData.type === "PDF" ? "PDF Document" : "Image"}{" "}
                    *
                    <span className="text-xs text-muted-foreground ml-2">
                      (Max 25MB)
                    </span>
                  </Label>

                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="fileUpload"
                        className="hidden"
                        accept={
                          formData.type === "PDF"
                            ? ".pdf"
                            : "image/jpeg,image/png,image/webp,image/gif"
                        }
                        onChange={handleFileSelect}
                      />
                      <label
                        htmlFor="fileUpload"
                        className="cursor-pointer block"
                      >
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-base font-medium text-foreground mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formData.type === "PDF"
                            ? "PDF files only (max 25MB)"
                            : "JPEG, PNG, WebP, GIF (max 25MB)"}
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {formData.type === "PDF" ? (
                            <FileText className="w-8 h-8 text-red-500" />
                          ) : filePreview ? (
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-blue-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removeSelectedFile}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      {uploading && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              Uploading...
                            </span>
                            <span className="font-medium">
                              {uploadProgress}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {errors.file && (
                    <p className="text-sm text-destructive">{errors.file}</p>
                  )}
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    handleSelectChange("subject", value)
                  }
                  disabled={loadingSubjects}
                >
                  <SelectTrigger
                    className={errors.subject ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject}</p>
                )}
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Select
                  value={formData.topic}
                  onValueChange={(value) => handleSelectChange("topic", value)}
                  disabled={!formData.subject || loadingTopics}
                >
                  <SelectTrigger
                    className={errors.topic ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={
                        !formData.subject
                          ? "Select a subject first"
                          : "Select a topic"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic._id} value={topic._id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.topic && (
                  <p className="text-sm text-destructive">{errors.topic}</p>
                )}
              </div>

              {/* System Tags */}
              <div className="space-y-2">
                <Label>System Tags (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Select tags that best describe your resource
                </p>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        formData.systemTags.includes(tag)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer focus:ring-0"
                      onClick={() => handleSystemTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* User Tags */}
              <div className="space-y-2">
                <Label htmlFor="userTagInput">
                  Custom Tags (Optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    (Max 3)
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="userTagInput"
                    name="userTagInput"
                    type="text"
                    value={formData.userTagInput}
                    onChange={handleChange}
                    onKeyPress={handleUserTagKeyPress}
                    placeholder="Add custom tag..."
                    maxLength={30}
                    disabled={formData.userTags.length >= 3}
                    className={errors.userTags ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddUserTag}
                    disabled={
                      !formData.userTagInput.trim() ||
                      formData.userTags.length >= 3
                    }
                  >
                    Add
                  </Button>
                </div>
                {errors.userTags && (
                  <p className="text-sm text-destructive">{errors.userTags}</p>
                )}
                {formData.userTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.userTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer focus:ring-0"
                        onClick={() => handleRemoveUserTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-2">
                {!isFormValid() && (
                  <p className="text-sm text-muted-foreground text-center">
                    {getValidationMessage()}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={!isFormValid() || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Resource"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/resources")}
                    disabled={loading}
                    className="hover:bg-gray-100 active:bg-gray-100 focus:ring-0"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddResource;
