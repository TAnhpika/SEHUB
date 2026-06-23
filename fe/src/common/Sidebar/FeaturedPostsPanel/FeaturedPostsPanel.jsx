import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FEATURED_POSTS_UPDATED_EVENT,
  loadFeaturedSidebarPosts,
} from "@/features/feed/feedData";
import styles from "./FeaturedPostsPanel.module.css";

/** Matches --featured-max-visible in FeaturedPostsPanel.module.css */
const MAX_VISIBLE_FEATURED = 6;

function FeaturedPostsPanel({ className = "" }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await loadFeaturedSidebarPosts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(FEATURED_POSTS_UPDATED_EVENT, reload);
    return () => window.removeEventListener(FEATURED_POSTS_UPDATED_EVENT, reload);
  }, [reload]);

  return (
    <div className={`${styles.panel} ${className}`.trim()}>
      <h2 className={styles.title}>Bài viết nổi bật</h2>
      {loading ? (
        <p className={styles.empty}>Đang tải…</p>
      ) : posts.length === 0 ? (
        <p className={styles.empty}>
          Chưa có bài ghim. Moderator có thể ghim tối đa {MAX_VISIBLE_FEATURED} bài từ trang Ghim bài.
        </p>
      ) : (
        <ul className={styles.posts}>
          {posts.map((post, index) => (
            <li key={post.id} className={index < posts.length - 1 ? styles.item : undefined}>
              {post.external ? (
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {post.title}
                </a>
              ) : (
                <Link to={post.href} className={styles.link}>
                  {post.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FeaturedPostsPanel;
