import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faEye,
  faHeart,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import PostReportButton from "@/features/feed/PostReportButton/PostReportButton";
import { copyPostLink, isOwnPost } from "@/features/feed/postUtils";
import { toggleLike } from "@/features/feed/feedData";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import { resolvePostPreviewImage } from "@/features/feed/postContentPreview";
import styles from "./PostCard.module.css";

function PostCard({ post, interactive = false, onOpen, onEdit, onDelete, onLikeChange }) {
  const { user, isPremium } = useAuth();
  const { showCopyToast } = useToast();
  const { needsLoginPrompt, requireAuth } = useRequireAuth();
  const canInteract = interactive || !needsLoginPrompt;
  const isOwner = isOwnPost(post, user);
  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [commentCount, setCommentCount] = useState(post.comments ?? 0);
  const [commentPreviews, setCommentPreviews] = useState(post.commentsList ?? []);
  const [liking, setLiking] = useState(false);
  const previewImageUrl = resolvePostPreviewImage(post);

  useEffect(() => {
    setLiked(Boolean(post.isLiked));
    setLikes(post.likes ?? 0);
    setCommentCount(post.comments ?? 0);
    setCommentPreviews(post.commentsList ?? []);
  }, [post.id, post.isLiked, post.likes, post.comments, post.commentsList]);

  function handleOpenPost() {
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để xem bài viết.");
      return;
    }
    onOpen?.(post);
  }

  function handleCommentClick(event) {
    event.stopPropagation();
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để bình luận bài viết.");
      return;
    }
    onOpen?.(post);
  }

  function handleEditPost(event) {
    event?.stopPropagation?.();
    onEdit?.(post);
  }

  function handleDeletePost(event) {
    event?.stopPropagation?.();
    onDelete?.(post);
  }

  async function handleShare(event) {
    event.stopPropagation();
    try {
      await copyPostLink(post.id);
      showCopyToast();
    } catch {
      showCopyToast();
    }
  }

  async function handleLike(event) {
    event.stopPropagation();
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để thích bài viết.");
      return;
    }
    if (liking) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((count) => (liked ? Math.max(0, count - 1) : count + 1));
    setLiking(true);

    try {
      const result = await toggleLike(post.id, liked);
      setLiked(result.isLiked);
      setLikes(result.likeCount);
      onLikeChange?.(post.id, result);
    } catch {
      setLiked(liked);
      setLikes(post.likes ?? 0);
    } finally {
      setLiking(false);
    }
  }

  return (
    <article
      className={styles.card}
      onClick={handleOpenPost}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenPost();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <header className={styles.header}>
        <div className={styles.author}>
          <span className={styles.avatar} aria-hidden="true">
            {post.author.initial}
          </span>
          <div>
            <p
              className={withPremiumUsernameClass(
                styles.username,
                isOwner && isPremium,
              )}
            >
              {post.author.username}
            </p>
            <p className={styles.meta}>
              {post.publishedAt ?? post.timeAgo}
              {!isOwner && post.author.club ? ` · ${post.author.club}` : ""}
            </p>
          </div>
        </div>

        {isOwner && (
          <PostOwnerMenu onEdit={handleEditPost} onDelete={handleDeletePost} />
        )}
      </header>

      <h2 className={styles.title}>
        {post.isPinned ? <span className={styles.pinnedBadge}>Ghim</span> : null}
        {post.title}
      </h2>
      {previewImageUrl ? (
        <div className={styles.coverWrap}>
          <img src={previewImageUrl} alt="" className={styles.cover} loading="lazy" />
        </div>
      ) : null}
      <RichTextContent
        value={post.contentPreview ?? post.body ?? post.excerpt}
        className={styles.excerpt}
        emptyFallback={null}
      />

      <ul className={styles.tags} aria-label="Thẻ bài viết">
        {post.tags.map((tag) => (
          <li key={tag} className={styles.tag}>
            {tag}
          </li>
        ))}
      </ul>

      {commentPreviews.length > 0 ? (
        <ul
          className={styles.commentPreviews}
          aria-label="Bình luận gần đây"
          onClick={(event) => event.stopPropagation()}
        >
          {commentPreviews.map((comment) => (
            <li key={comment.id} className={styles.commentPreview}>
              <span className={styles.commentAuthor}>{comment.author.name}</span>
              <span className={styles.commentText}>{comment.content}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className={styles.footer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.stats}>
          <button
            type="button"
            className={`${styles.stat} ${liked ? styles.statActive : ""}`}
            aria-label="Thích bài viết"
            aria-pressed={liked}
            disabled={liking}
            onClick={handleLike}
          >
            <FontAwesomeIcon icon={faHeart} />
            {likes}
          </button>
          <button
            type="button"
            className={styles.stat}
            aria-label="Bình luận"
            onClick={handleCommentClick}
          >
            <FontAwesomeIcon icon={faComment} />
            {commentCount}
          </button>
          <span className={styles.stat} aria-label="Lượt xem">
            <FontAwesomeIcon icon={faEye} />
            {post.views}
          </span>
        </div>
        <div className={styles.actions}>
          {!isOwner && (
            <PostReportButton
              postId={post.id}
              postTitle={post.title}
              className={`${styles.share} ${styles.report}`}
            />
          )}
          <button
            type="button"
            className={styles.share}
            aria-label="Chia sẻ"
            onClick={handleShare}
          >
            <FontAwesomeIcon icon={faShareNodes} />
          </button>
        </div>
      </footer>
    </article>
  );
}

export default PostCard;
