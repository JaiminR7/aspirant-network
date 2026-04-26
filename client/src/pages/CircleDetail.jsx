import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { circleService } from "../services/circleService";
import { ArrowLeft, Send } from "lucide-react";

const CircleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");

  // Ref for auto-scroll to latest message
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchCircle();
  }, [id]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [circle?.messages]);

  const fetchCircle = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await circleService.getById(id);
      setCircle(res.data);
    } catch (e) {
      console.error("[CIRCLE_DETAIL] Failed to fetch:", e.message);
      setError(e.response?.data?.message || "Failed to load circle");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await circleService.addMessage(id, messageText);

      // Add new message to UI
      setCircle((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), res.data],
      }));

      // Clear input
      setMessageText("");
    } catch (e) {
      console.error("[SEND_MESSAGE] Error:", e.message);
      setError(e.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (createdAt) => {
    try {
      const date = new Date(createdAt);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Loading circle...
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Circle not found
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/circles")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{circle.name}</h1>
          <p className="text-sm text-muted-foreground">{circle.topic}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {circle.messages && circle.messages.length > 0 ? (
          <div className="space-y-3">
            {circle.messages.map((message, idx) => {
              const isCurrentUser = message.userId?._id === user?._id;
              return (
                <div
                  key={idx}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {message.userId?.name || "Unknown"}
                      </p>
                    )}
                    <p className="text-sm break-words">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser
                          ? "opacity-60"
                          : "opacity-50 text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-background sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sending}
            className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={sending || !messageText.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CircleDetail;
