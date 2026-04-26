import PostCard from "./PostCard";

const Feed = ({ posts, loading, error }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="content-card h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="content-card text-center py-10 text-muted-foreground">
        No posts found for this filter.
      </div>
    );
  }

  return (
    <div className="space-y-4 transition-all duration-300">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default Feed;
