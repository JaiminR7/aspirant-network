import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  FileText,
  ThumbsUp,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  User,
  Plus,
  AlertCircle,
  Filter,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const STORY_TYPES = [
  { value: "all", label: "All Stories" },
  { value: "Success", label: "Success Stories" },
  { value: "Journey", label: "Journey Stories" },
  { value: "Tips", label: "Tips & Advice" },
  { value: "Experience", label: "Experiences" },
  { value: "Motivation", label: "Motivation" },
];

const Stories = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [storyType, setStoryType] = useState(searchParams.get("type") || "all");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "-createdAt",
  );

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStories, setTotalStories] = useState(0);

  // Fetch stories when filters or page changes
  useEffect(() => {
    fetchStories();
  }, [storyType, sortBy, page]);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (storyType !== "all") params.type = storyType;
    if (sortBy !== "-createdAt") params.sortBy = sortBy;
    setSearchParams(params);
  }, [storyType, sortBy]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sortBy: sortBy,
      });

      if (storyType !== "all") {
        params.append("type", storyType);
      }

      const response = await fetch(
        `http://localhost:5000/api/stories?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }

      const data = await response.json();
      setStories(data.stories || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalStories(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setError(error.message || "Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (storyId) => {
    navigate(`/stories/${storyId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStoryTypeColor = (type) => {
    const colors = {
      Success: "bg-green-500/10 text-green-400 border-green-500/20",
      Journey: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Tips: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      Experience: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      Motivation: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };
    return colors[type] || "bg-muted text-muted-foreground border-border";
  };

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Success Stories
              </h1>
              <p className="text-sm text-muted-foreground">
                {totalStories} inspiring stories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={() => navigate("/share-story")}
              className="rounded-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Story
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="flex flex-wrap gap-3 py-2">
            {/* Type Filter */}
            <Select value={storyType} onValueChange={setStoryType}>
              <SelectTrigger className="w-[160px] bg-secondary border-border rounded-full text-foreground">
                <SelectValue placeholder="All stories" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {STORY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-secondary border-border rounded-full text-foreground">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="-createdAt">Most Recent</SelectItem>
                <SelectItem value="createdAt">Oldest First</SelectItem>
                <SelectItem value="-upvotes">Most Liked</SelectItem>
                <SelectItem value="-views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Error Message */}
        {error && (
          <div className="feed-card mb-4 border-red-500/50">
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="feed-card animate-pulse">
                <div className="h-4 bg-secondary rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-secondary rounded w-full mb-2"></div>
                <div className="h-3 bg-secondary rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="feed-card text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No stories found
            </h3>
            <p className="text-muted-foreground mb-4">
              {storyType !== "all"
                ? "Try selecting a different story type"
                : "Be the first to share your story!"}
            </p>
            {storyType === "all" && (
              <Button
                onClick={() => navigate("/share-story")}
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Share Your Story
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story) => (
                <div
                  key={story._id}
                  className="feed-card hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => handleStoryClick(story._id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant="outline"
                      className={`${getStoryTypeColor(story.type)} border`}
                    >
                      {story.type}
                    </Badge>
                    {story.isFeatured && (
                      <Badge className="bg-primary/20 text-primary border-0">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2 hover:text-primary mb-2">
                    {story.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {story.content}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span>{story.author?.username || "Unknown"}</span>
                    <span className="text-border">•</span>
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(story.createdAt)}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{story.upvotes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{story.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{story.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full"
                  size="icon"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-full"
                  size="icon"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Stories;
