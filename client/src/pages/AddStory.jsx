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
import { pushPendingFeedPost } from "../utils/feedOptimistic";
import { STORY_TYPES } from "../constants/appConstants";

const CREATE_STORY_TYPES = STORY_TYPES.filter(t => t.value !== 'all');

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

  // Respect the user's anonymous posting privacy setting
  const canPostAnonymously = user?.privacy?.allowAnonymousPosting ?? false;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    storyType: "",
    tags: [],
    tagInput: "",
    result: "",
    isAnonymous: false,
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
    } else if (formData.content.trim().length < 30) {
      newErrors.content = "Content must be at least 30 characters";
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
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        storyType: formData.storyType,
        tags: formData.tags,
        isAnonymous: formData.isAnonymous,
        result: formData.result.trim() || undefined,
      };

      const data = await storyService.create(payload);

      const optimisticPost =
        data.feedPost || {
          _id: data?.postId,
          type: "story",
          exam: user?.examPreference || user?.primaryExam,
          title: payload.title,
          description: payload.excerpt || payload.content,
          tags: payload.tags || [],
          isAnonymous: Boolean(payload.isAnonymous),
          author: payload.isAnonymous
            ? {
                name: "Anonymous",
                username: "anonymous",
                profilePicture: null,
                avatar: null,
              }
            : {
                name: user?.name,
                username: user?.username,
                profilePicture: user?.profilePicture || null,
              },
          userId: payload.isAnonymous
            ? {
                name: "Anonymous",
                username: "anonymous",
                profilePicture: null,
                avatar: null,
              }
            : {
                name: user?.name,
                username: user?.username,
                profilePicture: user?.profilePicture || null,
              },
          likesCount: 0,
          dislikesCount: 0,
          commentsCount: 0,
          userInteraction: "none",
          userVoteStatus: "none",
          createdAt: new Date().toISOString(),
        };

      pushPendingFeedPost(optimisticPost);

      navigate("/");
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
      formData.content.trim().length >= 30 &&
      formData.storyType
    );
  };

  const getValidationMessage = () => {
    if (formData.title.trim().length < 10) {
      return `Title needs ${10 - formData.title.trim().length} more characters`;
    }
    if (formData.content.trim().length < 30) {
      return `Content needs ${30 - formData.content.trim().length} more characters`;
    }
    if (!formData.storyType) {
      return "Please select a story type";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
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
                    {CREATE_STORY_TYPES.map((type) => (
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
                    ({formData.content.length} characters, min 30)
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
              <div className="flex flex-col gap-1">
                <div className="flex items-center space-x-2">
                  <input
                    id="isAnonymous"
                    type="checkbox"
                    name="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleChange}
                    disabled={!canPostAnonymously}
                    className="h-4 w-4 rounded border-border bg-background disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <Label
                    htmlFor="isAnonymous"
                    className={`text-sm font-normal ${
                      canPostAnonymously
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    Post anonymously
                  </Label>
                </div>
                {!canPostAnonymously && (
                  <p className="text-xs text-muted-foreground pl-6">
                    Enable anonymous posting in{" "}
                    <a
                      href="/settings"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Privacy Settings
                    </a>{" "}
                    to use this option.
                  </p>
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
                      "Publish Story"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    disabled={loading}
                    className="focus:ring-0"
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
