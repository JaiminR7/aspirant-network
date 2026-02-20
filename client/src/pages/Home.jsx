import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useExam } from "../context/ExamContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  BookOpen,
  Star,
  TrendingUp,
  Plus,
  ArrowRight,
  Image,
  Video,
  FileText,
  Calendar,
  Share2,
  Bookmark,
  MoreHorizontal,
  Heart,
  Repeat2,
  Sparkles,
  CheckCircle2,
  Download,
  ExternalLink,
  User,
  AlertCircle,
} from "lucide-react";

const Home = () => {
  const { user, getAuthHeader } = useAuth();
  const { currentExam } = useExam();
  const navigate = useNavigate();
  const location = useLocation();

  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postContent, setPostContent] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter feed items based on active filter
  const filteredItems = feedItems.filter((item) => {
    if (activeFilter === "all") return true;
    return item.postType === activeFilter;
  });

  const handleResourceView = async (resourceId, url, resourceType, title) => {
    if (!url) return;

    try {
      // Increment download count
      await fetch(
        `http://localhost:5000/api/resources/${resourceId}/download`,
        {
          method: "PATCH",
          headers: getAuthHeader(),
        },
      );

      // For PDFs, convert to preview URL that opens in browser
      if (resourceType === "PDF" && url.includes("cloudinary.com")) {
        const viewUrl = url.replace(
          "/raw/upload/",
          "/raw/upload/fl_attachment:false/",
        );
        window.open(viewUrl, "_blank");
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error viewing resource:", error);
    }
  };

  const handleResourceDownload = async (
    resourceId,
    url,
    resourceType,
    title,
  ) => {
    if (!url) return;

    try {
      // Increment download count
      await fetch(
        `http://localhost:5000/api/resources/${resourceId}/download`,
        {
          method: "PATCH",
          headers: getAuthHeader(),
        },
      );

      // For PDFs, ensure proper download with .pdf extension
      if (resourceType === "PDF" && url.includes("cloudinary.com")) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error downloading resource:", error);
    }
  };

  useEffect(() => {
    fetchFeedData();
  }, []);

  // Refetch data when navigating back to home page
  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/home") {
      fetchFeedData();
    }
  }, [location.pathname]);

  // Refetch data when the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchFeedData();
      }
    };

    const handleFocus = () => {
      fetchFeedData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchFeedData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [questionsRes, resourcesRes, storiesRes] = await Promise.allSettled(
        [
          fetch(
            "http://localhost:5000/api/questions?limit=10&sortBy=-createdAt",
            {
              headers: getAuthHeader(),
            },
          ),
          fetch(
            "http://localhost:5000/api/resources?limit=10&sortBy=-createdAt",
            {
              headers: getAuthHeader(),
            },
          ),
          fetch(
            "http://localhost:5000/api/stories?limit=10&sortBy=-createdAt",
            {
              headers: getAuthHeader(),
            },
          ),
        ],
      );

      const allItems = [];

      // Add questions with postType
      if (questionsRes.status === "fulfilled" && questionsRes.value.ok) {
        const questionsData = await questionsRes.value.json();
        const questions = (questionsData.data || []).map((q) => ({
          ...q,
          postType: "question",
        }));
        allItems.push(...questions);
      }

      // Add resources with postType
      if (resourcesRes.status === "fulfilled" && resourcesRes.value.ok) {
        const resourcesData = await resourcesRes.value.json();
        const resources = (resourcesData.data || []).map((r) => ({
          ...r,
          postType: "resource",
        }));
        allItems.push(...resources);
      }

      // Add stories with postType
      if (storiesRes.status === "fulfilled" && storiesRes.value.ok) {
        const storiesData = await storiesRes.value.json();
        const stories = (storiesData.data || []).map((s) => ({
          ...s,
          postType: "story",
        }));
        allItems.push(...stories);
      }

      // Sort all items by createdAt in descending order
      allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setFeedItems(allItems);
    } catch (err) {
      console.error("Error fetching feed data:", err);
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto"></div>
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading your feed...</p>
        </div>
      </div>
    );
  }

  const filterOptions = [
    { value: "all", label: "All", icon: Sparkles },
    { value: "question", label: "Questions", icon: MessageSquare },
    { value: "resource", label: "Resources", icon: BookOpen },
    { value: "story", label: "Stories", icon: FileText },
  ];

  return (
    <div className="min-h-screen py-6">
      {/* Page Header */}
      <div className="px-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Home Feed</h1>
        <p className="text-sm text-muted-foreground">
          Stay updated with questions, resources, and success stories
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  activeFilter === option.value
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Unified Feed */}
      <section>
        {filteredItems.length === 0 ? (
          <div className="mx-6 text-center py-12">
            <p className="text-muted-foreground text-sm">
              {feedItems.length === 0
                ? "Your feed is empty."
                : `No ${activeFilter === "all" ? "posts" : activeFilter + "s"} found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-6">
            {filteredItems.map((item) => {
              // Render based on post type
              if (item.postType === "question") {
                return (
                  <article
                    key={`question-${item._id}`}
                    className="content-card hover-lift animate-fade-in"
                  >
                    <div className="flex gap-4">
                      <div className="avatar h-11 w-11 flex-shrink-0 text-base">
                        {item.createdBy?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Post Type Badge */}
                        <div className="mb-2">
                          <Badge className="rounded-full text-xs px-3 py-1 bg-primary/10 text-primary border-0 font-medium">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Question
                          </Badge>
                        </div>

                        {/* Author Info */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">
                            {item.createdBy?.name || "Anonymous"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            @{item.createdBy?.username || "anonymous"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            ·
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Question Content */}
                        <Link to={`/questions/${item._id}`}>
                          <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                              {item.description}
                            </p>
                          )}
                        </Link>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.subjectName && (
                            <Badge className="rounded-full text-xs px-3 py-1 bg-blue-50 text-blue-600 border-0 font-medium">
                              {item.subjectName}
                            </Badge>
                          )}
                          {item.topicName && (
                            <Badge className="rounded-full text-xs px-3 py-1 bg-green-50 text-green-600 border-0 font-medium">
                              {item.topicName}
                            </Badge>
                          )}
                          {item.isSolved && (
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
                            <span>{item.upvotes?.length || 0}</span>
                          </button>
                          <button className="metric-item group">
                            <MessageSquare className="h-4 w-4 group-hover:fill-current group-hover:text-primary transition-all" />
                            <span>{item.answerCount || 0}</span>
                          </button>
                          <div className="metric-item">
                            <Eye className="h-4 w-4" />
                            <span>{item.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              } else if (item.postType === "resource") {
                // Generate PDF thumbnail URL from Cloudinary
                const getPdfThumbnail = (url) => {
                  if (!url || item.type !== "PDF") return null;
                  return url
                    .replace(
                      "/raw/upload/",
                      "/image/upload/pg_1,w_200,h_150,c_fill,f_jpg/",
                    )
                    .replace(".pdf", ".pdf.jpg");
                };

                const thumbnailUrl =
                  item.type === "PDF"
                    ? getPdfThumbnail(item.content?.url)
                    : null;

                return (
                  <article
                    key={`resource-${item._id}`}
                    className="content-card animate-fade-in cursor-pointer hover:border-primary/50 transition-all"
                    onClick={(e) => {
                      // Don't navigate if clicking on download button
                      if (e.target.closest("button")) return;
                      navigate(`/resources/${item._id}`);
                    }}
                  >
                    {/* Post Type Badge & Author Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {item.createdBy?.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="rounded-full text-xs px-3 py-1 bg-secondary/20 text-secondary border-0 font-medium mb-2">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Resource
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {item.createdBy?.name || "Anonymous"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            @{item.createdBy?.username || "user"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            ·
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge className="rounded-full text-xs px-3 py-1">
                        {item.type}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* PDF/Image Preview Thumbnail */}
                      {(item.type === "PDF" || item.type === "Image") &&
                        item.content?.url && (
                          <div
                            className="flex-shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.type === "PDF") {
                                handleResourceView(
                                  item._id,
                                  item.content.url,
                                  item.type,
                                  item.title,
                                );
                              }
                            }}
                          >
                            {item.type === "PDF" && thumbnailUrl ? (
                              <div className="w-24 h-24 rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden hover:border-primary transition-colors">
                                <img
                                  src={thumbnailUrl}
                                  alt={`${item.title} preview`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      <span class="text-[10px] font-medium mt-1">PDF</span>
                                    </div>
                                  `;
                                  }}
                                />
                              </div>
                            ) : item.type === "Image" ? (
                              <div className="w-24 h-24 rounded-lg overflow-hidden border">
                                <img
                                  src={item.content.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : null}
                          </div>
                        )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground hover:text-primary transition-colors mb-2">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {(item.subjectName || item.topicName) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.subjectName && (
                          <Badge className="rounded-full text-xs px-3 py-1 bg-blue-50 text-blue-600 border-0 font-medium">
                            {item.subjectName}
                          </Badge>
                        )}
                        {item.topicName && (
                          <Badge className="rounded-full text-xs px-3 py-1 bg-green-50 text-green-600 border-0 font-medium">
                            {item.topicName}
                          </Badge>
                        )}
                        {item.isVerified && (
                          <Badge className="rounded-full text-xs px-2 py-0.5 bg-green-500/10 text-green-600 border-0">
                            Verified
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Metrics & Actions */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>
                            {item.rating?.average?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        <div className="metric-item">
                          <Bookmark className="h-4 w-4" />
                          <span>{item.savedBy?.length || 0}</span>
                        </div>
                        <div className="metric-item">
                          <Eye className="h-4 w-4" />
                          <span>{item.viewCount || 0}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResourceDownload(
                            item._id,
                            item.content?.url || item.content?.externalLink,
                            item.type,
                            item.title,
                          );
                        }}
                        className="text-xs"
                      >
                        {item.type === "Link" || item.type === "Video" ? (
                          <>
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Open
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </article>
                );
              } else if (item.postType === "story") {
                return (
                  <article
                    key={`story-${item._id}`}
                    className="content-card hover-lift animate-fade-in"
                  >
                    <Link to={`/stories/${item._id}`} className="block">
                      {/* Post Type Badge */}
                      <div className="mb-3">
                        <Badge className="rounded-full text-xs px-3 py-1 bg-accent/10 text-accent border-0 font-medium">
                          <FileText className="h-3 w-3 mr-1" />
                          Story
                        </Badge>
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div className="avatar h-10 w-10 text-sm flex-shrink-0">
                          {item.author?.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            {item.author?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.content}
                      </p>
                    </Link>
                  </article>
                );
              }

              return null;
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
