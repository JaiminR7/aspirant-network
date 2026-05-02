import { Badge } from "../ui/badge";

const PostHeader = ({ author, exam, createdAt }) => {
  const name = author?.name || "User";
  const username = author?.username || "anonymous";
  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString()
    : "Just now";

  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="avatar h-10 w-10 text-sm">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{username} · {dateLabel}
          </p>
        </div>
      </div>
      <Badge className="rounded-full bg-blue-50 text-blue-700 border-0">
        {exam}
      </Badge>
    </div>
  );
};

export default PostHeader;
