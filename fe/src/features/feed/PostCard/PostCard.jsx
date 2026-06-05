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
import styles from "./PostCard.module.css";

function PostCard({ post, interactive = false, onOpen, onEdit, onDelete }) {
  const { user } = useAuth();
  const { showCopyToast } = useToast();
  const { needsLoginPrompt, requireAuth } = useRequireAuth();
  const canInteract = interactive || !needsLoginPrompt;
  const isOwner = isOwnPost(post, user);

  function handleOpenPost() {
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để xem bài viết.");
      return;
    }
    onOpen?.(post);
  }

  function handleInteract(event) {
    event.stopPropagation();
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để tương tác với bài viết.");
    }
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
            <p className={styles.username}>{post.author.username}</p>
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

      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.excerpt}>{post.excerpt}</p>

      <ul className={styles.tags} aria-label="Thẻ bài viết">
        {post.tags.map((tag) => (
          <li key={tag} className={styles.tag}>
            {tag}
          </li>
        ))}
      </ul>

      <footer className={styles.footer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.stats}>
          <button
            type="button"
            className={styles.stat}
            aria-label="Thích bài viết"
            onClick={handleInteract}
          >
            <FontAwesomeIcon icon={faHeart} />
            {post.likes}
          </button>
          <button
            type="button"
            className={styles.stat}
            aria-label="Bình luận"
            onClick={handleInteract}
          >
            <FontAwesomeIcon icon={faComment} />
            {post.comments}
          </button>
          <button
            type="button"
            className={styles.stat}
            aria-label="Lượt xem"
            onClick={handleInteract}
          >
            <FontAwesomeIcon icon={faEye} />
            {post.views}
          </button>
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
