import { useEffect, useState } from "react";
import { activityService } from "../services/activityService";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  CheckCircle,
  Bell,
  BellOff,
} from "lucide-react";

export const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const navigate = useNavigate();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityService.getActivities({
        unreadOnly: showUnreadOnly,
        limit: 50,
      });
      setActivities(response.data || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [showUnreadOnly]);

  const handleActivityClick = async (activity) => {
    try {
      // Mark as read
      if (!activity.isRead) {
        await activityService.markAsRead(activity._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Navigate to question
      if (activity.question) {
        navigate(`/questions/${activity.question}`);
      }
    } catch (error) {
      console.error("Error marking activity as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await activityService.markAllAsRead();
      setUnreadCount(0);
      fetchActivities();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "answer":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "upvote":
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case "downvote":
        return <ThumbsDown className="w-4 h-4 text-red-500" />;
      case "solved":
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return activityDate.toLocaleDateString();
  };

  return (
    <div className="w-80 border-r border-border bg-background h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Activity</h2>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className="flex-1"
          >
            {showUnreadOnly ? (
              <Bell className="w-3 h-3 mr-1" />
            ) : (
              <BellOff className="w-3 h-3 mr-1" />
            )}
            {showUnreadOnly ? "Unread" : "All"}
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Activities List */}
      <div className="p-4 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showUnreadOnly ? "No unread activities" : "No activities yet"}
          </div>
        ) : (
          activities.map((activity) => (
            <Card
              key={activity._id}
              className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                !activity.isRead
                  ? "border-l-4 border-l-primary bg-accent/50"
                  : ""
              }`}
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm line-clamp-2">
                      {activity.actor?.name && (
                        <span className="font-semibold">
                          {activity.actor.name}{" "}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {activity.message}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
