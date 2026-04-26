import { useNavigate } from "react-router-dom";
import PostActions from "../post/PostActions";
import PostContent from "../post/PostContent";
import PostHeader from "../post/PostHeader";
import PostTags from "../post/PostTags";
import PostTypeBadge from "../post/PostTypeBadge";

const PostCard = ({ post }) => {
  const navigate = useNavigate();

  const handleOpenPost = () => {
    console.debug("[post] open detail", post._id);
    navigate(`/post/${post._id}`);
  };

  const author = post.author || post.userId;

  return (
    <article
      className="content-card animate-fade-in cursor-pointer relative pt-10"
      onClick={handleOpenPost}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenPost();
        }
      }}
    >
      <PostTypeBadge type={post.type} className="absolute top-3 left-3" />
      <PostHeader
        author={author}
        exam={post.exam}
        createdAt={post.createdAt}
        isAnonymous={Boolean(post.isAnonymous)}
      />
      <PostContent
        title={post.title}
        content={post.description}
        type={post.type}
        fileUrl={post.fileUrl}
        fileType={post.fileType}
        resourceId={post.sourceModel === "Resource" ? post.sourceId : null}
      />
      <PostTags tags={post.tags || []} />

      <div onClick={(e) => e.stopPropagation()}>
        <PostActions
          postId={post._id}
          initialLikes={post.likesCount || 0}
          initialDislikes={post.dislikesCount || 0}
          initialComments={post.commentsCount || 0}
          initialInteraction={post.userInteraction || "none"}
          initialIsSaved={post.isSaved}
          onCommentClick={handleOpenPost}
        />
      </div>
    </article>
  );
};

export default PostCard;
