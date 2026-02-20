import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subjectService } from "../services/subjectService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  BookOpen,
  Star,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Search,
  X,
  Plus,
  Eye,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

const RESOURCE_TYPES = [
  { value: "PDF", label: "PDF", icon: FileText },
  { value: "Image", label: "Image", icon: ImageIcon },
  { value: "Video", label: "Video", icon: Video },
  { value: "Link", label: "Link", icon: LinkIcon },
];

const Resources = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    subject: searchParams.get("subject") || "all",
    topic: searchParams.get("topic") || "all",
    type: searchParams.get("type") || "all",
    search: searchParams.get("search") || "",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResources, setTotalResources] = useState(0);

  // Rating modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedResourceForRating, setSelectedResourceForRating] =
    useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    if (filters.subject && filters.subject !== "all") {
      fetchTopics(filters.subject);
    } else {
      setTopics([]);
      setFilters((prev) => ({ ...prev, topic: "all" }));
    }
  }, [filters.subject]);

  // Fetch resources when filters or page changes
  useEffect(() => {
    fetchResources();
  }, [filters, page]);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (filters.subject && filters.subject !== "all")
      params.subject = filters.subject;
    if (filters.topic && filters.topic !== "all") params.topic = filters.topic;
    if (filters.type && filters.type !== "all") params.type = filters.type;
    if (filters.search) params.search = filters.search;
    setSearchParams(params);
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getSubjects();
      if (response.success && Array.isArray(response.data)) {
        setSubjects(response.data);
      } else {
        console.error("Invalid response format:", response);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
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
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });

      if (filters.subject) params.append("subject", filters.subject);
      if (filters.topic) params.append("topic", filters.topic);
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(
        `http://localhost:5000/api/resources?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data = await response.json();
      setResources(data.resources || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalResources(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError(error.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      subject: "",
      topic: "",
      type: "",
      search: "",
    });
    setPage(1);
  };

  const handleToggleSave = async (resourceId, isSaved) => {
    if (!token) {
      alert("Please login to save resources");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/resources/${resourceId}/save`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save resource");
      }

      // Update resource in list
      setResources((prev) =>
        prev.map((resource) =>
          resource._id === resourceId
            ? { ...resource, isSaved: !isSaved }
            : resource,
        ),
      );
    } catch (error) {
      console.error("Save resource error:", error);
      alert(error.message || "Failed to save resource");
    }
  };

  const handleOpenRatingModal = (resource) => {
    setSelectedResourceForRating(resource);
    setRatingValue(resource.userRating || 0);
    setRatingModalOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      alert("Please select a rating between 1 and 5");
      return;
    }

    setSubmittingRating(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/resources/${selectedResourceForRating._id}/rate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating: ratingValue }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to rate resource");
      }

      // Update resource in list
      setResources((prev) =>
        prev.map((resource) =>
          resource._id === selectedResourceForRating._id
            ? {
                ...resource,
                userRating: ratingValue,
                rating: data.rating,
              }
            : resource,
        ),
      );

      // Close modal
      setRatingModalOpen(false);
      setSelectedResourceForRating(null);
      setRatingValue(0);
    } catch (error) {
      console.error("Rate resource error:", error);
      alert(error.message || "Failed to rate resource");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleResourceClick = (resource) => {
    // Open resource based on type
    if (resource.type === "Link" || resource.type === "Video") {
      window.open(resource.content.externalLink, "_blank");
    } else if (resource.type === "PDF" || resource.type === "Image") {
      window.open(resource.content.url, "_blank");
    }
  };

  const getResourceIcon = (type) => {
    const resourceType = RESOURCE_TYPES.find((t) => t.value === type);
    return resourceType ? resourceType.icon : FileText;
  };

  const hasActiveFilters =
    filters.subject || filters.topic || filters.type || filters.search;

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Resources</h1>
            <p className="text-sm text-muted-foreground">
              {totalResources} resources for {user?.primaryExam}
            </p>
          </div>
          <Button
            onClick={() => navigate("/resources/add")}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Share Resource
          </Button>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden px-4 py-3 border-b border-border">
        <Button
          variant="outline"
          className="w-full rounded-full justify-between"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="primary" className="rounded-full text-xs">
                Active
              </Badge>
            )}
          </span>
          {showFilters ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex gap-6 px-4 py-4">
        {/* Filters Sidebar */}
        <div
          className={`${showFilters ? "block" : "hidden"} lg:block lg:w-72 flex-shrink-0`}
        >
          <div className="sidebar-card sticky top-20 p-4 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs h-7 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9 bg-secondary border-border rounded-xl"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Resource Type
              </Label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger className="bg-secondary border-border rounded-xl">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Subject</Label>
              <Select
                value={filters.subject}
                onValueChange={(value) => handleFilterChange("subject", value)}
              >
                <SelectTrigger className="bg-secondary border-border rounded-xl">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic Filter */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Topic</Label>
              <Select
                value={filters.topic}
                onValueChange={(value) => handleFilterChange("topic", value)}
                disabled={!filters.subject || loadingTopics}
              >
                <SelectTrigger className="bg-secondary border-border rounded-xl">
                  <SelectValue
                    placeholder={
                      !filters.subject ? "Select subject first" : "All topics"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic._id} value={topic._id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="feed-card mb-4 p-4 border-destructive/50">
              <div className="flex items-center text-destructive">
                <AlertCircle className="w-5 h-5 mr-2" />
                <p>{String(error)}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="feed-card p-4 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary"></div>
                    <div className="w-8 h-8 rounded-full bg-secondary"></div>
                  </div>
                  <div className="h-4 bg-secondary rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-secondary rounded w-full mb-2"></div>
                  <div className="h-3 bg-secondary rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No resources found
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Be the first to share a resource!"}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => navigate("/share-resource")}
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share Resource
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {resources.map((resource) => {
                  const ResourceIcon = getResourceIcon(resource.type);
                  return (
                    <article
                      key={resource._id}
                      className="feed-card p-4 hover:border-primary/50 transition-all"
                    >
                      <div className="space-y-3">
                        {/* Resource Icon and Type */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                              <ResourceIcon className="w-5 h-5 text-primary" />
                            </div>
                            <Badge
                              variant="secondary"
                              className="rounded-full text-xs"
                            >
                              {resource.type}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSave(resource._id, resource.isSaved);
                            }}
                            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
                          >
                            {resource.isSaved ? (
                              <BookmarkCheck className="w-4 h-4 text-primary" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        {/* Title */}
                        <h3
                          className="font-semibold text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleResourceClick(resource)}
                        >
                          {resource.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {resource.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className="rounded-full text-xs"
                          >
                            {resource.subjectName}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="rounded-full text-xs"
                          >
                            {resource.topicName}
                          </Badge>
                        </div>

                        {/* Rating and Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-1">
                            <Star
                              className={`w-4 h-4 ${
                                resource.userRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span className="text-sm font-medium text-foreground">
                              {resource.rating?.average?.toFixed(1) || "0.0"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({resource.rating?.count || 0})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRatingModal(resource);
                              }}
                              className="h-8 text-xs rounded-full hover:bg-primary/10 hover:text-primary"
                            >
                              {resource.userRating ? "Update" : "Rate"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResourceClick(resource)}
                              className="h-8 rounded-full"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-full"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-full"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="sidebar-card w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Rate Resource
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {selectedResourceForRating?.title}
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Your Rating</Label>
                <div className="flex items-center gap-2 justify-center py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= ratingValue
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {ratingValue === 0 && "Select a rating"}
                  {ratingValue === 1 && "Poor"}
                  {ratingValue === 2 && "Fair"}
                  {ratingValue === 3 && "Good"}
                  {ratingValue === 4 && "Very Good"}
                  {ratingValue === 5 && "Excellent"}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRatingModalOpen(false);
                    setSelectedResourceForRating(null);
                    setRatingValue(0);
                  }}
                  className="flex-1 rounded-full"
                  disabled={submittingRating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRating}
                  disabled={ratingValue === 0 || submittingRating}
                  className="flex-1 rounded-full"
                >
                  {submittingRating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Rating"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
