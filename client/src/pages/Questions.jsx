import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  X,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

const Questions = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    subject: searchParams.get("subject") || "all",
    topic: searchParams.get("topic") || "all",
    solved: searchParams.get("solved") || "all",
    search: searchParams.get("search") || "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

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

  // Fetch questions when filters or page changes
  useEffect(() => {
    fetchQuestions();
  }, [filters, page]);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (filters.subject && filters.subject !== "all")
      params.subject = filters.subject;
    if (filters.topic && filters.topic !== "all") params.topic = filters.topic;
    if (filters.solved !== "all") params.solved = filters.solved;
    if (filters.search) params.search = filters.search;
    setSearchParams(params);
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      const mockSubjects = [
        { _id: "1", name: "Mathematics" },
        { _id: "2", name: "Physics" },
        { _id: "3", name: "Chemistry" },
        { _id: "4", name: "Biology" },
        { _id: "5", name: "English" },
      ];
      setSubjects(mockSubjects);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const fetchTopics = async (subjectId) => {
    setLoadingTopics(true);
    try {
      const mockTopics = [
        { _id: "t1", name: "Algebra", subjectId },
        { _id: "t2", name: "Calculus", subjectId },
        { _id: "t3", name: "Geometry", subjectId },
      ];
      setTopics(mockTopics);
    } catch (err) {
      console.error("Error fetching topics:", err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy: "-createdAt",
      });

      if (filters.subject !== "all") params.append("subject", filters.subject);
      if (filters.topic !== "all") params.append("topic", filters.topic);
      if (filters.search) params.append("search", filters.search);
      if (filters.solved !== "all") {
        params.append("solved", filters.solved === "solved" ? "true" : "false");
      }

      const response = await fetch(
        `http://localhost:5000/api/questions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();
      setQuestions(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalQuestions(data.pagination?.total || 0);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      subject: "all",
      topic: "all",
      solved: "all",
      search: "",
    });
    setPage(1);
  };

  const hasActiveFilters =
    filters.subject !== "all" ||
    filters.topic !== "all" ||
    filters.solved !== "all" ||
    filters.search;

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      {/* Page Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Questions
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalQuestions} questions • Page {page} of {totalPages}
            </p>
          </div>
          <Button
            onClick={() => navigate("/ask")}
            className="rounded-lg px-5 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ask Question
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search questions..."
            className="pl-12 pr-4 py-6 text-base rounded-xl border-2 focus:border-primary"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg font-medium hover:bg-transparent ${showFilters ? "bg-primary/10 border-primary text-primary" : ""}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-white text-xs">
                {
                  [
                    filters.subject !== "all",
                    filters.topic !== "all",
                    filters.solved !== "all",
                    filters.search,
                  ].filter(Boolean).length
                }
              </Badge>
            )}
          </Button>

          {/* Quick Filters */}
          <Select
            value={filters.solved}
            onValueChange={(value) => handleFilterChange("solved", value)}
          >
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Questions</SelectItem>
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="unsolved">Unsolved</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-lg text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-5 bg-muted/30 rounded-xl space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Subject
                </label>
                <Select
                  value={filters.subject}
                  onValueChange={(value) =>
                    handleFilterChange("subject", value)
                  }
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Topic
                </label>
                <Select
                  value={filters.topic}
                  onValueChange={(value) => handleFilterChange("topic", value)}
                  disabled={filters.subject === "all" || loadingTopics}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
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
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="mx-6 content-card text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No questions found
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {hasActiveFilters
              ? "Try adjusting your filters or search terms"
              : "Be the first to ask a question!"}
          </p>
          {hasActiveFilters ? (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="rounded-lg"
            >
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => navigate("/ask")} className="rounded-lg">
              <Plus className="h-4 w-4 mr-2" />
              Ask a Question
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4 px-6">
          {questions.map((question) => (
            <article
              key={question._id}
              className="content-card hover-lift animate-fade-in"
            >
              <div className="flex gap-4">
                <div className="avatar h-11 w-11 flex-shrink-0 text-base">
                  {question.createdBy?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Author Info */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">
                      {question.createdBy?.name || "Anonymous"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      @{question.createdBy?.username || "anonymous"}
                    </span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Question Content */}
                  <Link to={`/questions/${question._id}`}>
                    <h3 className="font-semibold text-foreground text-base mb-2 hover:text-primary transition-colors">
                      {question.title}
                    </h3>
                    {question.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {question.description}
                      </p>
                    )}
                  </Link>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.subjectName && (
                      <Badge className="rounded-full text-xs px-3 py-1 bg-blue-50 text-blue-600 border-0 font-medium">
                        {question.subjectName}
                      </Badge>
                    )}
                    {question.topicName && (
                      <Badge className="rounded-full text-xs px-3 py-1 bg-green-50 text-green-600 border-0 font-medium">
                        {question.topicName}
                      </Badge>
                    )}
                    {question.isSolved && (
                      <Badge className="rounded-full text-xs px-3 py-1 bg-emerald-50 text-emerald-600 border-0 font-medium">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Solved
                      </Badge>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 text-sm">
                    <button className="metric-item group">
                      <ThumbsUp className="h-4 w-4 group-hover:fill-current group-hover:text-primary transition-all" />
                      <span>{question.upvotes?.length || 0}</span>
                    </button>
                    <button className="metric-item group">
                      <MessageSquare className="h-4 w-4 group-hover:fill-current group-hover:text-primary transition-all" />
                      <span>{question.answerCount || 0}</span>
                    </button>
                    <div className="metric-item">
                      <Eye className="h-4 w-4" />
                      <span>{question.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pb-8 px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                  className="rounded-lg w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <span className="text-muted-foreground px-2">...</span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="rounded-lg"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Questions;
