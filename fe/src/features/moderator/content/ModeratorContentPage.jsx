import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

const PENDING_POSTS = [
  {
    id: "p1",
    author: "user_xyz",
    title: "Chia sẻ tài liệu PRF192 — có link ngoài",
    submittedAt: "2026-06-04 08:00",
  },
  {
    id: "p2",
    author: "newbie_dev",
    title: "Hỏi đáp đề MAE101",
    submittedAt: "2026-06-03 19:30",
  },
];

function ModeratorContentPage() {
  const { showToast } = useToast();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Duyệt nội dung</h1>
          <p className={styles.subtitle}>Post-moderation: duyệt bài trước khi hiển thị công khai.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <ul className={styles.list}>
          {PENDING_POSTS.map((post) => (
            <li key={post.id} className={styles.card}>
              <div>
                <p className={styles.cardTitle}>{post.title}</p>
                <p className={styles.cardMeta}>
                  @{post.author} · {post.submittedAt}
                </p>
              </div>
              <div className={styles.actions}>
                <Button size="sm" onClick={() => showToast("Đã duyệt bài (mock).")}>
                  Duyệt
                </Button>
                <Button look="outline" size="sm" onClick={() => showToast("Đã từ chối (mock).")}>
                  Từ chối
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ModeratorContentPage;
