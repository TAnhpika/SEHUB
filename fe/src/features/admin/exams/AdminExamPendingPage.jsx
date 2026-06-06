import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faChevronDown,
  faChevronUp,
  faClipboardList,
  faClock,
  faFileLines,
  faInbox,
  faMousePointer,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import AdminExamRejectModal from "@/features/admin/exams/AdminExamRejectModal";
import {
  EXAM_STATUS_LABELS,
  MOCK_OCR_QUESTIONS,
  approvePendingExam,
  getAdminApprovedExams,
  getAdminPendingExams,
  getAdminRejectedExams,
  getSemesterLabel,
  getTrackLabel,
  rejectPendingExam,
} from "@/features/admin/exams/adminExamData";
import { getAdminDocumentsSubjectUrl } from "@/features/admin/documents/adminDocumentPaths";
import pendingStyles from "@/features/admin/exams/AdminExamPendingPage.module.css";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import styles from "@/features/admin/shared/adminPage.module.css";

const FILTER_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "urgent", label: "Ưu tiên" },
  { id: "final", label: "Cuối kỳ" },
  { id: "practice", label: "Thực hành" },
];

function publishedExamDocumentsLink(item) {
  return getAdminDocumentsSubjectUrl({
    code: item.code,
    semester: item.semester,
  });
}

function modInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function AdminExamPendingPage() {
  const { showToast } = useToast();
  const [pending, setPending] = useState(getAdminPendingExams);
  const [approved, setApproved] = useState(getAdminApprovedExams);
  const [rejected, setRejected] = useState(getAdminRejectedExams);
  const [selectedId, setSelectedId] = useState(() => getAdminPendingExams()[0]?.id ?? null);
  const [filter, setFilter] = useState("all");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [lastApproved, setLastApproved] = useState(null);
  const [lastRejected, setLastRejected] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState("all");

  const urgentCount = pending.filter((p) => p.urgent).length;

  const filteredPending = useMemo(() => {
    return pending.filter((item) => {
      if (filter === "urgent") return item.urgent;
      if (filter === "final") return item.typeKey === "final";
      if (filter === "practice") return item.typeKey === "practice";
      return true;
    });
  }, [pending, filter]);

  const pendingPage = useAdminPagination(
    filteredPending,
    ADMIN_PAGE_SIZES.examPending,
    [filter, pending],
  );

  const selected =
    filteredPending.find((p) => p.id === selectedId) ??
    pending.find((p) => p.id === selectedId) ??
    null;

  const historyAll = useMemo(() => {
    const rows = [
      ...approved.map((item) => ({
        key: `a-${item.id}-${item.approvedAt}`,
        kind: "approved",
        date: item.approvedAt,
        item,
      })),
      ...rejected.map((item) => ({
        key: `r-${item.id}-${item.rejectedAt}`,
        kind: "rejected",
        date: item.rejectedAt,
        item,
      })),
    ];
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [approved, rejected]);

  const historyTotal = approved.length + rejected.length;

  function refresh() {
    const nextPending = getAdminPendingExams();
    setPending(nextPending);
    setApproved(getAdminApprovedExams());
    setRejected(getAdminRejectedExams());
    if (selectedId && !nextPending.some((p) => p.id === selectedId)) {
      setSelectedId(nextPending[0]?.id ?? null);
    }
  }

  function handleApprove(item) {
    const created = approvePendingExam(item.id);
    refresh();
    setLastRejected(null);
    if (created) {
      setLastApproved({
        code: item.code,
        title: item.title,
        type: item.type,
        typeKey: item.typeKey,
        semester: item.semester,
      });
      setHistoryTab("approved");
      setHistoryOpen(true);
      showToast(`Đã duyệt [${item.code}] → ${EXAM_STATUS_LABELS.published}.`);
    } else {
      showToast("Không tìm thấy đề.");
    }
  }

  function handleReject(payload) {
    if (!rejectTarget) return;
    const entry = rejectPendingExam(rejectTarget.id, payload);
    refresh();
    setLastApproved(null);
    if (entry) {
      setLastRejected(entry);
      setHistoryTab("rejected");
      setHistoryOpen(true);
      showToast(`Đã từ chối [${entry.code}].`);
    }
    setRejectTarget(null);
  }

  return (
    <AdminPageLayout
      title="Duyệt đề từ Moderator"
      subtitle="Xem trước nội dung, duyệt xuất bản hoặc từ chối kèm lý do để Mod chỉnh sửa."
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý đề thi", to: "/admin/exams" },
        { label: "Chờ duyệt" },
      ]}
      actions={
        <Button look="outline" to="/admin/exams">
          Kho đề Admin
        </Button>
      }
    >
      <div className={pendingStyles.page}>
        <div className={pendingStyles.metrics}>
          <div className={pendingStyles.metric}>
            <span className={`${pendingStyles.metricIcon} ${pendingStyles.metricIconPending}`}>
              <FontAwesomeIcon icon={faClock} />
            </span>
            <div>
              <p className={pendingStyles.metricValue}>{pending.length}</p>
              <p className={pendingStyles.metricLabel}>Chờ duyệt</p>
            </div>
          </div>
          <div className={pendingStyles.metric}>
            <span className={`${pendingStyles.metricIcon} ${pendingStyles.metricIconUrgent}`}>
              <FontAwesomeIcon icon={faClipboardList} />
            </span>
            <div>
              <p className={pendingStyles.metricValue}>{urgentCount}</p>
              <p className={pendingStyles.metricLabel}>Ưu tiên</p>
            </div>
          </div>
          <div className={pendingStyles.metric}>
            <span className={`${pendingStyles.metricIcon} ${pendingStyles.metricIconApproved}`}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <div>
              <p className={pendingStyles.metricValue}>{approved.length}</p>
              <p className={pendingStyles.metricLabel}>Đã duyệt (phiên)</p>
            </div>
          </div>
        </div>

        <div className={pendingStyles.stepper}>
          <div className={pendingStyles.step}>
            <span className={pendingStyles.stepNum}>1</span>
            <span className={pendingStyles.stepText}>
              <strong>Moderator</strong>
              Gửi đề & file
            </span>
          </div>
          <span className={pendingStyles.stepDivider} aria-hidden />
          <div className={pendingStyles.step}>
            <span className={pendingStyles.stepNum}>2</span>
            <span className={pendingStyles.stepText}>
              <strong>Admin</strong>
              Rà soát OCR / mô tả
            </span>
          </div>
          <span className={pendingStyles.stepDivider} aria-hidden />
          <div className={pendingStyles.step}>
            <span className={`${pendingStyles.stepNum} ${pendingStyles.stepNumMuted}`}>3</span>
            <span className={pendingStyles.stepText}>
              <strong>Duyệt</strong>
              {EXAM_STATUS_LABELS.published}
            </span>
          </div>
          <div className={pendingStyles.step}>
            <span className={`${pendingStyles.stepNum} ${pendingStyles.stepNumMuted}`}>3</span>
            <span className={pendingStyles.stepText}>
              <strong>Từ chối</strong>
              Mod gửi lại
            </span>
          </div>
        </div>

        {lastApproved ? (
          <div className={`${pendingStyles.banner} ${pendingStyles.bannerSuccess}`} role="status">
            <FontAwesomeIcon icon={faCheck} className={pendingStyles.bannerIcon} />
            <div className={pendingStyles.bannerBody}>
              <p className={pendingStyles.bannerTitle}>
                Đã duyệt [{lastApproved.code}] — {lastApproved.title}
              </p>
              <p className={pendingStyles.bannerMeta}>
                {lastApproved.type} · {getSemesterLabel(lastApproved.semester)} ·{" "}
                <Link to={publishedExamDocumentsLink(lastApproved)} className={styles.link}>
                  Xem tài liệu môn ({lastApproved.code}) →
                </Link>
              </p>
            </div>
            <button
              type="button"
              className={pendingStyles.bannerClose}
              aria-label="Đóng"
              onClick={() => setLastApproved(null)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ) : null}

        {lastRejected ? (
          <div className={`${pendingStyles.banner} ${pendingStyles.bannerInfo}`} role="status">
            <FontAwesomeIcon icon={faBan} className={pendingStyles.bannerIcon} />
            <div className={pendingStyles.bannerBody}>
              <p className={pendingStyles.bannerTitle}>
                Đã từ chối [{lastRejected.code}] — {lastRejected.title}
              </p>
              <p className={pendingStyles.bannerMeta}>
                {lastRejected.submittedBy} · {lastRejected.rejectedAt}
              </p>
              <p className={pendingStyles.bannerReason}>{lastRejected.rejectReasonFull}</p>
            </div>
            <button
              type="button"
              className={pendingStyles.bannerClose}
              aria-label="Đóng"
              onClick={() => setLastRejected(null)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ) : null}

        <div className={pendingStyles.workspace}>
          <div className={pendingStyles.queueCol}>
            <div className={pendingStyles.queueToolbar}>
              <div className={pendingStyles.queueToolbarHead}>
                <h2 className={pendingStyles.queueHeading}>Hàng chờ</h2>
                <span className={pendingStyles.queueCount}>{filteredPending.length}</span>
              </div>
              <div className={pendingStyles.filterTrack} role="group" aria-label="Lọc">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${pendingStyles.filterBtn} ${
                      filter === opt.id ? pendingStyles.filterBtnActive : ""
                    }`}
                    onClick={() => setFilter(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={pendingStyles.queueScroll}>
              {filteredPending.length === 0 ? (
                <div className={pendingStyles.emptyQueue}>
                  <FontAwesomeIcon icon={faInbox} className={pendingStyles.emptyIcon} />
                  <p className={pendingStyles.emptyTitle}>Trống</p>
                  <p className={pendingStyles.emptyDesc}>
                    {pending.length === 0
                      ? "Không còn đề chờ duyệt."
                      : "Không có đề khớp bộ lọc."}
                  </p>
                </div>
              ) : (
                <ul className={pendingStyles.queueList}>
                  {pendingPage.pageItems.map((item) => {
                    const isActive = selectedId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`${pendingStyles.queueCard} ${
                            isActive ? pendingStyles.queueCardActive : ""
                          } ${item.urgent ? pendingStyles.queueCardUrgent : ""}`}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <div className={pendingStyles.queueCardInner}>
                            <span className={pendingStyles.radio} aria-hidden />
                            <div className={pendingStyles.queueCardBody}>
                              <p className={pendingStyles.queueCode}>{item.code}</p>
                              <p className={pendingStyles.queueName}>{item.title}</p>
                              <div className={pendingStyles.tagRow}>
                                <span
                                  className={`${pendingStyles.tag} ${
                                    item.typeKey === "final"
                                      ? pendingStyles.tagFinal
                                      : pendingStyles.tagPractice
                                  }`}
                                >
                                  {item.type}
                                </span>
                                <span className={`${pendingStyles.tag} ${pendingStyles.tagNeutral}`}>
                                  {getSemesterLabel(item.semester)}
                                </span>
                                {item.urgent ? (
                                  <span className={`${pendingStyles.tag} ${pendingStyles.tagUrgent}`}>
                                    Ưu tiên
                                  </span>
                                ) : null}
                              </div>
                              <div className={pendingStyles.queueFooter}>
                                <span className={pendingStyles.modAvatar}>
                                  {modInitials(item.submittedBy)}
                                </span>
                                <span>
                                  {item.submittedBy} · {item.submittedAt}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <AdminTableFooter
              rangeStart={pendingPage.rangeStart}
              rangeEnd={pendingPage.rangeEnd}
              total={pendingPage.total}
              unit="đề chờ"
              currentPage={pendingPage.safePage}
              totalPages={pendingPage.totalPages}
              onPageChange={pendingPage.handlePageChange}
              ariaLabel="Phân trang đề chờ duyệt"
              compact
            />
          </div>

          <div className={pendingStyles.detailCol}>
            {!selected ? (
              <div className={pendingStyles.detailEmpty}>
                <FontAwesomeIcon icon={faMousePointer} className={pendingStyles.emptyIcon} />
                <p className={pendingStyles.emptyTitle}>Chọn một đề để rà soát</p>
                <p className={pendingStyles.emptyDesc}>
                  Cuối kỳ: kiểm tra OCR và đáp án. Thực hành: đọc mô tả và hướng dẫn GitHub.
                </p>
              </div>
            ) : (
              <>
                <div className={pendingStyles.detailHead}>
                  <div className={pendingStyles.detailStatus}>
                    <span className={pendingStyles.detailStatusDot} />
                    Chờ duyệt
                  </div>
                  <h3 className={pendingStyles.detailTitle}>{selected.title}</h3>
                  <dl className={pendingStyles.detailMetaGrid}>
                    <div className={pendingStyles.metaItem}>
                      <dt>Mã môn</dt>
                      <dd>{selected.code}</dd>
                    </div>
                    <div className={pendingStyles.metaItem}>
                      <dt>Loại đề</dt>
                      <dd>{selected.type}</dd>
                    </div>
                    <div className={pendingStyles.metaItem}>
                      <dt>Ngành</dt>
                      <dd>{getTrackLabel(selected.track)}</dd>
                    </div>
                    <div className={pendingStyles.metaItem}>
                      <dt>Kỳ học</dt>
                      <dd>{getSemesterLabel(selected.semester)}</dd>
                    </div>
                    <div className={pendingStyles.metaItem}>
                      <dt>Moderator</dt>
                      <dd>{selected.submittedBy}</dd>
                    </div>
                    <div className={pendingStyles.metaItem}>
                      <dt>Ngày gửi</dt>
                      <dd>{selected.submittedAt}</dd>
                    </div>
                  </dl>
                  <div className={pendingStyles.fileCard}>
                    <span className={pendingStyles.fileIcon}>
                      <FontAwesomeIcon icon={faFileLines} />
                    </span>
                    <div>
                      <p className={pendingStyles.fileName}>{selected.fileName}</p>
                      <p className={pendingStyles.fileHint}>File đính kèm từ Mod</p>
                    </div>
                  </div>
                </div>

                <div className={pendingStyles.detailBody}>
                  {selected.typeKey === "final" ? (
                    <>
                      <p className={pendingStyles.sectionTitle}>
                        Xem trước OCR ({MOCK_OCR_QUESTIONS.length} câu)
                      </p>
                      <div className={pendingStyles.previewBox}>
                        <ul className={pendingStyles.ocrList}>
                          {MOCK_OCR_QUESTIONS.map((q, index) => (
                            <li key={q.id} className={pendingStyles.ocrItem}>
                              <p className={pendingStyles.ocrQuestion}>
                                {index + 1}. {q.text}
                              </p>
                              <ol className={pendingStyles.ocrOptions}>
                                {q.options.map((opt, i) => (
                                  <li
                                    key={opt}
                                    className={
                                      i === q.correct ? pendingStyles.ocrCorrect : undefined
                                    }
                                  >
                                    {String.fromCharCode(65 + i)}. {opt}
                                    {i === q.correct ? " ✓" : ""}
                                  </li>
                                ))}
                              </ol>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className={pendingStyles.hintBox}>
                        Sau khi duyệt, đề cuối kỳ có {MOCK_OCR_QUESTIONS.length} câu trên kho
                        đề — Premium được làm bài online.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={pendingStyles.sectionTitle}>Mô tả yêu cầu</p>
                      <div className={pendingStyles.previewBox}>
                        <p className={pendingStyles.contentBlock}>
                          {selected.description || "—"}
                        </p>
                      </div>
                      <p className={pendingStyles.sectionTitle}>Hướng dẫn nộp GitHub</p>
                      <div className={pendingStyles.previewBox}>
                        <p className={pendingStyles.contentBlock}>
                          {selected.githubGuide || "—"}
                        </p>
                      </div>
                      <p className={pendingStyles.hintBox}>
                        Sau khi duyệt, sinh viên Premium nộp link repository — Mod/Admin chấm
                        Pass/Fail.
                      </p>
                    </>
                  )}
                </div>

                <div className={pendingStyles.detailActions}>
                  <Button onClick={() => handleApprove(selected)}>
                    Duyệt & {EXAM_STATUS_LABELS.published}
                  </Button>
                  <Button
                    look="outline"
                    className={pendingStyles.rejectBtn}
                    onClick={() => setRejectTarget(selected)}
                  >
                    Từ chối
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={pendingStyles.history}>
          <button
            type="button"
            className={pendingStyles.historyToggle}
            onClick={() => setHistoryOpen((o) => !o)}
            aria-expanded={historyOpen}
          >
            <div>
              <p className={pendingStyles.historyTitle}>
                Lịch sử xử lý trong phiên
              </p>
              <p className={pendingStyles.historyMeta}>
                {historyTotal} đề đã xử lý · {approved.length} duyệt · {rejected.length}{" "}
                từ chối
              </p>
            </div>
            <FontAwesomeIcon
              icon={historyOpen ? faChevronUp : faChevronDown}
              className={pendingStyles.historyChevron}
            />
          </button>

          {historyOpen ? (
            <>
              <div className={pendingStyles.historyTabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={historyTab === "all"}
                  className={`${pendingStyles.historyTab} ${
                    historyTab === "all" ? pendingStyles.historyTabActive : ""
                  }`}
                  onClick={() => setHistoryTab("all")}
                >
                  Tất cả
                  <span className={pendingStyles.historyTabCount}>{historyTotal}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={historyTab === "approved"}
                  className={`${pendingStyles.historyTab} ${
                    historyTab === "approved" ? pendingStyles.historyTabActive : ""
                  }`}
                  onClick={() => setHistoryTab("approved")}
                >
                  Đã duyệt
                  <span className={pendingStyles.historyTabCount}>{approved.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={historyTab === "rejected"}
                  className={`${pendingStyles.historyTab} ${
                    historyTab === "rejected" ? pendingStyles.historyTabActive : ""
                  }`}
                  onClick={() => setHistoryTab("rejected")}
                >
                  Đã từ chối
                  <span className={pendingStyles.historyTabCount}>{rejected.length}</span>
                </button>
              </div>

              {historyTab === "all" ? (
                historyAll.length > 0 ? (
                  <div className={pendingStyles.historyTable}>
                    {historyAll.map((row) =>
                      row.kind === "approved" ? (
                        <div key={row.key} className={pendingStyles.historyRow}>
                          <div>
                            <p className={pendingStyles.historyExam}>
                              [{row.item.code}] {row.item.title}
                            </p>
                            <p className={pendingStyles.historySub}>
                              {row.item.type} · {row.item.submittedBy} · {row.date}
                              {row.item.questionCount > 0
                                ? ` · ${row.item.questionCount} câu`
                                : ""}
                            </p>
                            <Link
                              to={publishedExamDocumentsLink(row.item)}
                              className={pendingStyles.historyLink}
                            >
                              Xem tài liệu môn ({row.item.code}) →
                            </Link>
                          </div>
                          <p
                            className={`${pendingStyles.historyOutcome} ${pendingStyles.historyOutcomeApproved}`}
                          >
                            {EXAM_STATUS_LABELS.published}
                          </p>
                        </div>
                      ) : (
                        <div key={row.key} className={pendingStyles.historyRow}>
                          <div>
                            <p className={pendingStyles.historyExam}>
                              [{row.item.code}] {row.item.title}
                            </p>
                            <p className={pendingStyles.historySub}>
                              {row.item.type} · {row.item.submittedBy} · {row.date}
                            </p>
                          </div>
                          <p
                            className={`${pendingStyles.historyOutcome} ${pendingStyles.historyOutcomeRejected}`}
                          >
                            {row.item.rejectReasonFull}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className={pendingStyles.historyEmpty}>
                    Chưa xử lý đề nào trong phiên này.
                  </p>
                )
              ) : historyTab === "approved" ? (
                approved.length > 0 ? (
                  <div className={pendingStyles.historyTable}>
                    {approved.map((item) => (
                      <div
                        key={`${item.id}-${item.approvedAt}`}
                        className={pendingStyles.historyRow}
                      >
                        <div>
                          <p className={pendingStyles.historyExam}>
                            [{item.code}] {item.title}
                          </p>
                          <p className={pendingStyles.historySub}>
                            {item.type} · {item.submittedBy} · {item.approvedAt}
                            {item.questionCount > 0
                              ? ` · ${item.questionCount} câu`
                              : ""}
                          </p>
                          <Link
                            to={publishedExamDocumentsLink(item)}
                            className={pendingStyles.historyLink}
                          >
                            Xem tài liệu môn ({item.code}) →
                          </Link>
                        </div>
                        <p
                          className={`${pendingStyles.historyOutcome} ${pendingStyles.historyOutcomeApproved}`}
                        >
                          {EXAM_STATUS_LABELS.published}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={pendingStyles.historyEmpty}>
                    Chưa duyệt đề nào trong phiên này.
                  </p>
                )
              ) : rejected.length > 0 ? (
                <div className={pendingStyles.historyTable}>
                  {rejected.map((item) => (
                    <div key={`${item.id}-${item.rejectedAt}`} className={pendingStyles.historyRow}>
                      <div>
                        <p className={pendingStyles.historyExam}>
                          [{item.code}] {item.title}
                        </p>
                        <p className={pendingStyles.historySub}>
                          {item.type} · {item.submittedBy} · {item.rejectedAt}
                        </p>
                      </div>
                      <p
                        className={`${pendingStyles.historyOutcome} ${pendingStyles.historyOutcomeRejected}`}
                      >
                        {item.rejectReasonFull}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={pendingStyles.historyEmpty}>
                  Chưa từ chối đề nào trong phiên này.
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>

      <AdminExamRejectModal
        open={Boolean(rejectTarget)}
        examTitle={rejectTarget ? `[${rejectTarget.code}] ${rejectTarget.title}` : ""}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </AdminPageLayout>
  );
}

export default AdminExamPendingPage;
