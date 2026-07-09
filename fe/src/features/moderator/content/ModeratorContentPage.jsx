/**
 * @fileoverview Trang kiểm duyệt nội dung legacy (mock đơn giản) — prototype trước khi có `ContentModerationPage`.
 *
 * Hiển thị danh sách bài chờ duyệt tĩnh với nút Duyệt/Từ chối mock qua toast.
 * Trang production dùng route `/moderator/content` → `ContentModerationPage`.
 *
 * @module features/moderator/content/ModeratorContentPage
 */

import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

/**
 * Danh sách bài viết chờ duyệt mock — dùng demo UI legacy.
 *
 * @constant {ReadonlyArray<{ id: string, author: string, title: string, submittedAt: string }>}
 * @readonly
 */
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

/**
 * Trang duyệt nội dung legacy với danh sách mock và hành động toast.
 *
 * @returns {import('react').ReactElement} Layout trang moderator đơn giản.
 *
 * @example
 * <Route path="/moderator/content-legacy" element={<ModeratorContentPage />} />
 */
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

/**
 * Export mặc định trang kiểm duyệt nội dung legacy.
 *
 * @type {typeof ModeratorContentPage}
 * @default
 */
export default ModeratorContentPage;
