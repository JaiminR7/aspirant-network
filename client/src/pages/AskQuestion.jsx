import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
import { questionService } from "../services/questionService";
import { subjectService } from "../services/subjectService";

// System tags options
const SYSTEM_TAGS = [
  "doubt",
  "concept-clarity",
  "exam-tips",
  "study-material",
  "practice-problems",
  "revision",
  "strategy",
  "time-management",
  "previous-year",
  "mock-test",
];

const AskQuestion = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    subjectName: "",
    topic: "",
    topicName: "",
    systemTags: [],
    userTags: [],
    userTagInput: "",
    isAnonymous: false,
  });

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

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
      console.log("Fetching subjects...");
      const response = await subjectService.getSubjects();
      console.log("Subjects response:", response);
      console.log("Subjects data:", response.data);

      if (response.success && Array.isArray(response.data)) {
        setSubjects(response.data);
        console.log("✅ Subjects loaded:", response.data.length);
      } else {
        console.error("❌ Invalid response format:", response);
        setApiError("Failed to load subjects: Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
      console.error("Error response:", error.response?.data);
      setApiError(error.response?.data?.message || "Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      setLoadingTopics(true);
      console.log("Fetching topics for subject:", subjectId);
      const response = await subjectService.getTopicsBySubject(subjectId);
      console.log("Topics response:", response);
      console.log("Topics data:", response.data);

      if (response.success && Array.isArray(response.data)) {
        setTopics(response.data);
        console.log("✅ Topics loaded:", response.data.length);
      } else {
        console.error("❌ Invalid response format:", response);
        setTopics([]);
        setApiError("Failed to load topics: Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error fetching topics:", error);
      console.error("Error response:", error.response?.data);
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

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    } else if (formData.title.trim().length > 300) {
      newErrors.title = "Title cannot exceed 300 characters";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = "Description cannot exceed 5000 characters";
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
      const questionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        subjectName: formData.subjectName,
        topic: formData.topic,
        topicName: formData.topicName,
        systemTags: formData.systemTags,
        userTags: formData.userTags,
        isAnonymous: formData.isAnonymous,
      };

      console.log("Submitting question with data:", questionData);

      const data = await questionService.create(questionData);

      console.log("Question created successfully:", data);

      // Navigate to the question detail page
      const questionId = data.data?._id || data.question?._id;
      if (questionId) {
        navigate(`/questions/${questionId}`);
      } else {
        console.error("No question ID in response:", data);
        navigate("/questions");
      }
    } catch (error) {
      console.error("Create question error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create question. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const titleValid =
      formData.title.trim().length >= 10 && formData.title.trim().length <= 300;
    const descriptionValid =
      formData.description.trim().length >= 20 &&
      formData.description.trim().length <= 5000;
    const subjectValid = !!formData.subject;
    const topicValid = !!formData.topic;

    const valid = titleValid && descriptionValid && subjectValid && topicValid;

    console.log("Form validation:", {
      title: formData.title.trim(),
      titleLength: formData.title.trim().length,
      titleValid,
      description: formData.description.trim().substring(0, 50) + "...",
      descriptionLength: formData.description.trim().length,
      descriptionValid,
      subject: formData.subject,
      subjectValid,
      topic: formData.topic,
      topicValid,
      isValid: valid,
    });

    return valid;
  };

  const getValidationMessage = () => {
    if (formData.title.trim().length < 10) {
      return `Title needs ${10 - formData.title.trim().length} more characters`;
    }
    if (formData.description.trim().length < 20) {
      return `Description needs ${20 - formData.description.trim().length} more characters`;
    }
    if (!formData.subject) {
      return "Please select a subject";
    }
    if (!formData.topic) {
      return "Please select a topic";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Ask a Question</CardTitle>
            <CardDescription>
              Get help from fellow aspirants preparing for {user?.primaryExam}
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
                  Question Title *
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.title.length}/300)
                  </span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Be specific and imagine you're asking a question to another person"
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
                    ({formData.description.length}/5000)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Include all the details someone would need to answer your question..."
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
                  Select tags that best describe your question
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

              {/* Anonymous Option */}
              <div className="flex items-center space-x-2">
                <input
                  id="isAnonymous"
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isAnonymous: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="isAnonymous"
                  className="text-sm font-normal cursor-pointer"
                >
                  Post anonymously
                </Label>
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
                    {loading ? "Posting..." : "Post Question"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
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

export default AskQuestion;
