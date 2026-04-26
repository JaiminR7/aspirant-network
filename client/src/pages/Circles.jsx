import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { circleService } from "../services/circleService";
import { MessageCircle, Clock } from "lucide-react";
import { formatRelativeTime } from "../utils/dateUtils";

const Circles = () => {
  const { user } = useAuth();

  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    fetchCircles();
  }, [sort]);

  const fetchCircles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await circleService.list({
        sort,
        limit: 50,
      });
      setCircles(res.data || []);
    } catch (e) {
      console.error("[CIRCLES_PAGE] Failed to fetch:", e.message);
      setError(e.response?.data?.message || "Failed to load circles");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discussion Circles</h1>
          <p className="text-sm text-muted-foreground">
            Join exam-focused discussion groups. No membership required!
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="latest">Latest</option>
          <option value="most-active">Most Active</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="content-card animate-pulse h-20" />
          ))}
        </div>
      ) : circles.length === 0 ? (
        <div className="content-card text-center py-10">
          <p className="text-muted-foreground mb-3">
            No circles available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {circles.map((circle) => (
            <Link
              key={circle._id}
              to={`/circles/${circle._id}`}
              className="content-card block hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-foreground text-lg">
                    {circle.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {circle.topic}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {circle.messageCount || 0} messages
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(circle.lastMessageAt || circle.createdAt)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="default"
                  className="flex-shrink-0"
                >
                  Enter
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Circles;
