import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faComment,
  faFileLines,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./RecentPosts.module.css";

function RecentPosts({
  posts,
  totalCount = 0,
  onViewAll,
  emptyTitle = "Chưa có bài viết nào!",
  emptyDescription = "Người dùng này chưa đăng bài viết nào. Hãy quay lại sau nhé!",
}) {
  const isEmpty = posts.length === 0;
  const resolvedTotalCount = totalCount > 0 ? totalCount : posts.length;
  const showViewAll = Boolean(onViewAll && !isEmpty && resolvedTotalCount > posts.length);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Bài viết gần đây</h2>
          {!isEmpty ? (
            <p className={styles.subtitle}>
              {resolvedTotalCount > posts.length
                ? `${posts.length}/${resolvedTotalCount} bài viết`
                : `${resolvedTotalCount} bài viết`}
            </p>
          ) : null}
        </div>
        {showViewAll ? (
          <button type="button" className={styles.viewAll} onClick={onViewAll}>
            <FontAwesomeIcon icon={faFileLines} />
            Xem tất cả
          </button>
        ) : null}
      </header>

      {isEmpty ? (
        <div className={styles.empty}>
          <span className={styles["empty-icon"]} aria-hidden="true">
            <FontAwesomeIcon icon={faFileLines} />
          </span>
          <p className={styles["empty-title"]}>{emptyTitle}</p>
          <p className={styles["empty-desc"]}>{emptyDescription}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.id}>
              <Link to={`/home/posts/${post.id}`} className={styles.post}>
                <h3 className={styles["post-title"]}>
                  <span className={styles.hash}>#</span> {post.title}
                </h3>
                <div className={styles.meta}>
                  <span>
                    <FontAwesomeIcon icon={faCalendarDays} />
                    {post.date}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faComment} />
                    {post.comments} bình luận
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faHeart} />
                    {post.likes} lượt thích
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecentPosts;
