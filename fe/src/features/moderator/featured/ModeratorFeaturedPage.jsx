import { useState } from "react";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

const CANDIDATES = [
  { id: "1", title: "Tips ôn PRF192 trong 1 tuần", author: "minhanh_dev", likes: 128 },
  { id: "2", title: "Review môn SWP391 — checklist", author: "anhcoding12345", likes: 95 },
];

function ModeratorFeaturedPage() {
  const { showToast } = useToast();
  const [featuredId, setFeaturedId] = useState("1");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Bài viết nổi bật</h1>
          <p className={styles.subtitle}>Ghim bài lên sidebar trang chủ / feed.</p>
        </div>
        <Button onClick={() => showToast("Đã lưu bài nổi bật (mock).")}>Lưu ghim</Button>
      </header>

      <section className={styles.panel}>
        <ul className={styles.list}>
          {CANDIDATES.map((post) => (
            <li key={post.id} className={styles.card}>
              <div>
                <p className={styles.cardTitle}>{post.title}</p>
                <p className={styles.cardMeta}>
                  @{post.author} · {post.likes} lượt thích
                  {featuredId === post.id ? (
                    <span className={styles.badgeDone}> · Đang ghim</span>
                  ) : null}
                </p>
              </div>
              <Button
                look={featuredId === post.id ? "solid" : "outline"}
                size="sm"
                onClick={() => {
                  setFeaturedId(post.id);
                  showToast(`Đã chọn ghim: ${post.title}`);
                }}
              >
                {featuredId === post.id ? "Đang chọn" : "Ghim"}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ModeratorFeaturedPage;
