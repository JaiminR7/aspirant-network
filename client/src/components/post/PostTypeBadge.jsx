import { Badge } from "../ui/badge";
import {
  getPostTypeLabel,
  getTypeStyle,
  normalizePostType,
} from "./postTypeUtils";

const PostTypeBadge = ({ type, className = "" }) => {
  const normalizedType = normalizePostType(type);
  const style = getTypeStyle(normalizedType);
  const label = getPostTypeLabel(normalizedType);

  return (
    <Badge
      className={`rounded-full border-0 text-xs font-medium px-2 py-1 leading-none ${style} ${className}`}
    >
      {label}
    </Badge>
  );
};

export default PostTypeBadge;
