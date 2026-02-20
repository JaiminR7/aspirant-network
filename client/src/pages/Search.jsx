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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Search as SearchIcon,
  MessageSquare,
  BookOpen,
  FileText,
  Star,
  ThumbsUp,
  Eye,
  CheckCircle2,
  X,
  Filter,
  Bookmark,
  ExternalLink,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "all", label: "All", icon: SearchIcon },
  { value: "questions", label: "Questions", icon: MessageSquare },
  { value: "resources", label: "Resources", icon: BookOpen },
  { value: "stories", label: "Stories", icon: FileText },
];

const Search = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [contentType, setContentType] = useState(
    searchParams.get("type") || "all",
  );
  const [filters, setFilters] = useState({
    subject: searchParams.get("subject") || "all",
    topic: searchParams.get("topic") || "all",
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
  });

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [results, setResults] = useState({
    questions: [],
    resources: [],
    stories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

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

  // Auto-search if query param exists on mount
  useEffect(() => {
    if (searchParams.get("q")) {
      handleSearch();
    }
  }, []);

  const fetchSubjects = async () => {
    try {
      // TODO: Replace with actual API endpoint when implemented
      const mockSubjects = [
        { _id: "1", name: "Mathematics" },
        { _id: "2", name: "Physics" },
        { _id: "3", name: "Chemistry" },
        { _id: "4", name: "Biology" },
        { _id: "5", name: "English" },
      ];
      setSubjects(mockSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      setLoadingTopics(true);
      // TODO: Replace with actual API endpoint when implemented
      const mockTopics = {
        1: [
          { _id: "t1", name: "Algebra" },
          { _id: "t2", name: "Calculus" },
          { _id: "t3", name: "Geometry" },
        ],
        2: [
          { _id: "t4", name: "Mechanics" },
          { _id: "t5", name: "Thermodynamics" },
          { _id: "t6", name: "Optics" },
        ],
        3: [
          { _id: "t7", name: "Organic Chemistry" },
          { _id: "t8", name: "Inorganic Chemistry" },
          { _id: "t9", name: "Physical Chemistry" },
        ],
        4: [
          { _id: "t10", name: "Botany" },
          { _id: "t11", name: "Zoology" },
          { _id: "t12", name: "Genetics" },
        ],
        5: [
          { _id: "t13", name: "Grammar" },
          { _id: "t14", name: "Vocabulary" },
          { _id: "t15", name: "Reading Comprehension" },
        ],
      };
      setTopics(mockTopics[subjectId] || []);
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        query: searchQuery.trim(),
      });

      if (filters.subject) params.append("subject", filters.subject);
      if (filters.topic) params.append("topic", filters.topic);
      if (filters.tags.length > 0)
        params.append("tags", filters.tags.join(","));

      // Update URL
      const urlParams = new URLSearchParams({
        q: searchQuery.trim(),
        type: contentType,
      });
      if (filters.subject) urlParams.append("subject", filters.subject);
      if (filters.topic) urlParams.append("topic", filters.topic);
      if (filters.tags.length > 0)
        urlParams.append("tags", filters.tags.join(","));
      setSearchParams(urlParams);

      let endpoint = "http://localhost:5000/api/search";

      // Choose endpoint based on content type
      if (contentType === "questions") {
        endpoint = "http://localhost:5000/api/search/questions";
      } else if (contentType === "resources") {
        endpoint = "http://localhost:5000/api/search/resources";
      } else if (contentType === "stories") {
        endpoint = "http://localhost:5000/api/search/stories";
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      // Handle different response structures
      if (contentType === "all") {
        setResults({
          questions: data.questions || [],
          resources: data.resources || [],
          stories: data.stories || [],
        });
        setTotalResults(
          (data.questions?.length || 0) +
            (data.resources?.length || 0) +
            (data.stories?.length || 0),
        );
      } else {
        setResults({
          questions: contentType === "questions" ? data.questions || [] : [],
          resources: contentType === "resources" ? data.resources || [] : [],
          stories: contentType === "stories" ? data.stories || [] : [],
        });
        setTotalResults(
          data.questions?.length ||
            data.resources?.length ||
            data.stories?.length ||
            0,
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error.message || "Failed to perform search");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddTag = (tag) => {
    if (tag && !filters.tags.includes(tag)) {
      setFilters((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      subject: "",
      topic: "",
      tags: [],
    });
  };

  const hasActiveFilters =
    filters.subject || filters.topic || filters.tags.length > 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SearchIcon className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Search</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {showMobileFilters ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search questions, resources, and stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-secondary border-border rounded-full text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="submit"
              className="h-11 px-6 rounded-full"
              disabled={loading}
            >
              {loading ? "..." : "Search"}
            </Button>
          </div>
        </form>

        {/* Content Type Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {CONTENT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                variant={contentType === type.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setContentType(type.value)}
                className={`whitespace-nowrap rounded-full ${
                  contentType === type.value
                    ? ""
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {type.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex">
        {/* Filters Sidebar */}
        <div
          className={`${showMobileFilters ? "block" : "hidden"} lg:block lg:w-80 p-4 border-r border-border`}
        >
          <div className="sidebar-card">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Filters</h3>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Subject Filter */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Subject</Label>
                <Select
                  value={filters.subject}
                  onValueChange={(value) =>
                    handleFilterChange("subject", value)
                  }
                >
                  <SelectTrigger className="bg-secondary border-border rounded-xl text-foreground">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
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
                <Label className="text-sm text-muted-foreground">Topic</Label>
                <Select
                  value={filters.topic}
                  onValueChange={(value) => handleFilterChange("topic", value)}
                  disabled={!filters.subject || loadingTopics}
                >
                  <SelectTrigger className="bg-secondary border-border rounded-xl text-foreground">
                    <SelectValue
                      placeholder={
                        !filters.subject ? "Select subject first" : "All topics"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All topics</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic._id} value={topic._id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tags</Label>
                <Input
                  placeholder="Add tag and press Enter..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(e.target.value.trim());
                      e.target.value = "";
                    }
                  }}
                  className="bg-secondary border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                />
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 p-4">
          {error && (
            <div className="feed-card mb-4 border-red-500/50">
              <div className="flex items-center text-red-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                <p>{String(error)}</p>
              </div>
            </div>
          )}

          {!hasSearched && !loading && (
            <div className="feed-card text-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start Your Search
              </h3>
              <p className="text-muted-foreground">
                Enter keywords to find questions, resources, and stories
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="feed-card animate-pulse">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-secondary rounded w-full mb-2"></div>
                  <div className="h-3 bg-secondary rounded w-2/3"></div>
                </div>
              ))}
            </div>
          )}

          {hasSearched && !loading && totalResults === 0 && (
            <div className="feed-card text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No results found
              </h3>
              <p className="text-muted-foreground">
                Try different keywords or adjust your filters
              </p>
            </div>
          )}

          {hasSearched && !loading && totalResults > 0 && (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Found{" "}
                <span className="font-semibold text-foreground">
                  {totalResults}
                </span>{" "}
                results for "
                <span className="font-semibold text-foreground">
                  {searchQuery}
                </span>
                "
              </p>

              {/* Questions Section */}
              {(contentType === "all" || contentType === "questions") &&
                results.questions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-bold text-foreground">
                        Questions ({results.questions.length})
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {results.questions.map((question) => (
                        <div
                          key={question._id}
                          className="feed-card hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/questions/${question._id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {question.isSolved ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                              ) : (
                                <MessageSquare className="w-5 h-5 text-orange-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground mb-1 line-clamp-2 hover:text-primary">
                                {question.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {question.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {question.subjectName}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.topicName}
                                </Badge>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {question.upvotes || 0}
                                </div>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {question.totalAnswers || 0}
                                </div>
                                <span className="text-border">•</span>
                                <span>{formatDate(question.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Resources Section */}
              {(contentType === "all" || contentType === "resources") &&
                results.resources.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-bold text-foreground">
                        Resources ({results.resources.length})
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {results.resources.map((resource) => (
                        <div
                          key={resource._id}
                          className="feed-card hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() =>
                            window.open(
                              resource.content?.externalLink ||
                                resource.content?.url,
                              "_blank",
                            )
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <BookOpen className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-foreground mb-1 line-clamp-2 hover:text-primary">
                                  {resource.title}
                                </h3>
                                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {resource.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  {resource.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {resource.subjectName}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {resource.topicName}
                                </Badge>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {resource.rating?.average?.toFixed(1) ||
                                    "0.0"}
                                </div>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1">
                                  <Bookmark className="w-3 h-3" />
                                  {resource.saveCount || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Stories Section */}
              {(contentType === "all" || contentType === "stories") &&
                results.stories.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <FileText className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-bold text-foreground">
                        Stories ({results.stories.length})
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {results.stories.map((story) => (
                        <div
                          key={story._id}
                          className="feed-card hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/stories/${story._id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <FileText className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground mb-1 line-clamp-2 hover:text-primary">
                                {story.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {story.content}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  By {story.author?.username || "Anonymous"}
                                </span>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {story.upvotes || 0}
                                </div>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {story.views || 0}
                                </div>
                                <span className="text-border">•</span>
                                <span>{formatDate(story.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
