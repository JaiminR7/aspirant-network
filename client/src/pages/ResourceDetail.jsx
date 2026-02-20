import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  Star,
  Eye,
  Calendar,
  User,
  Tag,
  Bookmark,
  BookmarkCheck,
  Share2,
  Flag,
  Loader2,
} from "lucide-react";

const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/resources/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch resource");
      }

      const data = await response.json();
      setResource(data.data);

      // Check if user has already rated
      const userRatingObj = data.data.ratings?.find(
        (r) => r.user === user?._id,
      );
      if (userRatingObj) {
        setUserRating(userRatingObj.rating);
      }

      // Check if resource is saved
      setIsSaved(data.data.savedBy?.includes(user?._id));
    } catch (error) {
      console.error("Error fetching resource:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating) => {
    if (!user || isSubmittingRating) return;

    try {
      setIsSubmittingRating(true);
      const response = await fetch(
        `http://localhost:5000/api/resources/${id}/rate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to rate resource");
      }

      setUserRating(rating);
      fetchResource(); // Refresh to get updated rating
    } catch (error) {
      console.error("Error rating resource:", error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleView = async () => {
    if (!resource?.content?.url && !resource?.content?.externalLink) return;

    try {
      // Increment view/download count
      await fetch(`http://localhost:5000/api/resources/${id}/download`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const url = resource.content.url || resource.content.externalLink;

      // For PDFs, convert to preview URL that opens in browser
      if (resource.type === "PDF" && url.includes("cloudinary.com")) {
        // Convert raw upload to fl_attachment:false to view in browser
        const viewUrl = url.replace(
          "/raw/upload/",
          "/raw/upload/fl_attachment:false/",
        );
        window.open(viewUrl, "_blank");
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error viewing resource:", error);
    }
  };

  const handleDownload = async () => {
    if (!resource?.content?.url) return;

    try {
      // Increment download count
      await fetch(`http://localhost:5000/api/resources/${id}/download`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const url = resource.content.url;

      // For PDFs, ensure proper download with .pdf extension
      if (resource.type === "PDF" && url.includes("cloudinary.com")) {
        // Force download with proper filename
        const link = document.createElement("a");
        link.href = url;
        link.download = `${resource.title}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error downloading resource:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/resources/${id}/save`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save resource");
      }

      setIsSaved(!isSaved);
      fetchResource();
    } catch (error) {
      console.error("Error saving resource:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-destructive mb-4">
          {error || "Resource not found"}
        </div>
        <Button onClick={() => navigate("/resources")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/resources")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Resources
      </Button>

      {/* Resource Card */}
      <div className="bg-card rounded-xl border shadow-sm p-8 mb-6">
        {/* Header with thumbnail */}
        <div className="flex items-start gap-6 mb-6">
          {/* Thumbnail */}
          {(resource.type === "PDF" || resource.type === "Image") &&
            resource.content?.url && (
              <div className="flex-shrink-0">
                {resource.type === "PDF" ? (
                  <div className="w-32 h-32 rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <img
                      src={resource.content.url
                        .replace(
                          "/raw/upload/",
                          "/image/upload/pg_1,w_200,h_200,c_fill,f_jpg/",
                        )
                        .replace(".pdf", ".pdf.jpg")}
                      alt={`${resource.title} preview`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span class="text-xs font-medium mt-2">PDF</span>
                        </div>
                      `;
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border">
                    <img
                      src={resource.content.url}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}

          {/* Title and badges */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge className="rounded-full">{resource.type}</Badge>
              {resource.isVerified && (
                <Badge className="rounded-full bg-green-500/10 text-green-600 border-0">
                  Verified
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {resource.title}
            </h1>
            <p className="text-muted-foreground">{resource.description}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-6 pb-6 border-b mb-6">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">
              {resource.createdBy?.name || "Anonymous"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(resource.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {resource.viewCount || 0} views
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {resource.downloadCount || 0} downloads
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {resource.subjectName && (
              <Badge variant="outline" className="rounded-full">
                <BookOpen className="h-3 w-3 mr-1" />
                {resource.subjectName}
              </Badge>
            )}
            {resource.topicName && (
              <Badge variant="outline" className="rounded-full">
                <Tag className="h-3 w-3 mr-1" />
                {resource.topicName}
              </Badge>
            )}
            {resource.systemTags?.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="rounded-full">
                {tag}
              </Badge>
            ))}
            {resource.userTags?.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6 pb-6 border-b">
          <h3 className="text-sm font-semibold text-foreground mb-3">Rating</h3>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isSubmittingRating}
                  className="transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoveredRating || userRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {resource.rating?.average?.toFixed(1) || "0.0"} average (
              {resource.rating?.count || 0} ratings)
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {resource.type === "PDF" && (
            <Button onClick={handleView} className="flex-1 sm:flex-none">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open PDF
            </Button>
          )}
          <Button
            onClick={handleDownload}
            variant={resource.type === "PDF" ? "outline" : "default"}
            className="flex-1 sm:flex-none"
          >
            {resource.type === "Link" || resource.type === "Video" ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
          <Button
            variant={isSaved ? "default" : "outline"}
            onClick={handleSave}
            className="flex-1 sm:flex-none"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="ghost" className="text-muted-foreground">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;
