import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CheckCircle2,
  Clock,
  User,
  ArrowLeft,
  Send,
  AlertCircle,
  Star,
  Sparkles,
  MoreHorizontal,
  Bookmark,
  Share2,
} from "lucide-react";

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [error, setError] = useState(null);

  // Answer form state
  const [answerContent, setAnswerContent] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Mark solved state
  const [markingSolved, setMarkingSolved] = useState(false);

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
  }, [id]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/api/questions/${id}`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch question");
      }

      const data = await response.json();
      console.log("Question data received:", data);
      setQuestion(data.data || data.question);
    } catch (error) {
      console.error("Error fetching question:", error);
      setError(error.message || "Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async () => {
    try {
      setLoadingAnswers(true);

      const response = await fetch(
        `http://localhost:5000/api/questions/${id}/answers`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch answers");
      }

      const data = await response.json();
      console.log("Answers data received:", data);
      setAnswers(data.data || data.answers || []);
    } catch (error) {
      console.error("Error fetching answers:", error);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    setAnswerError("");

    if (!answerContent.trim()) {
      setAnswerError("Answer content is required");
      return;
    }

    if (answerContent.trim().length < 10) {
      setAnswerError("Answer must be at least 10 characters");
      return;
    }

    if (answerContent.trim().length > 5000) {
      setAnswerError("Answer cannot exceed 5000 characters");
      return;
    }

    setSubmittingAnswer(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/questions/${id}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: answerContent.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit answer");
      }

      // Clear form
      setAnswerContent("");

      // Refresh answers
      await fetchAnswers();

      // Scroll to answers section
      document.getElementById("answers-section")?.scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Submit answer error:", error);
      setAnswerError(error.message || "Failed to submit answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleMarkSolved = async () => {
    if (!window.confirm("Mark this question as solved?")) {
      return;
    }

    setMarkingSolved(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/questions/${id}/solve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark as solved");
      }

      // Update question state
      setQuestion((prev) => ({
        ...prev,
        isSolved: true,
        solvedAt: new Date(),
      }));
    } catch (error) {
      console.error("Mark solved error:", error);
      alert(error.message || "Failed to mark as solved");
    } finally {
      setMarkingSolved(false);
    }
  };

  const handleVote = async (type, targetType, targetId) => {
    if (!token) {
      alert("Please login to vote");
      return;
    }

    try {
      const endpoint =
        targetType === "question"
          ? `http://localhost:5000/api/questions/${targetId}/vote`
          : `http://localhost:5000/api/answers/${targetId}/vote`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteType: type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to vote");
      }

      // Refresh question or answers based on targetType
      if (targetType === "question") {
        await fetchQuestion();
      } else {
        await fetchAnswers();
      }
    } catch (error) {
      console.error("Vote error:", error);
      alert(error.message || "Failed to vote");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isQuestionOwner = question?.createdBy?._id === user?._id;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto"></div>
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <p className="text-foreground font-semibold mb-2">
          {error || "Question not found"}
        </p>
        <Button
          onClick={() => navigate("/questions")}
          variant="outline"
          className="rounded-full mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/questions")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Question</h1>
            <p className="text-sm text-muted-foreground">
              {answers.length} {answers.length === 1 ? "answer" : "answers"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Question Card */}
        <article className="border-b border-border px-4 py-4 bg-slate-50 dark:bg-slate-900/20">
          {/* Author Info */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                {question.createdBy?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {question.createdBy?.name || "Unknown"}
                  </span>
                  <span className="text-muted-foreground">
                    @{question.createdBy?.username}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(question.createdAt)}</span>
                  <span>·</span>
                  <Eye className="w-3 h-3" />
                  <span>{question.views || 0} views</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {question.isSolved ? (
                <Badge className="rounded-full bg-yellow-50 text-yellow-700 border-0 font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Solved
                </Badge>
              ) : (
                <Badge className="rounded-full bg-yellow-50 text-yellow-600 border-0 font-medium">
                  Unsolved
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-3">
            {question.title}
          </h2>

          {/* Description */}
          <div className="text-foreground whitespace-pre-wrap mb-4">
            {question.description}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="rounded-full text-sm px-3.5 py-1 bg-blue-50 text-blue-600 border-0 font-medium">
              {question.subjectName}
            </Badge>
            <Badge className="rounded-full text-sm px-3.5 py-1 bg-green-50 text-green-600 border-0 font-medium">
              {question.topicName}
            </Badge>
            {question.userTags?.map((tag) => (
              <Badge
                key={tag}
                className="rounded-full text-sm px-3.5 py-1 bg-slate-100 text-slate-700 border-0 font-medium"
              >
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("upvote", "question", question._id)}
                className={`rounded-full hover:bg-primary/10 hover:text-primary ${
                  question.userVote === "upvote"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span>{question.upvotes || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("downvote", "question", question._id)}
                className={`rounded-full hover:bg-destructive/10 hover:text-destructive ${
                  question.userVote === "downvote"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                <span>{question.downvotes || 0}</span>
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </article>

        {/* Answers Section */}
        <div id="answers-section">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">
              {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
            </h2>
          </div>

          {loadingAnswers ? (
            <div className="space-y-0">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="border-b border-border p-4 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-secondary rounded w-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : answers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No answers yet. Be the first to answer!
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {answers.map((answer) => (
                <article
                  key={answer._id}
                  className={`border-b border-border px-4 py-4 ${
                    answer.isAccepted
                      ? "bg-emerald-500/5 border-l-2 border-l-emerald-500"
                      : ""
                  }`}
                >
                  {answer.isAccepted && (
                    <div className="flex items-center gap-2 text-emerald-400 mb-3">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-semibold text-sm">
                        Accepted Answer
                      </span>
                    </div>
                  )}

                  {/* Username at top */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {answer.isAnonymous
                        ? "A"
                        : answer.author?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {answer.isAnonymous
                          ? "Anonymous"
                          : answer.author?.username || "Unknown"}
                      </span>
                      {answer.author?.credibilityScore > 0 && (
                        <Badge
                          variant="secondary"
                          className="rounded-full text-xs"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {answer.author.credibilityScore}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-sm">
                        • {formatDate(answer.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Answer content */}
                  <div className="mb-3">
                    <p className="text-foreground whitespace-pre-wrap">
                      {answer.content}
                    </p>
                  </div>

                  {/* Votes at bottom */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleVote("upvote", "answer", answer._id)
                        }
                        className={`h-8 px-3 rounded-full ${
                          answer.userVote === "upvote"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          {answer.upvotes || 0}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleVote("downvote", "answer", answer._id)
                        }
                        className={`h-8 px-3 rounded-full ${
                          answer.userVote === "downvote"
                            ? "text-destructive bg-destructive/10"
                            : "text-muted-foreground"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          {answer.downvotes || 0}
                        </span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Answer Form */}
        {token && !question.isSolved && (
          <div className="border-b border-border px-4 py-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Your Answer
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share your knowledge and help fellow aspirants
            </p>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              {answerError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {answerError}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="answer"
                  className="text-muted-foreground text-sm"
                >
                  Answer *
                  <span className="text-xs ml-2">
                    ({answerContent.length}/5000)
                  </span>
                </Label>
                <Textarea
                  id="answer"
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="Write your answer here... Be clear and detailed."
                  className="min-h-[150px] bg-background border-2 border-primary rounded-xl resize-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary"
                  disabled={submittingAnswer}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isAnonymousAnswer"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-secondary"
                  disabled={submittingAnswer}
                />
                <Label
                  htmlFor="isAnonymousAnswer"
                  className="font-normal text-muted-foreground"
                >
                  Post anonymously
                </Label>
              </div>

              <Button
                type="submit"
                disabled={
                  !answerContent.trim() ||
                  answerContent.trim().length < 10 ||
                  submittingAnswer
                }
                className="rounded-full"
              >
                {submittingAnswer ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post Answer
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {!token && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-b border-border">
            <p className="text-muted-foreground mb-4">
              Please login to answer this question
            </p>
            <Button onClick={() => navigate("/login")} className="rounded-full">
              Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
