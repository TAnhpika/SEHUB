import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faComment,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./RecentPosts.module.css";

function RecentPosts({ posts }) {
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Bài viết gần đây</h2>
        <span className={styles.count}>{posts.length} bài viết</span>
      </header>

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
    </section>
  );
}

export default RecentPosts;
