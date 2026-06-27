import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context";
import { usePostFeed } from "@/features/feed/hooks/usePostFeed";
import PostFeedView from "@/features/feed/PostFeedView/PostFeedView";
import { parsePostId } from "@/features/feed/postUtils";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";

function formatPostCount(totalCount) {
  if (totalCount === 0) return "Không có bài viết";
  return `${totalCount} bài viết`;
}

function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isPremium } = useAuth();
  const feed = usePostFeed({ scrollTargetId: "home-top" });

  useEffect(() => {
    const linkedPostId = parsePostId(searchParams.get("post"));
    if (!linkedPostId) return;
    navigate(`/home/posts/${linkedPostId}`, { replace: true });
  }, [searchParams, navigate]);

  const displayName = user?.displayName ?? user?.username;
  const subtitle = (
    <>
      Xin chào,{" "}
      <strong className={withPremiumUsernameClass("", isPremium)}>{displayName}</strong>
      {" · "}
      {formatPostCount(feed.totalCount)}
    </>
  );

  return (
    <PostFeedView
      subtitle={subtitle}
      interactive
      createPostMode="link"
      feed={feed}
      modalExtras={{
        onViewed: feed.handleViewedPost,
      }}
    />
  );
}

export default HomePage;
