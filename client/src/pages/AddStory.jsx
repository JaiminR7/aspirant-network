import { useState } from "react";
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
import { X, Loader2 } from "lucide-react";
import { storyService } from "../services/storyService";

// Story types
const STORY_TYPES = [
  {
    value: "Success",
    label: "Success Story",
    description: "Share your achievement",
  },
  {
    value: "Journey",
    label: "Journey",
    description: "Share your preparation journey",
  },
  { value: "Tips", label: "Tips & Advice", description: "Share helpful tips" },
  {
    value: "Experience",
    label: "Experience",
    description: "Share exam experience",
  },
  {
    value: "Motivation",
    label: "Motivation",
    description: "Inspire fellow aspirants",
  },
  {
    value: "Strategy",
    label: "Strategy",
    description: "Share your study strategy",
  },
];

// Common tags for stories
const COMMON_TAGS = [
  "success",
  "motivation",
  "tips",
  "strategy",
  "preparation",
  "experience",
  "interview",
  "time-management",
  "study-plan",
  "mental-health",
];

const AddStory = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    storyType: "",
    tags: [],
    tagInput: "",
    result: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => {
      const isSelected = prev.tags.includes(tag);
      if (isSelected) {
        return { ...prev, tags: prev.tags.filter((t) => t !== tag) };
      } else if (prev.tags.length < 5) {
        return { ...prev, tags: [...prev.tags, tag] };
      }
      return prev;
    });
  };

  const handleAddCustomTag = () => {
    const tag = formData.tagInput.trim().toLowerCase();
    if (!tag) return;
    if (formData.tags.length >= 5) {
      setErrors((prev) => ({ ...prev, tags: "Maximum 5 tags allowed" }));
      return;
    }
    if (formData.tags.includes(tag)) {
      setErrors((prev) => ({ ...prev, tags: "Tag already added" }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
      tagInput: "",
    }));
    setErrors((prev) => ({ ...prev, tags: "" }));
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title cannot exceed 200 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.trim().length < 100) {
      newErrors.content = "Content must be at least 100 characters";
    }

    if (!formData.storyType) {
      newErrors.storyType = "Story type is required";
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
      const data = await storyService.create({
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        storyType: formData.storyType,
        tags: formData.tags,
        isAnonymous: formData.isAnonymous,
        result: formData.result.trim() || undefined,
      });

      // Redirect to the stories list since detail page is not implemented yet
      navigate("/stories");
    } catch (error) {
      console.error("Create story error:", error);
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create story. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.title.trim().length >= 10 &&
      formData.content.trim().length >= 100 &&
      formData.storyType
    );
  };

  const getValidationMessage = () => {
    if (formData.title.trim().length < 10) {
      return `Title needs ${10 - formData.title.trim().length} more characters`;
    }
    if (formData.content.trim().length < 100) {
      return `Content needs ${100 - formData.content.trim().length} more characters`;
    }
    if (!formData.storyType) {
      return "Please select a story type";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Share Your Story
            </CardTitle>
            <CardDescription>
              Inspire fellow aspirants preparing for {user?.primaryExam}
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

              {/* Story Type */}
              <div className="space-y-2">
                <Label htmlFor="storyType">Story Type *</Label>
                <Select
                  value={formData.storyType}
                  onValueChange={(value) =>
                    handleSelectChange("storyType", value)
                  }
                >
                  <SelectTrigger
                    className={errors.storyType ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select story type" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.storyType && (
                  <p className="text-sm text-destructive">{errors.storyType}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title *
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.title.length}/200)
                  </span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Give your story a compelling title..."
                  maxLength={200}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Your Story *
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.content.length} characters, min 100)
                  </span>
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Share your journey, experience, tips, or success story in detail..."
                  className={`min-h-[250px] ${
                    errors.content ? "border-destructive" : ""
                  }`}
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content}</p>
                )}
              </div>

              {/* Excerpt (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">
                  Short Excerpt (Optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    Preview text shown in listings
                  </span>
                </Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  placeholder="Brief summary of your story (auto-generated if left empty)..."
                  maxLength={250}
                  className="min-h-[80px]"
                />
              </div>

              {/* Result (for Success Stories) */}
              {formData.storyType === "Success" && (
                <div className="space-y-2">
                  <Label htmlFor="result">
                    Your Result/Achievement (Optional)
                  </Label>
                  <Input
                    id="result"
                    name="result"
                    value={formData.result}
                    onChange={handleChange}
                    placeholder="e.g., AIR 156, 99.5 percentile, Selected in XYZ..."
                  />
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <Label>
                  Tags (Optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    Max 5 tags
                  </span>
                </Label>

                {/* Common Tags */}
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        formData.tags.includes(tag) ? "default" : "outline"
                      }
                      className="cursor-pointer focus:ring-0"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2">
                  <Input
                    name="tagInput"
                    value={formData.tagInput}
                    onChange={handleChange}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add custom tag..."
                    maxLength={30}
                    disabled={formData.tags.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomTag}
                    disabled={
                      !formData.tagInput.trim() || formData.tags.length >= 5
                    }
                  >
                    Add
                  </Button>
                </div>
                {errors.tags && (
                  <p className="text-sm text-destructive">{errors.tags}</p>
                )}

                {/* Selected Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer focus:ring-0"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  id="isAnonymous"
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
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
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Story"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/stories")}
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

export default AddStory;
