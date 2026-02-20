import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { MessageSquare, BookOpen, FileText, ArrowLeft } from "lucide-react";

const SHARE_TYPES = [
  {
    id: "question",
    label: "Question",
    icon: MessageSquare,
    description: "Ask a question and get answers from the community",
    path: "/ask-question",
  },
  {
    id: "resource",
    label: "Resource",
    icon: BookOpen,
    description: "Share study materials, notes, or helpful links",
    path: "/add-resource",
  },
  {
    id: "story",
    label: "Story",
    icon: FileText,
    description: "Share your success story or experience",
    path: "/add-story",
  },
];

const Share = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-6">
      {/* Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Share</h1>
            <p className="text-sm text-muted-foreground">
              Share your knowledge with the community
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            What would you like to share?
          </h2>
          {SHARE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => navigate(type.path)}
                className="w-full content-card hover-lift text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {type.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Share;
