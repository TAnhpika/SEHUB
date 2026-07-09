/**
 * @fileoverview Trang mock đơn giản quản lý tài khoản vi phạm (phiên bản cũ / prototype).
 *
 * Trang production dùng `ViolatingAccountsPage`; module này giữ lại UI mock với dữ liệu cứng
 * để demo nhanh luồng cảnh báo / khóa 7 ngày.
 *
 * @module features/moderator/violations/ModeratorViolationsPage
 * @deprecated Dùng {@link module:features/moderator/violations/ViolatingAccountsPage} thay thế.
 */

import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

/**
 * Dữ liệu mock tài khoản vi phạm cho prototype UI.
 *
 * @constant {ReadonlyArray<{ username: string, reports: number, lastReason: string }>}
 * @readonly
 */
const VIOLATORS = [
  { username: "spam_bot_01", reports: 5, lastReason: "Spam" },
  { username: "user_xyz", reports: 2, lastReason: "Nội dung không phù hợp" },
];

/**
 * Trang prototype tài khoản vi phạm — bảng mock với nút cảnh báo và khóa 7 ngày.
 *
 * Mỗi hành động chỉ hiển thị toast mock, không gọi API thật.
 *
 * @returns {import('react').ReactElement} Layout trang moderator đơn giản.
 *
 * @example
 * <Route path="/moderator/violations-mock" element={<ModeratorViolationsPage />} />
 */
function ModeratorViolationsPage() {
  const { showToast } = useToast();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tài khoản vi phạm</h1>
          <p className={styles.subtitle}>Cảnh báo hoặc khóa tạm 1 / 7 / 30 ngày (Mod).</p>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Số báo cáo</th>
                <th>Lý do gần nhất</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {VIOLATORS.map((row) => (
                <tr key={row.username}>
                  <td>{row.username}</td>
                  <td>{row.reports}</td>
                  <td>{row.lastReason}</td>
                  <td>
                    <div className={styles.actions}>
                      <Button
                        look="outline"
                        size="sm"
                        onClick={() => showToast(`Cảnh báo @${row.username} (mock).`)}
                      >
                        Cảnh báo
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => showToast(`Khóa 7 ngày @${row.username} (mock).`)}
                      >
                        Khóa 7 ngày
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ModeratorViolationsPage;
