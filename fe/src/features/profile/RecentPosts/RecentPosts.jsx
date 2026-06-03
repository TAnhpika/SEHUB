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
  emptyTitle = "Chưa có bài viết nào!",
  emptyDescription = "Người dùng này chưa đăng bài viết nào. Hãy quay lại sau nhé!",
}) {
  const isEmpty = posts.length === 0;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Bài viết gần đây</h2>
        {!isEmpty && <span className={styles.count}>{posts.length} bài viết</span>}
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
              <article className={styles.post}>
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
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecentPosts;
