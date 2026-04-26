import { Badge } from "../ui/badge";

const TAG_THEME = {
  verbal: "bg-blue-50 text-blue-700",
  quant: "bg-green-50 text-green-700",
  polity: "bg-purple-50 text-purple-700",
};

const getTagClass = (tag) => {
  const key = String(tag || "").toLowerCase();
  return TAG_THEME[key] || "bg-slate-100 text-slate-700";
};

const PostTags = ({ tags = [] }) => {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.slice(0, 5).map((tag) => (
        <Badge
          key={tag}
          className={`rounded-full border-0 text-xs font-medium ${getTagClass(tag)}`}
        >
          #{tag}
        </Badge>
      ))}
    </div>
  );
};

export default PostTags;
