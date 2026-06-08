import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { FEATURED_POSTS } from "@/features/feed/feedData";
import styles from "./CommunitySidebar.module.css";

function CommunitySidebar() {
  const navigate = useNavigate();

  return (
    <aside className={styles.sidebar} aria-label="Cộng đồng">
      <div className={`${styles.panel} ${styles.cta}`}>
        <div className={styles["cta-icon"]} aria-hidden="true">
          <FontAwesomeIcon icon={faRocket} />
        </div>
        <h2 className={styles["cta-title"]}>Tham gia cộng đồng</h2>
        <p className={styles["cta-desc"]}>
          Đăng ký miễn phí để like, bình luận và tích điểm cùng cộng đồng FPT.
        </p>
        <Button
          fullWidth
          className={styles["cta-btn"]}
          onClick={() => navigate("/register")}
        >
          Đăng ký ngay
        </Button>
        <p className={styles["cta-login"]}>
          Đã có tài khoản?{" "}
          <Link to="/login">Đăng nhập</Link>
        </p>
      </div>

      <div className={`${styles.panel} ${styles.featured}`}>
        <h2 className={styles.title}>Bài viết nổi bật</h2>
        <ul className={styles.posts}>
          {FEATURED_POSTS.map((post, index) => (
            <li key={post.url} className={index < FEATURED_POSTS.length - 1 ? styles.item : undefined}>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles["post-link"]}
              >
                {post.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default CommunitySidebar;
