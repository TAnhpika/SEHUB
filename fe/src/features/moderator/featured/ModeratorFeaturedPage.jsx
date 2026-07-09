/**
 * @fileoverview Trang quản lý bài nổi bật legacy (mock đơn giản) — prototype trước `FeaturedPostsPage`.
 *
 * Hiển thị danh sách ứng viên ghim tĩnh với chọn một bài và toast mock.
 * Trang production dùng `/moderator/featured` → `FeaturedPostsPage`.
 *
 * @module features/moderator/featured/ModeratorFeaturedPage
 */

import { useState } from "react";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

/**
 * Danh sách bài ứng viên ghim mock cho trang legacy.
 *
 * @constant {ReadonlyArray<{ id: string, title: string, author: string, likes: number }>}
 * @readonly
 */
const CANDIDATES = [
  { id: "1", title: "Tips ôn PRF192 trong 1 tuần", author: "minhanh_dev", likes: 128 },
  { id: "2", title: "Review môn SWP391 — checklist", author: "anhcoding12345", likes: 95 },
];

/**
 * Trang ghim bài nổi bật legacy — chọn một bài và lưu mock qua toast.
 *
 * @returns {import('react').ReactElement} Layout trang moderator đơn giản.
 *
 * @example
 * <Route path="/moderator/featured-legacy" element={<ModeratorFeaturedPage />} />
 */
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

/**
 * Export mặc định trang bài nổi bật legacy.
 *
 * @type {typeof ModeratorFeaturedPage}
 * @default
 */
export default ModeratorFeaturedPage;
