import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import * as followApi from "@/api/followApi";

function FollowButton({
  userId,
  initialIsFollowing = false,
  onChange,
  size = "sm",
  className = "",
  disabled = false,
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!userId || loading || disabled) {
      return;
    }

    setLoading(true);

    try {
      const result = isFollowing
        ? await followApi.unfollowUser(userId)
        : await followApi.followUser(userId);

      const nextIsFollowing = Boolean(result.isFollowing);
      setIsFollowing(nextIsFollowing);
      onChange?.({
        isFollowing: nextIsFollowing,
        followersCount: result.followersCount,
        followingCount: result.followingCount,
      });
    } catch {
      /* keep current state on error */
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      look={isFollowing ? "outline" : undefined}
      className={className}
      disabled={loading || disabled}
      onClick={handleClick}
    >
      <FontAwesomeIcon icon={isFollowing ? faCheck : faPlus} />
      {loading ? "Đang xử lý..." : isFollowing ? "Đang theo dõi" : "Theo dõi"}
    </Button>
  );
}

export default FollowButton;
