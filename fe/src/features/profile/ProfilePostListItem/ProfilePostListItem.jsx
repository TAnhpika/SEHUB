import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faComment,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./ProfilePostListItem.module.css";

function ProfilePostListItem({ post, onNavigate }) {
  function handleClick() {
    onNavigate?.();
  }

  return (
    <Link to={`/home/posts/${post.id}`} className={styles.row} onClick={handleClick}>
      <h3 className={styles.title}>
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
  );
}

export default ProfilePostListItem;
