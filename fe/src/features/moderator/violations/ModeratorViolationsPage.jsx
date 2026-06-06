import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

const VIOLATORS = [
  { username: "spam_bot_01", reports: 5, lastReason: "Spam" },
  { username: "user_xyz", reports: 2, lastReason: "Nội dung không phù hợp" },
];

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
