import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  filterReports,
  REASON_META,
  REPORT_STATUS_TABS,
  REPORTS_MOCK,
} from "@/features/moderator/reports/reportsData";
import styles from "./ReportsPage.module.css";

function ReasonBadge({ reason, size = "sm" }) {
  const meta = REASON_META[reason] ?? { label: reason, tone: "muted" };
  return (
    <span className={`${styles.reason} ${styles[`reason-${meta.tone}`]} ${styles[`reason-${size}`]}`}>
      {meta.label}
    </span>
  );
}

function TrustScore({ score }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone = clamped < 40 ? styles.trustLow : clamped < 70 ? styles.trustMid : styles.trustHigh;

  return (
    <div className={styles.trust}>
      <span className={styles.trustLabel}>Trust Score</span>
      <div className={styles.trustRow}>
        <div className={styles.trustTrack} aria-hidden>
          <span className={`${styles.trustFill} ${tone}`} style={{ width: `${clamped}%` }} />
        </div>
        <span className={`${styles.trustValue} ${tone}`}>{clamped}/100</span>
      </div>
    </div>
  );
}

function ReportListItem({ report, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`${styles.listItem} ${selected ? styles.listItemActive : ""}`}
      onClick={() => onSelect(report.id)}
    >
      <div className={styles.listItemTop}>
        <div className={styles.listReporter}>
          <span className={styles.listAvatar} aria-hidden>
            {report.reporterInitial}
          </span>
          <div>
            <p className={styles.listUsername}>{report.reporterUsername}</p>
            <p className={styles.listTime}>{report.timeLabel}</p>
          </div>
        </div>
        <ReasonBadge reason={report.reason} />
      </div>
      <p className={styles.listSnippet}>{report.snippet}</p>
    </button>
  );
}

function ReportDetail({ report, onDismiss, onDelete }) {
  if (!report) {
    return (
      <div className={styles.detailEmpty}>
        <p>Chọn một báo cáo trong danh sách để xem chi tiết.</p>
      </div>
    );
  }

  const isPending = report.status === "pending";

  return (
    <>
      <div className={styles.detailBody}>
        <header className={styles.detailHeader}>
          <div>
            <h2 className={styles.detailTitle}>Chi tiết báo cáo #{report.code}</h2>
            <div className={styles.detailMeta}>
              <ReasonBadge reason={report.reason} size="md" />
              <span>Đã báo cáo lúc {report.reportedAt}</span>
              {report.status === "resolved" && (
                <span className={styles.resolvedTag}>
                  {report.resolution === "deleted" ? "Đã xóa nội dung" : "Đã bỏ qua"}
                </span>
              )}
            </div>
          </div>
          <button type="button" className={styles.menuBtn} aria-label="Tùy chọn báo cáo">
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
        </header>

        <section className={styles.sectionCard}>
          <h3 className={styles.sectionLabel}>Thông tin người bị báo cáo</h3>
          <div className={styles.reportedUser}>
            <div className={styles.reportedIdentity}>
              <span className={styles.reportedAvatar} aria-hidden>
                {report.reportedUser.initial}
              </span>
              <div>
                <p className={styles.reportedUsername}>{report.reportedUser.username}</p>
                <p className={styles.reportedJoined}>
                  Tham gia: {report.reportedUser.joinedAt}
                </p>
              </div>
            </div>
            <TrustScore score={report.reportedUser.trustScore} />
          </div>
        </section>

        <section className={styles.violationSection}>
          <h3 className={styles.sectionLabel}>Nội dung vi phạm</h3>
          <div className={styles.violationBox}>
            <div className={styles.violationAccent} aria-hidden />
            <blockquote className={styles.violationQuote}>
              &ldquo;{report.violatingContent}&rdquo;
            </blockquote>
            <div className={styles.reporterReason}>
              <p className={styles.reporterReasonLabel}>
                Lý do từ người báo cáo ({report.reporterUsername}):
              </p>
              <p>{report.reporterReason}</p>
            </div>
          </div>
        </section>
      </div>

      {isPending && (
        <footer className={styles.detailFooter}>
          <button type="button" className={styles.dismissBtn} onClick={() => onDismiss(report.id)}>
            Bỏ qua báo cáo
          </button>
          <button type="button" className={styles.deleteBtn} onClick={() => onDelete(report.id)}>
            <FontAwesomeIcon icon={faTrash} />
            Xóa nội dung
          </button>
        </footer>
      )}
    </>
  );
}

function ReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState(REPORTS_MOCK);
  const [statusTab, setStatusTab] = useState("all");
  const [selectedId, setSelectedId] = useState("rp-4921");

  const filtered = useMemo(() => filterReports(reports, statusTab), [reports, statusTab]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedId) ?? filtered[0] ?? null,
    [reports, selectedId, filtered],
  );

  function resolveReport(id, resolution) {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, status: "resolved", resolution } : report,
      ),
    );
  }

  function handleDismiss(id) {
    resolveReport(id, "ignored");
    showToast("Đã bỏ qua báo cáo (mock).");
  }

  function handleDelete(id) {
    resolveReport(id, "deleted");
    showToast("Đã xóa nội dung vi phạm (mock).");
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/home">Trang chủ</Link>
        <span className={styles.sep}>/</span>
        <Link to="/moderator/content">Kiểm duyệt</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>Xử lý báo cáo</span>
      </nav>

      <div className={styles.workspace}>
        <aside className={styles.listPanel} aria-label="Danh sách báo cáo">
          <div className={styles.listHeader}>
            <h1 className={styles.listTitle}>Danh sách báo cáo</h1>
            <div className={styles.tabs} role="tablist">
              {REPORT_STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={statusTab === tab.value}
                  className={`${styles.tab} ${statusTab === tab.value ? styles.tabActive : ""}`}
                  onClick={() => setStatusTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.listScroll}>
            {filtered.length === 0 ? (
              <p className={styles.listEmpty}>Không có báo cáo trong mục này.</p>
            ) : (
              filtered.map((report) => (
                <ReportListItem
                  key={report.id}
                  report={report}
                  selected={selectedReport?.id === report.id}
                  onSelect={setSelectedId}
                />
              ))
            )}
          </div>
        </aside>

        <section className={styles.detailPanel} aria-label="Chi tiết báo cáo">
          <ReportDetail
            report={selectedReport}
            onDismiss={handleDismiss}
            onDelete={handleDelete}
          />
        </section>
      </div>
    </div>
  );
}

export default ReportsPage;
