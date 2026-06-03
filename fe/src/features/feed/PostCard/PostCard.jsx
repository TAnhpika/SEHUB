import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faEye,
  faHeart,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./PostCard.module.css";

function PostCard({ post, interactive = false }) {
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const canInteract = interactive || isAuthenticated;

  function handleOpenPost() {
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để xem bài viết.");
    }
  }

  function handleInteract(event) {
    event.stopPropagation();
    if (!canInteract) {
      requireAuth("Vui lòng đăng nhập để tương tác với bài viết.");
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
              {post.timeAgo} · {post.author.club}
            </p>
          </div>
        </div>
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
        <button
          type="button"
          className={styles.share}
          aria-label="Chia sẻ"
          onClick={handleInteract}
        >
          <FontAwesomeIcon icon={faShareNodes} />
        </button>
      </footer>
    </article>
  );
}

export default PostCard;
