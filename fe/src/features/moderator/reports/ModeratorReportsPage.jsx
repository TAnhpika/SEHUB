import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { ADMIN_REPORTS } from "@/features/admin/adminMockData";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

const PENDING = ADMIN_REPORTS.filter((r) => r.status === "pending");

function ModeratorReportsPage() {
  const { showToast } = useToast();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Xử lý báo cáo</h1>
          <p className={styles.subtitle}>Chấp thuận xóa bài hoặc từ chối giữ nguyên.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <ul className={styles.list}>
          {PENDING.map((report) => (
            <li key={report.id} className={styles.card}>
              <div>
                <p className={styles.cardTitle}>
                  Bài #{report.postId} — {report.reason}
                </p>
                <p className={styles.cardMeta}>
                  Báo cáo bởi @{report.reporter} · Đối tượng @{report.reportedUser} ·{" "}
                  {report.createdAt}
                </p>
              </div>
              <div className={styles.actions}>
                <Button size="sm" onClick={() => showToast("Đã xóa bài (mock).")}>
                  Xóa bài
                </Button>
                <Button look="outline" size="sm" onClick={() => showToast("Đã bỏ qua (mock).")}>
                  Bỏ qua
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {PENDING.length === 0 ? <p className={styles.cardMeta}>Không có báo cáo chờ.</p> : null}
      </section>
    </div>
  );
}

export default ModeratorReportsPage;
