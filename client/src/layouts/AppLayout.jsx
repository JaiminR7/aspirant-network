import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useExam } from "../context/ExamContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Home,
  MessageSquare,
  BookOpen,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Hash,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Users,
  MessageCircle,
} from "lucide-react";

// Import page components
import HomePage from "../pages/Home";
import QuestionsPage from "../pages/Questions";
import QuestionDetailPage from "../pages/QuestionDetail";
import AskQuestionPage from "../pages/AskQuestion";
import ResourcesPage from "../pages/Resources";
import ResourceDetailPage from "../pages/ResourceDetail";
import AddResourcePage from "../pages/AddResource";
import ResourceViewerPage from "../pages/resources/ResourceViewer";
import StoriesPage from "../pages/Stories";
import StoryDetailPage from "../pages/StoryDetail";
import AddStoryPage from "../pages/AddStory";
import PostDetailPage from "../pages/PostDetail";
import AdminPage from "../pages/Admin";
import ProfilePage from "../pages/Profile";
import SearchPage from "../pages/Search";
import SettingsPage from "../pages/Settings";
import ActivityPage from "../pages/Activity";
import SharePage from "../pages/Share";
import CirclesPage from "../pages/Circles";
import CircleDetailPage from "../pages/CircleDetail";
import CreateCirclePostPage from "../pages/CreateCirclePost";
import { circleService } from "../services/circleService";
import { ThemeToggle } from "../components/ThemeToggle";

const AppLayout = () => {
  const { user, logout, token } = useAuth();
  const { currentExam, canSwitchExam } = useExam();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [suggestedCircles, setSuggestedCircles] = useState([]);

  // Admin trigger states
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [adminPasswordPrompt, setAdminPasswordPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");

  useEffect(() => {
    fetchSuggestedCircles();
  }, [token, currentExam]); // Removed location.pathname to prevent repeated fetches on navigation

  useEffect(() => {
    // Keep body from scrolling; center column handles all vertical scroll.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const fetchSuggestedCircles = async () => {
    if (!token) return;
    try {
      console.log(`[SIDEBAR_SUGGESTED] Fetching suggested circles`);
      const data = await circleService.list({ sort: "most-active", limit: 4 });
      const circles = data.data || [];
      console.log(`[SIDEBAR_SUGGESTED] Got ${circles.length} circles`);
      
      const ranked = [...circles].sort((a, b) => {
        const messageDiff = (b.messageCount || 0) - (a.messageCount || 0);
        if (messageDiff !== 0) return messageDiff;

        const activityDiff =
          new Date(b.lastMessageAt || b.createdAt).getTime() -
          new Date(a.lastMessageAt || a.createdAt).getTime();
        return activityDiff;
      });

      const activeFirst = ranked.filter(
        (circle) => (circle.messageCount || 0) > 0,
      );
      const fallback = activeFirst.length > 0 ? activeFirst : ranked;
      const selected = fallback.slice(0, 3);
      console.log(`[SIDEBAR_SUGGESTED] Selected ${selected.length} for sidebar`);
      setSuggestedCircles(selected);
    } catch (error) {
      console.error(`[SIDEBAR_SUGGESTED] Error:`, error.message);
      setSuggestedCircles([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAccess");
    logout();
    navigate("/login");
  };

  const handleAdminFooterClick = () => {
    const newClickCount = adminClickCount + 1;
    console.log("Footer clicked:", newClickCount, "times");

    setAdminClickCount(newClickCount);

    // Check if we've reached 5 clicks
    if (newClickCount === 5) {
      console.log("5 clicks reached! Showing admin password prompt...");
      setAdminPasswordPrompt(true);
      setAdminPassword("");
      setAdminPasswordError("");
      setAdminClickCount(0); // Reset for next attempt
    } else if (newClickCount > 0) {
      // Reset click counter after 2 seconds of inactivity
      setTimeout(() => {
        console.log("Resetting click counter...");
        setAdminClickCount(0);
      }, 2000);
    }
  };

  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    setAdminPasswordError("");

    // Check password (hardcoded for now, but this should be done server-side in production)
    if (adminPassword === "123456") {
      localStorage.setItem("adminAccess", "true");
      setAdminPasswordPrompt(false);
      setAdminPassword("");
      // Navigate to admin page
      navigate("/admin");
    } else {
      setAdminPasswordError("Invalid password");
      setAdminPassword("");
    }
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/circles", icon: Users, label: "Circles" },
    { path: "/activity", icon: Bell, label: "Activity" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const shareOptions = [
    { path: "/ask", icon: MessageSquare, label: "Question" },
    { path: "/resources/add", icon: BookOpen, label: "Resource" },
    { path: "/stories/add", icon: FileText, label: "Story" },
  ];

  const isActivePath = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isShareActive = () => {
    return shareOptions.some((option) => isActivePath(option.path));
  };

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Main Container - Three Column Layout */}
      <div className="h-full w-full flex">
        {/* Left Sidebar - Navigation & Profile */}
        {!isAdminRoute && (
          <aside className="hidden lg:flex lg:flex-col w-64 h-full fixed left-0 top-0 border-r border-border p-6 z-30 bg-background">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 px-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Aspirant</span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1.5 mb-6">
              {/* Home */}
              <Link
                to="/"
                className={`nav-link ${isActivePath("/") ? "active" : ""}`}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>Home</span>
              </Link>

              {/* Share Menu */}
              <div className="space-y-1">
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className={`nav-link w-full ${isShareActive() ? "active" : ""}`}
                >
                  <Plus className="h-5 w-5 flex-shrink-0" />
                  <span>Share</span>
                  <ChevronRight
                    className={`h-4 w-4 ml-auto transition-transform ${
                      shareMenuOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Sub-menu */}
                {shareMenuOpen && (
                  <div className="ml-7 space-y-1 animate-fade-in">
                    {shareOptions.map((option) => {
                      const Icon = option.icon;
                      const active = isActivePath(option.path);
                      return (
                        <Link
                          key={option.path}
                          to={option.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span>{option.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Circles Link */}
              <Link
                to="/circles"
                className={`nav-link ${isActivePath("/circles") ? "active" : ""}`}
              >
                <Users className="h-5 w-5 flex-shrink-0" />
                <span>Circles</span>
              </Link>

              {/* Rest of navigation items */}
              {navItems
                .filter((item) => item.path !== "/" && item.path !== "/circles")
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-link ${active ? "active" : ""}`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              
              {/* Theme Toggle */}
              <ThemeToggle className="mt-2" />
            </nav>

            {/* Logout at bottom */}
            <div className="pt-4 mt-auto border-t border-border">
              <p className="px-3 pb-2 text-sm font-medium text-foreground truncate">
                {user?.name || user?.username || "User"}
              </p>
              <button
                onClick={handleLogout}
                className="nav-link w-full text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </aside>
        )}

        {/* Mobile Header */}
        {!isAdminRoute && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-gradient">Aspirant</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/search")}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {!isAdminRoute && sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-14 left-0 bottom-0 w-72 bg-background border-r border-border z-50 lg:hidden overflow-y-auto animate-slide-in">
              <div className="p-4">
                {/* Profile Info */}
                <div className="sidebar-card mb-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar h-12 w-12 text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user?.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4 pt-4 border-t border-border">
                    <div className="stat-item">
                      <div className="value">0</div>
                      <div className="label">Following</div>
                    </div>
                    <div className="stat-item">
                      <div className="value">0</div>
                      <div className="label">Followers</div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`nav-link ${active ? "active" : ""}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Theme Toggle */}
                  <ThemeToggle className="mt-2" />
                </nav>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="nav-link w-full mt-4 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 ml-0 mr-0 h-full overflow-y-auto ${
            isAdminRoute
              ? "pt-0 lg:ml-0 xl:mr-0"
              : "pt-14 lg:pt-0 lg:ml-64 xl:mr-80"
          }`}
        >
          <div
            className={`${isAdminRoute ? "max-w-7xl" : "max-w-2xl"} mx-auto px-4 lg:px-6`}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/post/:id" element={<PostDetailPage />} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/question/:id" element={<QuestionDetailPage />} />
              <Route path="/ask" element={<AskQuestionPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resource/:id" element={<ResourceDetailPage />} />
              <Route path="/resources/:id/view" element={<ResourceViewerPage />} />
              <Route path="/resources/add" element={<AddResourcePage />} />
              <Route path="/stories" element={<StoriesPage />} />
              <Route path="/stories/:id" element={<StoryDetailPage />} />
              <Route path="/stories/add" element={<AddStoryPage />} />
              <Route path="/circles" element={<CirclesPage />} />
              <Route path="/circles/:id" element={<CircleDetailPage />} />
              <Route
                path="/circles/:id/post-create"
                element={<CreateCirclePostPage />}
              />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/share" element={<SharePage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </div>
        </main>

        {/* Right Sidebar - Trending & Suggestions */}
        {!isAdminRoute && (
          <aside className="hidden xl:block w-80 h-full fixed right-0 top-0 p-6 space-y-5 bg-background border-l border-border">
            {/* Exam Badge Card */}
            {currentExam && (
              <div className="widget-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">
                    Current Exam
                  </h3>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="w-11 h-11 rounded-xl bg-background shadow-sm flex items-center justify-center flex-shrink-0">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {currentExam}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active preparation
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Circles Widget */}
            <div className="widget-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">
                  Top Circles
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-primary"
                  onClick={() => navigate("/circles")}
                >
                  Show more
                </Button>
              </div>

              {suggestedCircles.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No circles to explore yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestedCircles.map((circle) => (
                    <Link
                      key={circle._id}
                      to={`/circles/${circle._id}`}
                      className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-foreground truncate text-sm">
                        {circle.name}
                      </p>
                      {circle.topic && (
                        <p className="text-xs text-muted-foreground truncate">
                          Topic: {circle.topic}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {circle.messageCount || 0} messages
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Links */}
            <div className="px-2 pt-3 text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-3 mb-2">
                <a
                  href="#"
                  className="hover:underline hover:text-foreground transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="hover:underline hover:text-foreground transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="hover:underline hover:text-foreground transition-colors"
                >
                  About
                </a>
              </div>
              <button
                onClick={handleAdminFooterClick}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors"
                title="Click 5 times to access admin"
              >
                © 2026 Aspirant Network
              </button>
            </div>
          </aside>
        )}

        {/* Admin Password Modal */}
        {adminPasswordPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-lg shadow-xl p-6 w-96 max-w-[90vw] animate-fade-in">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Admin Access
              </h2>
              <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-password"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Enter Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminPasswordError("");
                    }}
                    placeholder="••••••"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
                {adminPasswordError && (
                  <p className="text-sm text-destructive">
                    {adminPasswordError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Verify
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAdminPasswordPrompt(false);
                      setAdminPassword("");
                      setAdminPasswordError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
