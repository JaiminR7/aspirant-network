import { useNavigate } from "react-router-dom";

const PostContent = ({ title, content, type, fileUrl, fileType, resourceId }) => {
  const navigate = useNavigate();

  const handleResourceOpen = (e) => {
    e.stopPropagation();
    if (resourceId) {
      navigate(`/resources/${resourceId}/view`);
      return;
    }
    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {content}
      </p>
      {type === "resource" && fileUrl && (
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-xs font-medium px-3 py-1 mb-3"
          onClick={handleResourceOpen}
        >
          Open {fileType || "file"}
        </button>
      )}
    </>
  );
};

export default PostContent;
