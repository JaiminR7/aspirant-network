import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { circlePostService, circleService } from "../services/circleService";

const POST_TYPES = [
  { value: "question", label: "Question" },
  { value: "resource", label: "Resource" },
  { value: "discussion", label: "Discussion" },
];

const CreateCirclePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [circle, setCircle] = useState(null);
  const [content, setContent] = useState("");
  const [type, setType] = useState("discussion");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCircle = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await circleService.getById(id);
        // circleService.getById returns the API envelope { success, data: circleObj }
        // so the actual circle (with isMember field) is at response.data
        const circleData = response.data || null;
        setCircle(circleData ? { ...circleData, isMember: Boolean(circleData.isMember) } : null);
      } catch (fetchError) {
        setError(
          fetchError?.response?.data?.message || "Failed to load circle",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCircle();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await circlePostService.create({
        circleId: id,
        content: content.trim(),
        type,
      });

      navigate(`/circles/${id}`, {
        state: { newCirclePost: response.data },
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message || "Failed to create circle post",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Loading circle...
      </div>
    );
  }

  return (
    <div className="py-6 space-y-5 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(`/circles/${id}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to circle
      </Button>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="content-card space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post in Circle</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {circle?.name || "Circle"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Post Type
            </label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {POST_TYPES.map((postType) => (
                <option key={postType.value} value={postType.value}>
                  {postType.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Content
            </label>
            <Textarea
              rows={7}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Share your question, resource note, or discussion point..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/5000
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/circles/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || submitting}
            >
              {submitting ? "Posting..." : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCirclePost;
