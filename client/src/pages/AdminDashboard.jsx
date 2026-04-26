import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { adminService } from "../services/adminService";

const TABS = ["Dashboard", "Users", "Posts", "Reports"];

const EMPTY_STATS = {
  totalUsers: 0,
  totalPosts: 0,
  totalComments: 0,
  postsByType: { question: 0, resource: 0, story: 0 },
  postsByExam: { CAT: 0, GATE: 0, UPSC: 0 },
  postsPerDay: [],
};

const TYPE_COLORS = ["#3B82F6", "#10B981", "#8B5CF6"];

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [stats, setStats] = useState(EMPTY_STATS);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminApiLocked, setAdminApiLocked] = useState(false);

  const [examFilter, setExamFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminService.getStats();
      setStats(response.data || EMPTY_STATS);
    } catch (fetchError) {
      if (fetchError?.response?.status === 403) {
        setAdminApiLocked(true);
        setError(
          "Admin role is required. Log in with an admin account to use this dashboard.",
        );
      } else {
        setError(
          fetchError?.response?.data?.message ||
            "Failed to load dashboard stats",
        );
      }
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 200 };
      if (userNameFilter.trim()) params.name = userNameFilter.trim();
      const response = await adminService.getUsers(params);
      setUsers(response.data || []);
    } catch (fetchError) {
      if (fetchError?.response?.status === 403) {
        setAdminApiLocked(true);
        setError(
          "Admin role is required. Log in with an admin account to use this dashboard.",
        );
      } else {
        setError(fetchError?.response?.data?.message || "Failed to load users");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (examFilter) params.exam = examFilter;
      if (typeFilter) params.type = typeFilter;
      if (usernameFilter.trim()) params.username = usernameFilter.trim();

      const response = await adminService.getPosts(params);
      setPosts(response.data || []);
    } catch (fetchError) {
      if (fetchError?.response?.status === 403) {
        setAdminApiLocked(true);
        setError(
          "Admin role is required. Log in with an admin account to use this dashboard.",
        );
      } else {
        setError(fetchError?.response?.data?.message || "Failed to load posts");
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminService.getReports();
      setReports(response.data || []);
    } catch (fetchError) {
      if (fetchError?.response?.status === 403) {
        setAdminApiLocked(true);
        setError(
          "Admin role is required. Log in with an admin account to use this dashboard.",
        );
      } else {
        setError(
          fetchError?.response?.data?.message || "Failed to load reports",
        );
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminApiLocked) return;

    if (activeTab === "Dashboard") fetchStats();
    if (activeTab === "Users") fetchUsers();
    if (activeTab === "Posts") fetchPosts();
    if (activeTab === "Reports") fetchReports();
  }, [activeTab, adminApiLocked]);

  useEffect(() => {
    if (adminApiLocked) return;
    if (activeTab === "Posts") fetchPosts();
  }, [examFilter, typeFilter, usernameFilter, activeTab, adminApiLocked]);

  useEffect(() => {
    if (adminApiLocked) return;
    if (activeTab === "Users") fetchUsers();
  }, [userNameFilter, activeTab, adminApiLocked]);

  const postRows = useMemo(() => posts, [posts]);

  const postTypeChartData = useMemo(() => {
    return [
      { name: "Questions", value: stats.postsByType?.question || 0 },
      { name: "Resources", value: stats.postsByType?.resource || 0 },
      { name: "Stories", value: stats.postsByType?.story || 0 },
    ];
  }, [stats]);

  const postsByExamChartData = useMemo(() => {
    return [
      { exam: "CAT", count: stats.postsByExam?.CAT || 0 },
      { exam: "GATE", count: stats.postsByExam?.GATE || 0 },
      { exam: "UPSC", count: stats.postsByExam?.UPSC || 0 },
    ];
  }, [stats]);

  const activityChartData = useMemo(() => {
    return (stats.postsPerDay || []).map((entry) => ({
      date: entry.date.slice(5),
      count: entry.count,
    }));
  }, [stats]);

  const handleToggleUser = async (user) => {
    try {
      await adminService.banUser(user._id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u,
        ),
      );
    } catch (actionError) {
      setError(
        actionError?.response?.data?.message || "Failed to update user status",
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (actionError) {
      setError(actionError?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await adminService.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (actionError) {
      setError(actionError?.response?.data?.message || "Failed to delete post");
    }
  };

  const handleRetryAdminAccess = () => {
    setAdminApiLocked(false);
    setError("");
    if (activeTab === "Dashboard") fetchStats();
    if (activeTab === "Users") fetchUsers();
    if (activeTab === "Posts") fetchPosts();
    if (activeTab === "Reports") fetchReports();
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <aside className="rounded-xl border border-border bg-card p-3 lg:p-4 h-fit">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-foreground">
              Admin Panel
            </h2>
            <p className="text-xs text-muted-foreground">
              Data-driven controls
            </p>
          </div>

          <div className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={onLogout}>
            Logout Admin
          </Button>
        </aside>

        <section className="min-w-0 rounded-xl border border-border bg-card p-4 lg:p-6 min-h-[65vh]">
          {error ? (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              {adminApiLocked ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetryAdminAccess}
                >
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}

          {activeTab === "Dashboard" && (
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-4">
                Dashboard
              </h1>

              {loading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border p-4 animate-pulse"
                      >
                        <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                        <div className="h-6 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-4 h-72 animate-pulse bg-muted/40" />
                    <div className="rounded-xl border border-border p-4 h-72 animate-pulse bg-muted/40" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Users
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {stats.totalUsers}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Posts
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {stats.totalPosts}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Comments
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {stats.totalComments}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Questions
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {stats.postsByType.question}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Resources
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {stats.postsByType.resource}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Stories
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {stats.postsByType.story}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
                    <div className="min-w-0 rounded-xl border border-border p-4 overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Posts by Type
                      </h3>
                      <div className="h-72 min-w-0">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          minWidth={0}
                          minHeight={280}
                        >
                          <PieChart>
                            <Pie
                              data={postTypeChartData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={3}
                            >
                              {postTypeChartData.map((_, index) => (
                                <Cell
                                  key={`type-${index}`}
                                  fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="min-w-0 rounded-xl border border-border p-4 overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Posts by Exam
                      </h3>
                      <div className="h-72 min-w-0">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          minWidth={0}
                          minHeight={280}
                        >
                          <BarChart data={postsByExamChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="exam" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="count"
                              fill="#6366F1"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-xl border border-border p-4 overflow-hidden">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      User Activity (Posts Per Day - Last 7 Days)
                    </h3>
                    <div className="h-72 min-w-0">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={0}
                        minHeight={280}
                      >
                        <LineChart data={activityChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#0EA5E9"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "Users" && (
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-4">
                Users
              </h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Input
                  value={userNameFilter}
                  onChange={(e) => setUserNameFilter(e.target.value)}
                  placeholder="Search user by name or username"
                  className="w-64"
                />
                <Button
                  variant="outline"
                  onClick={() => setUserNameFilter("")}
                >
                  Clear Search
                </Button>
              </div>
              {loading ? (
                <p className="text-muted-foreground text-sm">
                  Loading users...
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="rounded-lg border border-border p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username} · {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.primaryExam} · {user.level}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleUser(user)}
                        >
                          {user.isActive ? "Ban" : "Unban"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Posts" && (
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-4">
                Posts
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="h-10 w-56 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Filter exam"
                >
                  <option value="">All exams</option>
                  <option value="CAT">CAT</option>
                  <option value="GATE">GATE</option>
                  <option value="UPSC">UPSC</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Filter post type"
                >
                  <option value="">All types</option>
                  <option value="question">question</option>
                  <option value="resource">resource</option>
                  <option value="story">story</option>
                </select>
                <Input
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  placeholder="Search by username"
                  className="w-56"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setExamFilter("");
                    setTypeFilter("");
                    setUsernameFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>

              {loading ? (
                <p className="text-muted-foreground text-sm">
                  Loading posts...
                </p>
              ) : (
                <div className="space-y-2">
                  {postRows.map((post) => (
                    <div
                      key={post._id}
                      className="rounded-lg border border-border p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {post.exam} · {post.type} · by @
                          {post.author?.username || "unknown"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePost(post._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Reports" && (
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-4">
                Reports
              </h1>
              {loading ? (
                <p className="text-muted-foreground text-sm">
                  Loading reports...
                </p>
              ) : reports.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  No reported posts for now.
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div
                      key={report._id}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {report.reason || "Report"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
