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
  Users,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Plus,
} from "lucide-react";

// Import page components
import HomePage from "../pages/Home";
import QuestionsPage from "../pages/Questions";
import QuestionDetailPage from "../pages/QuestionDetail";
import AskQuestionPage from "../pages/AskQuestion";
import ResourcesPage from "../pages/Resources";
import ResourceDetailPage from "../pages/ResourceDetail";
import AddResourcePage from "../pages/AddResource";
import StoriesPage from "../pages/Stories";
import AddStoryPage from "../pages/AddStory";
import ProfilePage from "../pages/Profile";
import SearchPage from "../pages/Search";
import SettingsPage from "../pages/Settings";
import ActivityPage from "../pages/Activity";
import SharePage from "../pages/Share";

// Placeholder components for routes not yet implemented
const StoryDetailPage = () => (
  <div className="p-6">Story Detail - Coming Soon</div>
);

// Suggested users data (can be fetched from API)
const suggestedUsers = [
  { name: "Study Buddy", username: "studybuddy", avatar: "S" },
  { name: "Exam Master", username: "exammaster", avatar: "E" },
  { name: "Topper Tips", username: "toppertips", avatar: "T" },
];

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { currentExam, canSwitchExam } = useExam();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navItems = [
    { path: "/home", icon: Home, label: "Home" },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Main Container - Four Column Layout */}
      <div className="max-w-[1800px] mx-auto flex">
        {/* Left Sidebar - Navigation & Profile */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 min-h-screen sticky top-0 border-r border-border p-6">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">Aspirant</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-3 bg-muted/50 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all"
            />
          </form>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 mb-6">
            {/* Home */}
            <Link
              to="/home"
              className={`nav-link ${isActivePath("/home") ? "active" : ""}`}
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

            {/* Rest of navigation items */}
            {navItems
              .filter((item) => item.path !== "/home")
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
          </nav>

          {/* Profile Card */}
          <div className="widget-card mt-auto">
            <div className="flex items-center gap-3">
              <div className="avatar h-11 w-11 flex-shrink-0 text-base">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-sm">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user?.username}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive flex-shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Exam Badge */}
            {currentExam && (
              <div className="mt-3 pt-3 border-t border-border">
                <Badge className="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                  {currentExam}
                </Badge>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Header */}
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
            <Link to="/home" className="flex items-center gap-2">
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

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
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
        <main className="flex-1 min-h-screen pt-14 lg:pt-0">
          <div className="max-w-2xl mx-auto px-4 lg:px-6">
            <Routes>
              <Route path="/home" element={<HomePage />} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/questions/:id" element={<QuestionDetailPage />} />
              <Route path="/ask" element={<AskQuestionPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/add" element={<AddResourcePage />} />
              <Route path="/resources/:id" element={<ResourceDetailPage />} />
              <Route path="/stories" element={<StoriesPage />} />
              <Route path="/stories/add" element={<AddStoryPage />} />
              <Route path="/stories/:id" element={<StoryDetailPage />} />
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
        <aside className="hidden xl:block w-80 min-h-screen sticky top-0 p-6 space-y-5">
          {/* Exam Badge Card */}
          {currentExam && (
            <div className="widget-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">
                  Current Exam
                </h3>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{currentExam}</p>
                  <p className="text-xs text-muted-foreground">
                    Active preparation
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Who to Follow */}
          <div className="widget-card">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 text-sm">
              <Users className="h-4 w-4 text-primary" />
              Who to follow
            </h3>
            <div className="space-y-3">
              {suggestedUsers.map((suggestedUser, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="avatar h-10 w-10 text-sm flex-shrink-0">
                    {suggestedUser.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {suggestedUser.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{suggestedUser.username}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-4 text-xs font-medium border hover:bg-primary hover:text-white hover:border-primary transition-all flex-shrink-0"
                  >
                    Follow
                  </Button>
                </div>
              ))}
            </div>
            <button className="text-primary text-sm font-medium mt-3 hover:underline">
              Show more
            </button>
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
            <p className="text-xs">© 2026 Aspirant Network</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AppLayout;
