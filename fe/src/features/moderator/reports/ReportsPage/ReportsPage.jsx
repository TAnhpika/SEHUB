import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFlag,
  faInbox,
  faMousePointer,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  filterReports,
  getCommunityReportsMock,
  loadModeratorCommunityReports,
  REASON_META,
  reloadModeratorCommunityReportsAfterResolve,
} from "@/features/moderator/reports/reportsData";
import {
  getExamQuestionReports,
  resolveExamQuestionReport,
} from "@/features/exams/examQuestionReportStore";
import { EXAM_REPORT_ROUTING } from "@/features/exams/examQuestionReportData";
import styles from "./ReportsPage.module.css";

const TAB_OPTIONS = [
  { id: "pending", label: "Chờ xử lý" },
  { id: "resolved", label: "Đã xử lý" },
  { id: "all", label: "Tất cả" },
];

const CATEGORY_OPTIONS = [
  { id: "all", label: "Tất cả loại" },
  { id: "community", label: "Cộng đồng" },
  { id: "exam_question", label: "Câu hỏi đề" },
];

const CATEGORY_LABELS = {
  community: "Cộng đồng",
  exam_question: "Câu hỏi đề",
};

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  resolved: "Đã xử lý",
};

function ReasonTag({ reason }) {
  const meta = REASON_META[reason] ?? { label: reason, tone: "muted" };
  return (
    <span className={`${styles.tag} ${meta.tone === "danger" ? styles.tagDanger : styles.tagMuted}`}>
      {meta.label}
    </span>
  );
}

function TrustScore({ score }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone =
    clamped < 40 ? styles.trustLow : clamped < 70 ? styles.trustMid : styles.trustHigh;

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

function ReportsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [communityReports, setCommunityReports] = useState(getCommunityReportsMock);
  const [examReports, setExamReports] = useState(getExamQuestionReports);
  const [tab, setTab] = useState("pending");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [lastResolved, setLastResolved] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadModeratorCommunityReports().then((items) => {
      if (!cancelled) setCommunityReports(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function refreshExamReports() {
      setExamReports(getExamQuestionReports());
    }

    refreshExamReports();
    window.addEventListener("sehubs-exam-reports-changed", refreshExamReports);
    window.addEventListener("storage", refreshExamReports);
    return () => {
      window.removeEventListener("sehubs-exam-reports-changed", refreshExamReports);
      window.removeEventListener("storage", refreshExamReports);
    };
  }, []);

  const reports = useMemo(
    () => [...examReports, ...communityReports],
    [examReports, communityReports],
  );

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const filtered = useMemo(() => {
    const statusFiltered = filterReports(reports, tab === "all" ? "all" : tab);
    const categoryFiltered =
      category === "all"
        ? statusFiltered
        : statusFiltered.filter((report) => report.category === category);
    const q = query.trim().toLowerCase();
    if (!q) return categoryFiltered;

    return categoryFiltered.filter(
      (report) =>
        report.code.toLowerCase().includes(q) ||
        report.reporterUsername.toLowerCase().includes(q) ||
        (report.reportedUser?.username ?? "").toLowerCase().includes(q) ||
        (report.examId ?? "").toLowerCase().includes(q) ||
        (REASON_META[report.reason]?.label ?? report.reason).toLowerCase().includes(q) ||
        report.snippet.toLowerCase().includes(q),
    );
  }, [reports, tab, category, query]);

  useEffect(() => {
    const fromUrl = searchParams.get("id");
    if (fromUrl && reports.some((r) => r.id === fromUrl)) {
      setSelectedId(fromUrl);
      const item = reports.find((r) => r.id === fromUrl);
      if (item?.status === "resolved") setTab("resolved");
      else if (item?.status === "pending") setTab("pending");
    }
  }, [searchParams, reports]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = reports.find((r) => r.id === selectedId) ?? null;

  function selectReport(id) {
    setSelectedId(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("id", id);
        return next;
      },
      { replace: true },
    );
  }

  function resolveReportLocal(id, resolution) {
    const target = reports.find((report) => report.id === id);
    if (target?.category === "exam_question") {
      resolveExamQuestionReport(id, resolution);
      setExamReports(getExamQuestionReports());
    } else {
      setCommunityReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, status: "resolved", resolution } : report,
        ),
      );
    }

    if (target) {
      setLastResolved({ ...target, status: "resolved", resolution });
    }
  }

  async function handleDismiss(id) {
    const target = reports.find((report) => report.id === id);
    if (target?.category === "exam_question") {
      resolveReportLocal(id, "ignored");
    } else {
      const reloaded = await reloadModeratorCommunityReportsAfterResolve(id, "dismiss");
      if (reloaded) {
        setCommunityReports(reloaded);
        if (target) {
          setLastResolved({ ...target, status: "resolved", resolution: "ignored" });
        }
      } else {
        resolveReportLocal(id, "ignored");
      }
    }
    showToast(
      target?.category === "exam_question"
        ? "Đã bỏ qua — giữ nguyên câu hỏi trong ngân hàng đề."
        : "Đã bỏ qua báo cáo — giữ nguyên nội dung.",
    );
    const nextPending = reports.filter((r) => r.id !== id && r.status === "pending");
    setSelectedId(nextPending[0]?.id ?? null);
  }

  async function handleDelete(id) {
    const target = reports.find((report) => report.id === id);
    const reloaded = await reloadModeratorCommunityReportsAfterResolve(id, "delete");
    if (reloaded) {
      setCommunityReports(reloaded);
      if (target) {
        setLastResolved({ ...target, status: "resolved", resolution: "deleted" });
      }
    } else {
      resolveReportLocal(id, "deleted");
    }
    showToast("Đã xóa nội dung vi phạm.");
    const nextPending = reports.filter((r) => r.id !== id && r.status === "pending");
    setSelectedId(nextPending[0]?.id ?? null);
  }

  function handleForwardExamReport(id) {
    resolveReportLocal(id, "forwarded_admin");
    showToast("Đã ghi nhận — chuyển Admin duyệt chỉnh sửa đề thi.");
    const nextPending = reports.filter((r) => r.id !== id && r.status === "pending");
    setSelectedId(nextPending[0]?.id ?? null);
  }

  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        Xử lý báo cáo cộng đồng và câu hỏi đề thi ôn tập. Báo cáo đề được Moderator rà soát,
        Admin duyệt trước khi cập nhật ngân hàng câu hỏi.
      </p>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.metricIconPending}`}>
            <FontAwesomeIcon icon={faFlag} />
          </span>
          <div>
            <p className={styles.metricValue}>{pendingCount}</p>
            <p className={styles.metricLabel}>Chờ xử lý</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.metricIconResolved}`}>
            <FontAwesomeIcon icon={faCheck} />
          </span>
          <div>
            <p className={styles.metricValue}>{resolvedCount}</p>
            <p className={styles.metricLabel}>Đã xử lý</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.metricIconTotal}`}>
            <FontAwesomeIcon icon={faInbox} />
          </span>
          <div>
            <p className={styles.metricValue}>{reports.length}</p>
            <p className={styles.metricLabel}>Tổng báo cáo</p>
          </div>
        </div>
      </div>

      <div className={styles.stepper}>
        <div className={styles.step}>
          <span className={styles.stepNum}>1</span>
          <span className={styles.stepText}>
            <strong>Chọn báo cáo</strong>
            Xem nội dung vi phạm
          </span>
        </div>
        <span className={styles.stepDivider} aria-hidden />
        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <span className={styles.stepText}>
            <strong>Quyết định</strong>
            Bỏ qua hoặc xóa nội dung
          </span>
        </div>
        <span className={styles.stepDivider} aria-hidden />
        <div className={styles.step}>
          <span className={`${styles.stepNum} ${styles.stepNumMuted}`}>3</span>
          <span className={styles.stepText}>
            <strong>Lưu vết</strong>
            Ghi nhận xử lý
          </span>
        </div>
      </div>

      {lastResolved ? (
        <div className={styles.banner} role="status">
          <FontAwesomeIcon icon={faCheck} className={styles.bannerIcon} />
          <div className={styles.bannerBody}>
            <p className={styles.bannerTitle}>Đã xử lý báo cáo #{lastResolved.code}</p>
            <p className={styles.bannerMeta}>
              {lastResolved.resolution === "deleted"
                ? "Đã xóa nội dung"
                : lastResolved.resolution === "forwarded_admin"
                  ? "Đã chuyển Admin duyệt sửa đề"
                  : "Đã bỏ qua báo cáo"}
            </p>
          </div>
          <button
            type="button"
            className={styles.bannerClose}
            aria-label="Đóng"
            onClick={() => setLastResolved(null)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ) : null}

      <div className={styles.workspace}>
        <div className={styles.queueCol}>
          <div className={styles.queueToolbar}>
            <div className={styles.queueToolbarHead}>
              <h2 className={styles.queueHeading}>Hàng chờ</h2>
              <span className={styles.queueCount}>{filtered.length}</span>
            </div>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Tìm mã, @user, lý do..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm báo cáo"
            />
            <div className={styles.filterTrack} role="group" aria-label="Lọc trạng thái">
              {TAB_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`${styles.filterBtn} ${tab === opt.id ? styles.filterBtnActive : ""}`}
                  onClick={() => setTab(opt.id)}
                >
                  {opt.label}
                  {opt.id === "pending" ? ` (${pendingCount})` : ""}
                </button>
              ))}
            </div>
            <div className={styles.filterTrack} role="group" aria-label="Lọc loại báo cáo">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`${styles.filterBtn} ${category === opt.id ? styles.filterBtnActive : ""}`}
                  onClick={() => setCategory(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.queueScroll}>
            {filtered.length === 0 ? (
              <div className={styles.emptyQueue}>
                <FontAwesomeIcon icon={faInbox} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Không có báo cáo</p>
                <p className={styles.emptyDesc}>Thử đổi tab hoặc từ khóa tìm kiếm.</p>
              </div>
            ) : (
              <ul className={styles.queueList}>
                {filtered.map((report) => {
                  const isActive = selectedId === report.id;
                  return (
                    <li key={report.id}>
                      <button
                        type="button"
                        className={`${styles.queueCard} ${isActive ? styles.queueCardActive : ""}`}
                        onClick={() => selectReport(report.id)}
                      >
                        <div className={styles.queueCardInner}>
                          <span className={styles.queueAvatar} aria-hidden>
                            {report.reporterInitial}
                          </span>
                          <div className={styles.queueCardBody}>
                            <p className={styles.queueTitle}>{report.code}</p>
                            <p className={styles.queueReason}>{report.snippet}</p>
                            <div className={styles.tagRow}>
                              <span className={`${styles.tag} ${styles.tagMuted}`}>
                                {CATEGORY_LABELS[report.category] ?? report.category}
                              </span>
                              <ReasonTag reason={report.reason} />
                              <span
                                className={`${styles.tag} ${
                                  report.status === "pending"
                                    ? styles.tagPending
                                    : styles.tagResolved
                                }`}
                              >
                                {STATUS_LABELS[report.status]}
                              </span>
                            </div>
                            <p className={styles.queueFooter}>
                              {report.reporterUsername}
                              {report.category === "exam_question"
                                ? ` · ${report.examId} · Câu ${report.questionIndex}`
                                : ` → ${report.reportedUser.username}`}{" "}
                              · {report.timeLabel}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.detailCol}>
          {!selected ? (
            <div className={styles.detailEmpty}>
              <FontAwesomeIcon icon={faMousePointer} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Chọn một báo cáo</p>
              <p className={styles.emptyDesc}>Chi tiết và thao tác xử lý hiển thị tại đây.</p>
            </div>
          ) : (
            <>
              <header className={styles.detailHead}>
                <h3 className={styles.detailTitle}>Chi tiết báo cáo #{selected.code}</h3>
                <p className={styles.detailSub}>
                  Báo cáo lúc {selected.reportedAt} ·{" "}
                  <span
                    className={`${styles.tag} ${
                      selected.status === "pending" ? styles.tagPending : styles.tagResolved
                    }`}
                  >
                    {STATUS_LABELS[selected.status]}
                  </span>
                </p>
              </header>

              <div className={styles.detailScroll}>
                {selected.status === "resolved" ? (
                  <div className={styles.resolutionBox}>
                    <p className={styles.resolutionTitle}>Đã xử lý</p>
                    <p className={styles.resolutionText}>
                      {selected.resolution === "deleted"
                        ? "Nội dung vi phạm đã được xóa."
                        : selected.resolution === "forwarded_admin"
                          ? "Moderator đã ghi nhận và chuyển Admin duyệt chỉnh sửa đề."
                          : "Báo cáo đã bỏ qua — nội dung được giữ nguyên."}
                    </p>
                  </div>
                ) : null}

                {selected.category === "exam_question" ? (
                  <>
                    <div className={styles.violationBox}>
                      <p className={styles.violationLabel}>Câu hỏi được báo cáo</p>
                      <blockquote className={styles.violationQuote}>
                        {selected.violatingContent}
                      </blockquote>
                      {selected.markedAnswer ? (
                        <p className={styles.reporterReasonLabel}>
                          Đáp án hệ thống đang ghi: <strong>{selected.markedAnswer}</strong>
                        </p>
                      ) : null}
                      <div className={styles.reporterReason}>
                        <p className={styles.reporterReasonLabel}>
                          Lý do từ {selected.reporterUsername}:
                        </p>
                        <p>{selected.reporterReason}</p>
                      </div>
                    </div>

                    <dl className={styles.metaGrid}>
                      <div className={styles.metaItem}>
                        <dt>Mã đề</dt>
                        <dd>{selected.examId}</dd>
                      </div>
                      <div className={styles.metaItem}>
                        <dt>Môn học</dt>
                        <dd>{selected.courseCode}</dd>
                      </div>
                      <div className={styles.metaItem}>
                        <dt>Câu hỏi</dt>
                        <dd>Câu {selected.questionIndex}</dd>
                      </div>
                      <div className={styles.metaItem}>
                        <dt>Người xử lý</dt>
                        <dd>{EXAM_REPORT_ROUTING.assigneeLabel}</dd>
                      </div>
                      <div className={styles.metaItem}>
                        <dt>Escalate</dt>
                        <dd>{EXAM_REPORT_ROUTING.escalationLabel}</dd>
                      </div>
                      <div className={styles.metaItem}>
                        <dt>Lý do</dt>
                        <dd>{REASON_META[selected.reason]?.label ?? selected.reason}</dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <>
                <div className={styles.userCard}>
                  <div className={styles.userIdentity}>
                    <span className={styles.userAvatar} aria-hidden>
                      {selected.reportedUser.initial}
                    </span>
                    <div>
                      <p className={styles.userName}>{selected.reportedUser.username}</p>
                      <p className={styles.userMeta}>
                        Tham gia: {selected.reportedUser.joinedAt}
                      </p>
                    </div>
                  </div>
                  <TrustScore score={selected.reportedUser.trustScore} />
                </div>

                <div className={styles.violationBox}>
                  <p className={styles.violationLabel}>Nội dung vi phạm</p>
                  <blockquote className={styles.violationQuote}>
                    &ldquo;{selected.violatingContent}&rdquo;
                  </blockquote>
                  <div className={styles.reporterReason}>
                    <p className={styles.reporterReasonLabel}>
                      Lý do từ {selected.reporterUsername}:
                    </p>
                    <p>{selected.reporterReason}</p>
                  </div>
                </div>

                <dl className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <dt>Người báo cáo</dt>
                    <dd>{selected.reporterUsername}</dd>
                  </div>
                  <div className={styles.metaItem}>
                    <dt>Tài khoản bị báo cáo</dt>
                    <dd>
                      <Link to="/moderator/violations" className={styles.linkUser}>
                        {selected.reportedUser.username}
                      </Link>
                    </dd>
                  </div>
                  <div className={styles.metaItem}>
                    <dt>Mã báo cáo</dt>
                    <dd>{selected.code}</dd>
                  </div>
                  <div className={styles.metaItem}>
                    <dt>Lý do</dt>
                    <dd>{REASON_META[selected.reason]?.label ?? selected.reason}</dd>
                  </div>
                </dl>
                  </>
                )}
              </div>

              <footer className={styles.detailActions}>
                {selected.status === "pending" ? (
                  selected.category === "exam_question" ? (
                    <>
                      <Button look="outline" onClick={() => handleDismiss(selected.id)}>
                        Bỏ qua — giữ câu hỏi
                      </Button>
                      <Button onClick={() => handleForwardExamReport(selected.id)}>
                        Ghi nhận — chuyển Admin sửa đề
                      </Button>
                    </>
                  ) : (
                    <>
                    <Button look="outline" onClick={() => handleDismiss(selected.id)}>
                      Bỏ qua báo cáo
                    </Button>
                    <Button onClick={() => handleDelete(selected.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                      Xóa nội dung
                    </Button>
                    </>
                  )
                ) : (
                  <p className={styles.detailActionsMuted}>
                    Báo cáo đã đóng. Chọn báo cáo khác trong hàng chờ.
                  </p>
                )}
              </footer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
