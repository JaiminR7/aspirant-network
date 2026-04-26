import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Expand,
  ExternalLink,
  FileImage,
  FileText,
  Loader2,
  RefreshCw,
  Shrink,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { resourceService } from "../../services/resourceService";
import { cn } from "../../lib/utils";

const normalizeResourceType = (resource) => {
  const schemaType = String(resource?.type || "").toLowerCase();
  const contentType = String(resource?.content?.type || "").toLowerCase();
  if (schemaType.includes("pdf") || contentType.includes("pdf")) return "pdf";
  if (schemaType.includes("image") || contentType.includes("image")) return "image";
  return "unknown";
};

const getViewerTitle = (resource) => resource?.title || "Resource Viewer";

const ResourceViewerSkeleton = () => (
  <div className="min-h-[70vh] rounded-2xl border border-border bg-card/60 p-6 animate-pulse">
    <div className="h-8 w-56 bg-secondary rounded-lg mb-4" />
    <div className="h-4 w-80 bg-secondary rounded-lg mb-8" />
    <div className="h-[60vh] w-full bg-secondary rounded-xl" />
  </div>
);

const PDFViewer = ({ url, title, isFullscreen, onError }) => (
  <div className={cn(
    "bg-card transition-all duration-300",
    isFullscreen 
      ? "fixed inset-0 z-50 h-screen w-screen rounded-0 border-0" 
      : "rounded-2xl border border-border p-2 shadow-sm"
  )}>
    <iframe
      src={url}
      title={title}
      className={cn(
        "w-full bg-muted transition-all duration-300",
        isFullscreen ? "h-screen rounded-0" : "h-[72vh] min-h-[520px] rounded-xl"
      )}
      loading="lazy"
      onError={onError}
    />
  </div>
);

const ImageViewer = ({ url, title, isFullscreen, onToggleFullscreen }) => (
  <div className={cn(
    "bg-slate-950 transition-all duration-300 flex items-center justify-center",
    isFullscreen 
      ? "fixed inset-0 z-50 h-screen w-screen rounded-0 border-0" 
      : "rounded-2xl border border-border p-3 shadow-sm bg-slate-950/70"
  )}>
    <button
      type="button"
      onClick={onToggleFullscreen}
      className={cn(
        "relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all",
        isFullscreen ? "w-full h-full rounded-0" : "w-full rounded-xl"
      )}
      title="Toggle fullscreen"
    >
      <img
        src={url}
        alt={title}
        className={cn(
          "w-full object-contain bg-slate-950 transition-all duration-300",
          isFullscreen ? "h-screen" : "h-[72vh] min-h-[420px]"
        )}
        loading="lazy"
      />
    </button>
  </div>
);

const ResourceViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewerContainerRef = useRef(null);

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const previewUrl = resource?.content?.viewerUrl || resource?.content?.url || resource?.content?.externalLink || "";
  const downloadUrl = resource?.content?.url || previewUrl;
  const fileType = useMemo(() => normalizeResourceType(resource), [resource]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await resourceService.getById(id);
      if (!response?.success || !response?.data) {
        throw new Error("Resource not found");
      }
      setPdfLoadFailed(false);
      setResource(response.data);
    } catch (fetchError) {
      setResource(null);
      setError(fetchError?.response?.data?.message || fetchError.message || "Resource not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResource();
  }, [id]);

  // Sync fullscreen state with browser API
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (fileType === "pdf" && resource?.content) {
      console.log("[ResourceViewer][PDF]", {
        contentUrl: resource.content.url,
        viewerUrl: resource.content.viewerUrl,
        iframeSrc: previewUrl,
      });
    }
  }, [fileType, previewUrl, resource]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/resources");
  };

  const handleOpenInNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const cleanTitle = (resource?.title || "resource").replace(/[^\w\d-]+/g, "_");
      const extension = fileType === "pdf" ? "pdf" : fileType === "image" ? "jpg" : "file";
      anchor.href = blobUrl;
      anchor.download = `${cleanTitle}.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      if (downloadUrl) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleFullscreen = async () => {
    const el = viewerContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-all duration-300",
      isFullscreen ? "p-0 bg-background" : "py-4"
    )}>
      <header className={cn(
        "sticky top-0 z-40 mb-4 border border-border bg-background/80 backdrop-blur-md transition-all",
        isFullscreen ? "p-2 px-4 border-x-0 border-t-0 rounded-0" : "rounded-2xl mx-auto max-w-5xl"
      )}>
        <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {!isFullscreen && (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <div className="min-w-0">
                <h1 className={cn(
                  "font-semibold text-foreground truncate",
                  isFullscreen ? "text-sm sm:text-base" : "text-base sm:text-lg"
                )}>
                  {getViewerTitle(resource)}
                </h1>
                {!isFullscreen && resource?.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {resource.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full uppercase text-[10px] sm:text-xs">
                {fileType}
              </Badge>
              {isFullscreen && (
                <Button variant="ghost" size="icon" onClick={handleFullscreen} className="h-8 w-8">
                  <Shrink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleOpenInNewTab} disabled={!previewUrl} className="h-8 text-xs sm:text-sm">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden xs:inline">New tab</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!downloadUrl} className="h-8 text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden xs:inline">Download</span>
            </Button>
            <Button 
              variant={isFullscreen ? "secondary" : "outline"} 
              size="sm" 
              onClick={handleFullscreen} 
              disabled={!previewUrl}
              className="h-8 text-xs sm:text-sm"
            >
              {isFullscreen ? (
                <>
                  <Shrink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Expand className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main 
        ref={viewerContainerRef} 
        className={cn(
          "w-full transition-all duration-300",
          isFullscreen ? "max-w-none h-[calc(100vh-100px)] overflow-hidden" : "max-w-5xl mx-auto"
        )}
      >
        {loading && <ResourceViewerSkeleton />}

        {!loading && error && (
          <div className="min-h-[60vh] rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center">
            <FileText className="h-9 w-9 text-muted-foreground mb-3" />
            <h2 className="text-lg font-semibold mb-1">Resource not found</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Go back
              </Button>
              <Button onClick={fetchResource}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && !previewUrl && (
          <div className="min-h-[60vh] rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 text-muted-foreground mb-3" />
            <h2 className="text-lg font-semibold mb-1">No file URL available</h2>
            <p className="text-sm text-muted-foreground">This resource does not have a valid file to preview.</p>
          </div>
        )}

        {!loading && !error && previewUrl && fileType === "pdf" && (
          <div className={cn(isFullscreen ? "w-full h-full" : "")}>
            {pdfLoadFailed ? (
              <div className="min-h-[60vh] rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center">
                <FileText className="h-9 w-9 text-muted-foreground mb-3" />
                <h2 className="text-lg font-semibold mb-1">Unable to render PDF inline</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Try opening it in a new tab. If it still downloads, the source URL is not preview-safe.
                </p>
                <Button onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in new tab
                </Button>
              </div>
            ) : (
              <PDFViewer
                url={previewUrl}
                title={getViewerTitle(resource)}
                isFullscreen={isFullscreen}
                onError={() => setPdfLoadFailed(true)}
              />
            )}
          </div>
        )}

        {!loading && !error && previewUrl && fileType === "image" && (
          <ImageViewer
            url={previewUrl}
            title={getViewerTitle(resource)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleFullscreen}
          />
        )}

        {!loading && !error && previewUrl && fileType === "unknown" && (
          <div className="min-h-[60vh] rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center">
            <FileImage className="h-9 w-9 text-muted-foreground mb-3" />
            <h2 className="text-lg font-semibold mb-1">Unsupported file type</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This resource type is not supported for inline preview yet.
            </p>
            <Button onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in new tab
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResourceViewer;
