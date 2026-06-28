import { memo, useEffect, useMemo, useState } from "react";
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
import { stripRichTextMarkup } from "@/common/RichTextEditor/richTextPreviewHtml";
import { resolvePostPreviewImage } from "@/features/feed/postContentPreview";
import PinnedBadge from "@/features/feed/shared/PinnedBadge/PinnedBadge";
import { filterDisplayTags, getPostExcerptText } from "@/features/feed/shared/postDisplayUtils";
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
  const [liking, setLiking] = useState(false);
  const previewImageUrl = resolvePostPreviewImage(post);
  const displayTags = useMemo(() => filterDisplayTags(post.tags), [post.tags]);
  const excerptText = useMemo(
    () => stripRichTextMarkup(getPostExcerptText(post)),
    [post.contentPreview, post.body, post.excerpt],
  );

  useEffect(() => {
    setLiked(Boolean(post.isLiked));
    setLikes(post.likes ?? 0);
    setCommentCount(post.comments ?? 0);
  }, [post.id, post.isLiked, post.likes, post.comments]);

  function handleOpenPost() {
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để xem bài viết.");
      return;
    }
    onOpen?.(post);
  }

  function handleOpenComments() {
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để bình luận.");
      return;
    }
    onOpen?.(post, { focusComments: true });
  }

  function handleEditPost(event) {
    event?.stopPropagation?.();
    onEdit?.(post);
  }

  function handleDeletePost(event) {
    event?.stopPropagation?.();
    onDelete?.(post);
  }

  async function handleShare() {
    try {
      await copyPostLink(post.id);
      showCopyToast();
    } catch {
      showCopyToast();
    }
  }

  async function handleLike() {
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
      className={`${styles.card} ${post.isPinned ? styles.cardPinned : ""}`.trim()}
    >
      {isOwner ? (
        <div className={styles.ownerMenu}>
          <PostOwnerMenu onEdit={handleEditPost} onDelete={handleDeletePost} />
        </div>
      ) : null}

      <button type="button" className={styles.bodyBtn} onClick={handleOpenPost}>
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
        </header>

        <div className={styles.titleRow}>
          {post.isPinned ? <PinnedBadge className={styles.pinnedBadge} /> : null}
          <h2 className={styles.title}>{post.title}</h2>
        </div>
        {previewImageUrl ? (
          <div className={styles.coverWrap}>
            <img src={previewImageUrl} alt="" className={styles.cover} loading="lazy" />
          </div>
        ) : null}
        {excerptText ? <p className={styles.excerpt}>{excerptText}</p> : null}

        {displayTags.length > 0 ? (
          <ul className={styles.tags} aria-label="Thẻ bài viết">
            {displayTags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </button>

      <footer className={styles.footer}>
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
            onClick={handleOpenComments}
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

export default memo(PostCard);
