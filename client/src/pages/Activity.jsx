import { useState, useEffect } from "react";
import { activityService } from "../services/activityService";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  CheckCircle,
  Bell,
} from "lucide-react";

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // 'all' or 'unread'
  const navigate = useNavigate();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityService.getActivities({
        unreadOnly: filter === "unread",
        limit: 100,
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
  }, [filter]);

  // Mark all as read when component mounts
  useEffect(() => {
    const markAllRead = async () => {
      try {
        await activityService.markAllAsRead();
        setUnreadCount(0);
      } catch (error) {
        console.error("Error marking all as read:", error);
      }
    };

    markAllRead();
  }, []);

  const handleActivityClick = async (activity) => {
    try {
      // Mark as read
      if (!activity.isRead) {
        await activityService.markAsRead(activity._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setActivities((prev) =>
          prev.map((a) =>
            a._id === activity._id ? { ...a, isRead: true } : a,
          ),
        );
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
      setActivities((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "answer":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "upvote":
        return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case "downvote":
        return <ThumbsDown className="w-5 h-5 text-red-500" />;
      case "solved":
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    // Show full date and time for older activities
    return activityDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year:
        activityDate.getFullYear() !== now.getFullYear()
          ? "numeric"
          : undefined,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getActivityTypeText = (type) => {
    switch (type) {
      case "answer":
        return "answered your question";
      case "upvote":
        return "upvoted your question";
      case "downvote":
        return "downvoted your question";
      case "solved":
        return "marked as solved";
      case "accepted_answer":
        return "accepted your answer";
      default:
        return "interacted with your content";
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Activity</h1>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full font-semibold">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition-colors relative ${
              filter === "all"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
            {filter === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 font-medium transition-colors relative ${
              filter === "unread"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unread
            {filter === "unread" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No activities yet</p>
            <p className="text-sm">
              {filter === "unread"
                ? "You have no unread activities"
                : "Your activity feed is empty"}
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <Card
              key={activity._id}
              className={`p-4 cursor-pointer ${
                !activity.isRead
                  ? "border-l-4 border-l-primary bg-accent/30"
                  : ""
              }`}
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      {activity.actor?.name ? (
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">
                            {activity.actor.name}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {getActivityTypeText(activity.type)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {activity.message}
                        </p>
                      )}
                    </div>
                    {!activity.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>

                  {/* Message/Question preview */}
                  {activity.message && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {activity.message}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
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

export default Activity;
