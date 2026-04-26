import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import PostTypeBadge from "../components/post/PostTypeBadge";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
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
import { postsService } from "../services/postsService";
import { useToast } from "../components/ui/toast";
import { questionService } from "../services/questionService";
import { answerService } from "../services/answerService";
import { formatRelativeTime } from "../utils/dateUtils";

const POST_CACHE = new Map();
const COMMENTS_CACHE = new Map();

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const perfRef = useRef({ start: 0 });

  const [question, setQuestion] = useState(POST_CACHE.get(id) || null);
  const [answers, setAnswers] = useState(COMMENTS_CACHE.get(id) || []);
  const [loading, setLoading] = useState(!POST_CACHE.has(id));
  const [loadingAnswers, setLoadingAnswers] = useState(!COMMENTS_CACHE.has(id));
  const [error, setError] = useState(null);

  // Answer form state
  const [answerContent, setAnswerContent] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Mark solved state
  const [markingSolved, setMarkingSolved] = useState(false);
  const [savePending, setSavePending] = useState(false);

  const fetchData = async () => {
    perfRef.current.start = performance.now();
    const isDev = import.meta.env.DEV;
    if (isDev) console.log(`[PERF] QuestionDetail navigation start: ${id}`);

    if (!POST_CACHE.has(id)) {
      setLoading(true);
    }
    setError(null);

    try {
      const qStart = performance.now();
      const data = await questionService.getById(id);
      
      if (isDev) {
        console.log(`[PERF] Question API time: ${(performance.now() - qStart).toFixed(2)}ms`);
      }
      
      const fetchedQuestion = data.data || data.question;
      setQuestion(fetchedQuestion);
      POST_CACHE.set(id, fetchedQuestion);
      setLoading(false);

      fetchAnswers(id);
    } catch (err) {
      if (!question) {
        setError(err.message || "Failed to load question");
      }
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId) => {
    const isDev = import.meta.env.DEV;
    const start = performance.now();
    try {
      const data = await answerService.getAnswersByQuestion(questionId);
      const fetchedAnswers = data.data || data.answers || [];
      
      if (isDev) {
        console.log(`[PERF] Answers fetch time: ${(performance.now() - start).toFixed(2)}ms`);
        console.log(`[PERF] Total Question render ready: ${(performance.now() - perfRef.current.start).toFixed(2)}ms`);
      }

      setAnswers(fetchedAnswers);
      COMMENTS_CACHE.set(questionId, fetchedAnswers);
    } catch (err) {
      console.warn("[QuestionDetail] Answers failed to load", err);
    } finally {
      setLoadingAnswers(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
      await answerService.create({
        questionId: id,
        content: answerContent.trim(),
      });

      // Clear form
      setAnswerContent("");

      // Refresh answers
      await fetchAnswers(id);

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
      await questionService.toggleSolve(id);

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

  const handleSave = async () => {
    if (!token) {
      addToast({ title: "Login required", description: "Please login to save questions.", variant: "error" });
      return;
    }
    if (savePending) return;

    const previousState = question.isSaved;
    setQuestion(prev => ({ ...prev, isSaved: !previousState }));
    setSavePending(true);

    try {
      if (previousState) {
        await postsService.unsavePost(id);
        addToast({ title: "Removed", description: "Question removed from your library.", variant: "default" });
      } else {
        await postsService.savePost(id);
        addToast({ title: "Saved", description: "Added to your private study collection.", variant: "success" });
      }
    } catch (error) {
      setQuestion(prev => ({ ...prev, isSaved: previousState }));
      addToast({ title: "Error", description: "Failed to update library. Try again.", variant: "error" });
    } finally {
      setSavePending(false);
    }
  };

  const handleVote = async (type, targetType, targetId) => {
    if (!token) {
      alert("Please login to vote");
      return;
    }

    if (targetType === "question") {
      // --- Optimistic update for question ---
      const savedQ = {
        likesCount: question.likesCount,
        dislikesCount: question.dislikesCount,
        userVoteStatus: question.userVoteStatus,
      };
      const wasUpvoted = savedQ.userVoteStatus === "upvoted";
      const wasDownvoted = savedQ.userVoteStatus === "downvoted";
      let nextLikes = savedQ.likesCount ?? 0;
      let nextDislikes = savedQ.dislikesCount ?? 0;
      let nextStatus;
      if (type === "upvote") {
        if (wasUpvoted) {
          nextLikes -= 1;
          nextStatus = "none";
        } else {
          nextLikes += 1;
          if (wasDownvoted) nextDislikes -= 1;
          nextStatus = "upvoted";
        }
      } else {
        if (wasDownvoted) {
          nextDislikes -= 1;
          nextStatus = "none";
        } else {
          nextDislikes += 1;
          if (wasUpvoted) nextLikes -= 1;
          nextStatus = "downvoted";
        }
      }
      setQuestion((q) => ({
        ...q,
        likesCount: nextLikes,
        dislikesCount: nextDislikes,
        userVoteStatus: nextStatus,
      }));
      try {
        const res = await fetch(
          `http://localhost:5000/api/questions/${targetId}/${type}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to vote");
        setQuestion((q) => ({
          ...q,
          likesCount: data.data.likesCount,
          dislikesCount: data.data.dislikesCount,
          userVoteStatus: data.data.userVoteStatus,
        }));
      } catch {
        setQuestion((q) => ({ ...q, ...savedQ }));
      }
    } else {
      // --- Optimistic update for answer ---
      const answer = answers.find((a) => a._id === targetId);
      if (!answer) return;
      const savedA = {
        upvotes: answer.upvotes,
        downvotes: answer.downvotes,
        userVoteStatus: answer.userVoteStatus,
      };
      const wasUpvoted = savedA.userVoteStatus === "upvoted";
      const wasDownvoted = savedA.userVoteStatus === "downvoted";
      let nextUp = savedA.upvotes ?? 0;
      let nextDown = savedA.downvotes ?? 0;
      let nextStatus;
      if (type === "upvote") {
        if (wasUpvoted) {
          nextUp -= 1;
          nextStatus = "none";
        } else {
          nextUp += 1;
          if (wasDownvoted) nextDown -= 1;
          nextStatus = "upvoted";
        }
      } else {
        if (wasDownvoted) {
          nextDown -= 1;
          nextStatus = "none";
        } else {
          nextDown += 1;
          if (wasUpvoted) nextUp -= 1;
          nextStatus = "downvoted";
        }
      }
      setAnswers((arr) =>
        arr.map((a) =>
          a._id === targetId
            ? {
                ...a,
                upvotes: nextUp,
                downvotes: nextDown,
                userVoteStatus: nextStatus,
              }
            : a,
        ),
      );
      try {
        const res = await fetch(
          `http://localhost:5000/api/answers/${targetId}/${type}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to vote");
        setAnswers((arr) =>
          arr.map((a) =>
            a._id === targetId
              ? {
                  ...a,
                  upvotes: data.data.likesCount,
                  downvotes: data.data.dislikesCount,
                  userVoteStatus: data.data.userVoteStatus,
                }
              : a,
          ),
        );
      } catch {
        setAnswers((arr) =>
          arr.map((a) => (a._id === targetId ? { ...a, ...savedA } : a)),
        );
      }
    }
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
          onClick={() => navigate(-1) || navigate("/")}
          variant="outline"
          className="rounded-full mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
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
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
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
        <article className="border-b border-border px-4 py-4 bg-slate-50 dark:bg-slate-900/20 relative pt-12">
          <PostTypeBadge type="question" className="absolute top-3 left-3" />

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
                  <span>{formatRelativeTime(question.createdAt)}</span>
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
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleVote("upvote", "question", question._id)}
                className={`rounded-full h-9 px-3 gap-2 ${
                  question.userVoteStatus === "upvoted"
                    ? "text-sky-700"
                    : "text-muted-foreground hover:text-sky-700"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-full border p-1 ${
                    question.userVoteStatus === "upvoted"
                      ? "border-sky-300 bg-sky-100 text-sky-700"
                      : "border-sky-200 bg-sky-50 text-sky-600"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </span>
                <span>
                  {question.likesCount ?? question.upvotes?.length ?? 0}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleVote("downvote", "question", question._id)}
                className={`rounded-full h-9 px-3 gap-2 ${
                  question.userVoteStatus === "downvoted"
                    ? "text-red-700"
                    : "text-muted-foreground hover:text-red-700"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-full border p-1 ${
                    question.userVoteStatus === "downvoted"
                      ? "border-red-300 bg-red-100 text-red-700"
                      : "border-red-200 bg-red-50 text-red-500"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </span>
                <span>
                  {question.dislikesCount ?? question.downvotes?.length ?? 0}
                </span>
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={`rounded-full transition-all duration-300 ${
                  question.isSaved 
                    ? "text-primary bg-primary/10 hover:bg-primary/20" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
                aria-label={question.isSaved ? "Remove from saved" : "Save for later"}
              >
                <Bookmark className={`w-4 h-4 ${question.isSaved ? "fill-current" : ""}`} />
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
                        • {formatRelativeTime(answer.createdAt)}
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
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleVote("upvote", "answer", answer._id)
                        }
                        className={`h-8 px-3 rounded-full gap-2 ${
                          answer.userVoteStatus === "upvoted"
                            ? "text-sky-700"
                            : "text-muted-foreground hover:text-sky-700"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center rounded-full border p-1 ${
                            answer.userVoteStatus === "upvoted"
                              ? "border-sky-300 bg-sky-100 text-sky-700"
                              : "border-sky-200 bg-sky-50 text-sky-600"
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-medium">
                          {answer.upvotes || 0}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleVote("downvote", "answer", answer._id)
                        }
                        className={`h-8 px-3 rounded-full gap-2 ${
                          answer.userVoteStatus === "downvoted"
                            ? "text-red-700"
                            : "text-muted-foreground hover:text-red-700"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center rounded-full border p-1 ${
                            answer.userVoteStatus === "downvoted"
                              ? "border-red-300 bg-red-100 text-red-700"
                              : "border-red-200 bg-red-50 text-red-500"
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </span>
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

              <div className="flex flex-col gap-1">
                <div className="flex items-center space-x-2">
                  <input
                    id="isAnonymousAnswer"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={submittingAnswer || !canPostAnonymously}
                  />
                  <Label
                    htmlFor="isAnonymousAnswer"
                    className={`font-normal ${
                      canPostAnonymously
                        ? "text-muted-foreground"
                        : "text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                  >
                    Post anonymously
                  </Label>
                </div>
                {!canPostAnonymously && (
                  <p className="text-xs text-muted-foreground pl-6">
                    Enable anonymous posting in{" "}
                    <a
                      href="/settings"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Privacy Settings
                    </a>{" "}
                    to use this option.
                  </p>
                )}
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
