import styles from "./PostFeedSkeleton.module.css";

function Shimmer({ className }) {
  return <span className={`${styles.skeleton} ${className ?? ""}`} aria-hidden="true" />;
}

function PostFeedSkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Shimmer className={styles.avatar} />
        <div className={styles.metaBlock}>
          <Shimmer className={`${styles.line} ${styles.lineShort}`} />
          <Shimmer className={`${styles.line} ${styles.lineMedium}`} />
        </div>
      </div>
      <Shimmer className={styles.title} />
      <Shimmer className={styles.cover} />
      <Shimmer className={styles.excerpt} />
      <Shimmer className={`${styles.excerpt} ${styles.excerptLast}`} />
      <div className={styles.tags}>
        <Shimmer className={styles.tag} />
        <Shimmer className={styles.tag} />
      </div>
      <div className={styles.footer}>
        <Shimmer className={styles.stat} />
        <Shimmer className={styles.stat} />
        <Shimmer className={styles.stat} />
      </div>
    </div>
  );
}

function PostFeedSkeleton({ count = 4 }) {
  return (
    <div className={styles.list} aria-busy="true" aria-label="Đang tải bài viết">
      {Array.from({ length: count }, (_, index) => (
        <PostFeedSkeletonCard key={index} />
      ))}
    </div>
  );
}

export default PostFeedSkeleton;
