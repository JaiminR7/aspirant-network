import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";
import {
  User,
  Award,
  TrendingUp,
  MessageSquare,
  BookOpen,
  ThumbsUp,
  Calendar,
  Target,
  Lock,
  CheckCircle,
  AlertCircle,
  Heart,
  Settings,
  Link as LinkIcon,
  MapPin,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Bookmark,
} from "lucide-react";
import { postsService } from "../services/postsService";
import { userService } from "../services/userService";
import { questionService } from "../services/questionService";
import { resourceService } from "../services/resourceService";
import { storyService } from "../services/storyService";
import { formatDate } from "../utils/dateUtils";

const ACTIVITY_TABS = [
  { id: "questions", label: "Questions", icon: MessageSquare },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "stories", label: "Stories", icon: Heart },
  { id: "saved", label: "Saved", icon: Bookmark, private: true },
];

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token, logout } = useAuth();
  const { addToast } = useToast();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Activity state
  const [activeTab, setActiveTab] = useState("questions");
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [savedFilter, setSavedFilter] = useState("all");

  // Stats counts
  const [questionCount, setQuestionCount] = useState(0);
  const [resourceCount, setResourceCount] = useState(0);
  const [storyCount, setStoryCount] = useState(0);

  // If no username in URL, use current user's username
  const targetUsername = username || currentUser?.username;
  const isOwnProfile = currentUser?.username === targetUsername;

  // Fetch profile data
  useEffect(() => {
    if (targetUsername) {
      fetchProfile();
    }
  }, [targetUsername]);

  // Fetch activity when tab changes
  useEffect(() => {
    if (
      profileUser &&
      (profileUser.privacy?.activityVisibility || isOwnProfile)
    ) {
      fetchActivity();
    }
  }, [activeTab, profileUser, savedFilter]);

  // Fetch counts for all tabs when profile loads
  useEffect(() => {
    if (
      profileUser &&
      (profileUser.privacy?.activityVisibility || isOwnProfile)
    ) {
      fetchAllCounts();
    }
  }, [profileUser]);

  const fetchAllCounts = async () => {
    if (!currentUser) return;
    const userId = profileUser?._id || currentUser?._id;
    if (!userId) return;

    try {
      // Fetch counts for all tabs in parallel using centralized services
      const [questionsData, resourcesData, storiesData] =
        await Promise.all([
          questionService.getQuestions({ createdBy: userId, limit: 1 }),
          resourceService.getResources({ uploadedBy: userId, limit: 1 }),
          storyService.getStories({ author: userId, limit: 1 }),
        ]);

      setQuestionCount(
        questionsData.pagination?.total ?? questionsData.data?.length ?? 0,
      );
      setResourceCount(
        resourcesData.pagination?.total ?? resourcesData.data?.length ?? 0,
      );
      setStoryCount(
        storiesData.pagination?.total ?? storiesData.data?.length ?? 0,
      );
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const fetchProfile = async () => {
    if (!currentUser && !username) return;
    try {
      setLoading(true);
      setError(null);

      // For now, use current user data if viewing own profile
      // TODO: Replace with actual API endpoint when backend is ready
      if (isOwnProfile && currentUser) {
        setProfileUser(currentUser);
        setLoading(false);
        return;
      }

      // Try to fetch from API for other users' profiles
      const data = await userService.getProfile(targetUsername);
      setProfileUser(data.user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    if (!currentUser) return;
    try {
      setActivityLoading(true);

      const userId = profileUser?._id || currentUser?._id;
      console.log("📊 Fetching activity for tab:", activeTab);
      console.log("👤 User ID:", userId);
      console.log("👤 Profile User:", profileUser);
      console.log("👤 Current User:", currentUser);

      if (!userId) {
        console.error("❌ No user ID available");
        setActivityData([]);
        return;
      }

      let data;
      const params = { limit: 50 }; // Get recent activity
      
      switch (activeTab) {
        case "questions":
          data = await questionService.getQuestions({ createdBy: userId, ...params });
          break;
        case "resources":
          data = await resourceService.getResources({ uploadedBy: userId, ...params });
          break;
        case "stories":
          data = await storyService.getStories({ author: userId, ...params });
          break;
        case "saved":
          const savedData = await postsService.getSavedPosts(savedFilter);
          setActivityData(savedData.data || []);
          setActivityLoading(false);
          return;
        default:
          return;
      }

      setActivityData(data.data || []);
    } catch (error) {
      console.error("Error fetching activity:", error);
      setActivityData([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDelete = async (itemId, e) => {
    e.stopPropagation();
    console.log(`[handleDelete] Action on item: ${itemId}, Tab: ${activeTab}`);

    try {
      if (activeTab === "saved") {
        console.log(`[handleDelete] Unsaving post: ${itemId}`);
        await postsService.unsavePost(itemId);
        setActivityData((prev) => {
          const next = prev.filter((item) => item._id !== itemId);
          console.log(`[handleDelete] New state count: ${next.length}`);
          return next;
        });
        addToast({
          title: "Removed from library",
          description: "This item has been removed from your saved list.",
          variant: "default",
          duration: 3000,
        });
        return;
      }

      switch (activeTab) {
        case "questions":
          await questionService.delete(itemId);
          break;
        case "resources":
          await resourceService.delete(itemId);
          break;
        case "stories":
          await storyService.delete(itemId);
          break;
        default:
          return;
      }

      // Remove item from state
      setActivityData((prev) => prev.filter((item) => item._id !== itemId));

      // Update count after deletion
      switch (activeTab) {
        case "questions":
          setQuestionCount((prev) => Math.max(0, prev - 1));
          break;
        case "resources":
          setResourceCount((prev) => Math.max(0, prev - 1));
          break;
        case "stories":
          setStoryCount((prev) => Math.max(0, prev - 1));
          break;
      }

      addToast({
        title: "Deleted successfully",
        description: `Your ${activeTab.slice(0, -1)} has been deleted.`,
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      addToast({
        title: "Action failed",
        description: `Failed to ${activeTab === "saved" ? "unsave" : "delete"}. Please try again.`,
        variant: "error",
        duration: 3000,
      });
    }
  };

  const handleMarkSolved = async (questionId, currentStatus, e) => {
    e.stopPropagation();

    const action = currentStatus ? "unmark" : "mark";

    try {
      await questionService.toggleSolve(questionId);

      // Update the question in state
      setActivityData((prev) =>
        prev.map((item) =>
          item._id === questionId
            ? { ...item, isSolved: !currentStatus }
            : item,
        ),
      );

      addToast({
        title: currentStatus ? "Unmarked as solved" : "Marked as solved",
        description: currentStatus
          ? "Question has been unmarked as solved."
          : "Question has been marked as solved.",
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error marking question:", error);
      addToast({
        title: "Update failed",
        description: error.message || "Failed to update question.",
        variant: "error",
        duration: 3000,
      });
    }
  };

  const resolveOwnerId = (item) => {
    if (!item) return null;
    if (typeof item.user === "string") return item.user;
    if (typeof item.createdBy === "string") return item.createdBy;
    if (item.user?._id) return item.user._id;
    if (item.createdBy?._id) return item.createdBy._id;
    return null;
  };

  const canDeleteItem = (item) => {
    if (!isOwnProfile) return false;
    if (activeTab !== "resources") return true;
    const ownerId = resolveOwnerId(item);
    return !!ownerId && ownerId === currentUser?._id;
  };


  const getCredibilityColor = (score) => {
    if (score >= 100) return "text-emerald-500";
    if (score >= 50) return "text-primary";
    if (score >= 25) return "text-amber-500";
    return "text-muted-foreground";
  };

  const getBadgeColor = (badgeType) => {
    const colors = {
      Helpful: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      TopContributor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      Mentor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      Verified: "bg-primary/10 text-primary border-primary/20",
      SubjectExpert: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return (
      colors[badgeType] || "bg-secondary text-muted-foreground border-border"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto"></div>
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{error}</h3>
        <Button onClick={() => navigate("/")} className="rounded-full mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="relative">
        {/* Cover Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary"></div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-4xl font-bold border-4 border-background">
              {profileUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>

          {/* Name & Username */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {profileUser?.name}
              </h2>
              <p className="text-muted-foreground">@{profileUser?.username}</p>
            </div>
            {isOwnProfile ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate("/settings")}
              >
                Edit Profile
              </Button>
            ) : (
              <Button className="rounded-full">Follow</Button>
            )}
          </div>

          {/* Bio/Goal */}
          {profileUser?.goal?.text &&
            (profileUser.goal.visibility === "Public" || isOwnProfile) && (
              <div className="mb-4">
                <p className="text-foreground">{profileUser.goal.text}</p>
                {isOwnProfile && profileUser.goal.visibility !== "Public" && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>{profileUser.goal.visibility}</span>
                  </div>
                )}
              </div>
            )}

          {/* Info Items */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span className="text-foreground font-medium">
                {profileUser?.primaryExam}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{profileUser?.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {formatDate(profileUser?.createdAt)}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-1">
              <span className="font-bold text-foreground">{questionCount}</span>
              <span className="text-muted-foreground">Questions</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-foreground">{resourceCount}</span>
              <span className="text-muted-foreground">Resources</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-foreground">{storyCount}</span>
              <span className="text-muted-foreground">Stories</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`font-bold ${getCredibilityColor(profileUser?.credibilityScore)}`}
              >
                {profileUser?.credibilityScore || 0}
              </span>
              <span className="text-muted-foreground">Score</span>
            </div>
          </div>

          {/* Badges */}
          {profileUser?.badges && profileUser.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profileUser.badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`${getBadgeColor(badge.type)} rounded-full`}
                >
                  <Award className="w-3 h-3 mr-1" />
                  {badge.type}
                  {badge.subject && ` - ${badge.subject}`}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Tabs */}
      {(profileUser?.privacy?.activityVisibility || isOwnProfile) && (
        <>
          <div className="border-b border-border">
            <div className="flex">
              {ACTIVITY_TABS.filter(tab => !tab.private || isOwnProfile).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 border-b-2 transition-all ${
                      activeTab === tab.id
                        ? "border-primary text-primary font-bold bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? "animate-pulse" : ""}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Segmented Filter for Saved Tab */}
          {activeTab === "saved" && (
            <div className="px-4 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-border/40 bg-secondary/10">
              {["all", "question", "resource", "story"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSavedFilter(filter)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    savedFilter === filter
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : "bg-background text-muted-foreground border-border/60 hover:border-primary/40"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}

          {/* Activity Content */}
          {activityLoading ? (
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="border-b border-border p-4 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-secondary rounded w-full mb-2"></div>
                      <div className="h-3 bg-secondary rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activityData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {activeTab === "saved" 
                  ? "Your study library is empty. Save content to see it here." 
                  : `No ${activeTab} to display yet`}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {activityData.map((item) => {
                const storyTypeKey = (item.storyType || "").toLowerCase();
                const visibleStoryTags = (item.tags || []).filter(
                  (tag) => tag?.toLowerCase() !== storyTypeKey,
                );

                return (
                  <article
                    key={item._id}
                    className="border-b border-border px-4 py-4 cursor-pointer"
                    onClick={() => {
                      if (activeTab === "saved") {
                        const targetId = item.sourceId || item._id;
                        if (item.type === "question") navigate(`/question/${targetId}`);
                        else if (item.type === "resource") navigate(`/resources/${targetId}/view`);
                        else if (item.type === "story") navigate(`/stories/${targetId}`);
                      } else if (activeTab === "questions") {
                        navigate(`/question/${item._id}`);
                      } else if (activeTab === "resources") {
                        navigate(`/resources/${item._id}/view`);
                      } else if (activeTab === "stories") {
                        navigate(`/stories/${item._id}`);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Author Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                        {activeTab === "stories" && item.isAnonymous
                          ? "A"
                          : profileUser?.name?.charAt(0).toUpperCase() || "U"}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {activeTab === "stories" && item.isAnonymous
                                ? "Anonymous"
                                : profileUser?.name}
                            </span>
                            {!(activeTab === "stories" && item.isAnonymous) && (
                              <span className="text-muted-foreground">
                                @{profileUser?.username}
                              </span>
                            )}
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground text-sm">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          {canDeleteItem(item) && (
                            <div className="flex items-center gap-1">
                              {activeTab === "questions" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-8 px-3 text-xs ${
                                    item.isSolved
                                      ? "text-yellow-700 hover:bg-yellow-50"
                                      : "text-yellow-600 hover:bg-yellow-50"
                                  }`}
                                  onClick={(e) =>
                                    handleMarkSolved(item._id, item.isSolved, e)
                                  }
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {item.isSolved ? "Unmark" : "Mark Solved"}
                                </Button>
                              )}
                              {activeTab === "saved" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:bg-primary/10"
                                  onClick={(e) => handleDelete(item._id, e)}
                                  title="Remove from saved"
                                >
                                  <Bookmark className="w-4 h-4 fill-current" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={(e) => handleDelete(item._id, e)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-foreground font-medium mb-1 line-clamp-2">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {item.description ||
                            item.excerpt ||
                            item.content ||
                            ""}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {activeTab === "stories" && item.storyType && (
                            <Badge className="rounded-full text-xs px-3 py-1 bg-indigo-50 text-indigo-600 border-0 font-medium">
                              {item.storyType}
                            </Badge>
                          )}
                          {activeTab === "stories" &&
                            visibleStoryTags.length > 0 && (
                              <>
                                {visibleStoryTags
                                  .slice(0, 3)
                                  .map((tag, idx) => (
                                    <Badge
                                      key={`story-tag-${idx}`}
                                      className="rounded-full text-xs px-3 py-1 bg-violet-50 text-violet-700 border-0 font-medium"
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                              </>
                            )}
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
                          {item.systemTags && item.systemTags.length > 0 && (
                            <>
                              {item.systemTags.slice(0, 3).map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  className="rounded-full text-xs px-3 py-1 bg-emerald-50 text-emerald-600 border-0 font-medium"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </>
                          )}
                          {item.userTags && item.userTags.length > 0 && (
                            <>
                              {item.userTags.slice(0, 2).map((tag, idx) => (
                                <Badge
                                  key={`user-${idx}`}
                                  className="rounded-full text-xs px-3 py-1 bg-slate-100 text-slate-700 border-0 font-medium"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 hover:text-primary transition-colors">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{item.likesCount ?? item.upvotes ?? 0}</span>
                          </div>
                          {item.answerCount !== undefined && (
                            <div className="flex items-center gap-1 hover:text-primary transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              <span>{item.answerCount}</span>
                            </div>
                          )}
                          {activeTab === "stories" && (
                            <div className="flex items-center gap-1 hover:text-primary transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              <span>{item.commentsCount || 0}</span>
                            </div>
                          )}
                          {item.isSolved && (
                            <Badge className="rounded-full bg-yellow-50 text-yellow-700 border-0 font-medium text-xs px-2 py-0.5">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Solved
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Private Activity Message */}
      {!(profileUser?.privacy?.activityVisibility || isOwnProfile) && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-t border-border">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Activity is Private
          </h3>
          <p className="text-muted-foreground">
            This user has chosen to keep their activity private.
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;
