import { useCallback, useEffect, useState } from "react";
import { postsService } from "../services/postsService";
import Feed from "../components/feed/Feed";
import { consumePendingFeedPosts } from "../utils/feedOptimistic";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Filter, Globe, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("my");
  const [postType, setPostType] = useState("all");

  const mergeFeedPosts = (incoming, pending) => {
    const seen = new Set();
    const merged = [...pending, ...incoming].filter((post) => {
      if (!post?._id || seen.has(post._id)) return false;
      seen.add(post._id);
      return true;
    });

    return merged;
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!user) return;
      
      const response = await postsService.getFeed({ 
        limit: 24,
        scope,
        type: postType
      });
      const pendingPosts = consumePendingFeedPosts();

      setPosts(mergeFeedPosts(response.data || [], pendingPosts));
    } catch (fetchError) {
      setError(
        fetchError?.response?.data?.message ||
          "Failed to load feed. Please try again.",
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [scope, postType]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="min-h-screen py-4 px-4 sm:px-0">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Home Feed</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {scope === 'my' 
                ? `Personalized feed for ${user?.primaryExam || 'your exam'}` 
                : 'Explore posts across all exams and categories'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Exam Scope Filter */}
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="w-[140px] h-9 rounded-full bg-secondary/50 border-border">
                <div className="flex items-center gap-2">
                  {scope === 'my' ? <GraduationCap className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  <SelectValue placeholder="Scope" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="my">My Exam</SelectItem>
                <SelectItem value="all">All Exams</SelectItem>
              </SelectContent>
            </Select>

            {/* Post Type Filter */}
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger className="w-[140px] h-9 rounded-full bg-secondary/50 border-border">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  <SelectValue placeholder="Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
                <SelectItem value="story">Stories</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(scope !== 'my' || postType !== 'all') && (
          <div className="flex flex-wrap gap-2 pt-1">
            {scope === 'all' && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 font-normal bg-blue-500/10 text-blue-600 border-0">
                <Globe className="w-3 h-3 mr-1" /> All Exams
              </Badge>
            )}
            {postType !== 'all' && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 font-normal bg-primary/10 text-primary border-0 capitalize">
                {postType}s
              </Badge>
            )}
          </div>
        )}
      </div>

      <Feed posts={posts} loading={loading} error={error} />
    </div>
  );
};

export default Home;
