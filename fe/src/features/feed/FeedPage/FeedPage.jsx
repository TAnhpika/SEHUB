import { useNavigate } from "react-router-dom";
import { usePostFeed } from "@/features/feed/hooks/usePostFeed";
import PostFeedView from "@/features/feed/PostFeedView/PostFeedView";
import { useRequireAuth } from "@/hooks/useRequireAuth";

function formatPostCount(totalCount) {
  if (totalCount === 0) return "Không có bài viết";
  return `${totalCount} bài viết`;
}

function FeedPage() {
  const navigate = useNavigate();
  const feed = usePostFeed({ scrollTargetId: "feed-top" });
  const { needsLoginPrompt, requireAuth } = useRequireAuth();

  function handleCreatePost() {
    if (needsLoginPrompt) {
      requireAuth("Vui lòng đăng nhập để tạo bài viết.");
      return;
    }
    navigate("/home/create-post");
  }

  return (
    <PostFeedView
      subtitle={formatPostCount(feed.totalCount)}
      interactive={false}
      createPostMode="auth-button"
      onCreatePost={handleCreatePost}
      feed={feed}
    />
  );
}

export default FeedPage;
