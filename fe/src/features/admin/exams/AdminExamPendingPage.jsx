import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faChevronDown,
  faChevronUp,
  faClipboardList,
  faClock,
  faDownload,
  faFileLines,
  faInbox,
  faMousePointer,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { ACTION_LOADING } from "@/utils/actionLoadingLabels";
import { useScrollBoundaryChain } from "@/hooks/useScrollBoundaryChain";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { StaffQueueSkeleton } from "@/common/Skeleton/StaffSkeleton";
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
  loadAdminExamById,
  loadAdminPendingExams,
  loadAdminExamReviewHistory,
  rejectPendingExam,
} from "@/features/admin/exams/adminExamData";
import { getAdminDocumentsSubjectUrl } from "@/features/admin/documents/adminDocumentPaths";
import { getExamAssetFileName, getPrimaryExamAttachment, resolveExamAssetUrl } from "@/utils/examAssetUrl";
import {
  getExamDisplayCode,
  getExamDisplayTitle,
  getExamSubjectCode,
} from "@/utils/examDisplay";
import { downloadExamAttachment } from "@/api/examsApi";
import ExamAttachmentViewer from "@/features/exams/ExamAttachmentViewer/ExamAttachmentViewer";
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

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function publishedExamDocumentsLink(item) {
  return getAdminDocumentsSubjectUrl({
    code: getExamSubjectCode(item),
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
  const [pending, setPending] = useState(() => getAdminPendingExams());
  const [approved, setApproved] = useState(getAdminApprovedExams);
  const [rejected, setRejected] = useState(getAdminRejectedExams);
  const [selectedId, setSelectedId] = useState(() => getAdminPendingExams()[0]?.id ?? null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [filter, setFilter] = useState("all");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [lastApproved, setLastApproved] = useState(null);
  const [lastRejected, setLastRejected] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const previewQuestionsRef = useRef(null);

  useScrollBoundaryChain(previewQuestionsRef);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadAdminPendingExams(), loadAdminExamReviewHistory()])
      .then(([items, history]) => {
        if (cancelled) return;
        setPending(items);
        setApproved(history.approved);
        setRejected(history.rejected);
        if (items.length === 0) {
          setSelectedId(null);
          return;
        }
        if (!items.some((item) => item.id === selectedId)) {
          setSelectedId(items[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) showToast("Không tải hàng chờ duyệt.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId || USE_MOCK) {
      setSelectedDetail(null);
      return undefined;
    }

    let cancelled = false;
    loadAdminExamById(selectedId).then((detail) => {
      if (!cancelled) setSelectedDetail(detail);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

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
  const attachmentSource = selectedDetail ?? selected;
  const selectedAttachment = attachmentSource ? getPrimaryExamAttachment(attachmentSource) : null;
  const attachmentExamId = selectedDetail?.id ?? selected?.id ?? null;

  async function handleDownloadAttachment() {
    if (!selectedAttachment?.id || !attachmentExamId || actionLoading) return;

    try {
      await downloadExamAttachment(attachmentExamId, selectedAttachment.id, selectedAttachment.name, {
        contentType: selectedAttachment.contentType,
        fileName: selectedAttachment.name,
      });
    } catch {
      showToast("Không tải được file đính kèm.");
    }
  }

  const previewQuestions = USE_MOCK
    ? MOCK_OCR_QUESTIONS
    : (selectedDetail?.questionsData ?? []);

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

  async function refresh() {
    const nextPending = await loadAdminPendingExams();
    const history = await loadAdminExamReviewHistory();
    setPending(nextPending);
    setApproved(history.approved);
    setRejected(history.rejected);
    if (selectedId && !nextPending.some((p) => p.id === selectedId)) {
      setSelectedId(nextPending[0]?.id ?? null);
    }
  }

  async function handleApprove(item) {
    setActionLoading(true);
    try {
      const created = await approvePendingExam(item.id);
      await refresh();
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
        showToast(`Đã duyệt [${getExamDisplayCode(item)}] → ${EXAM_STATUS_LABELS.published}.`);
      } else {
        showToast("Không tìm thấy đề.");
      }
    } catch (error) {
      showToast(error?.message ?? "Không duyệt được đề.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(payload) {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      const entry = await rejectPendingExam(rejectTarget.id, payload);
      await refresh();
      setLastApproved(null);
      if (entry) {
        setLastRejected(entry);
        setHistoryTab("rejected");
        setHistoryOpen(true);
        showToast(`Đã từ chối [${getExamDisplayCode(entry)}].`);
      }
      setRejectTarget(null);
    } catch (error) {
      showToast(error?.message ?? "Không từ chối được đề.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AdminPageLayout
      title="Duyệt đề từ Moderator"
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
                Đã duyệt [{getExamDisplayCode(lastApproved)}] — {getExamDisplayTitle(lastApproved)}
              </p>
              <p className={pendingStyles.bannerMeta}>
                {lastApproved.type} · {getSemesterLabel(lastApproved.semester)} ·{" "}
                <Link to={publishedExamDocumentsLink(lastApproved)} className={styles.link}>
                  Xem tài liệu môn ({getExamSubjectCode(lastApproved)}) →
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
                Đã từ chối [{getExamDisplayCode(lastRejected)}] — {getExamDisplayTitle(lastRejected)}
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
              {loading ? (
                <StaffQueueSkeleton aria-label="Đang tải hàng chờ đề thi" />
              ) : filteredPending.length === 0 ? (
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
                              <p className={pendingStyles.queueCode}>{getExamSubjectCode(item)}</p>
                              <p className={pendingStyles.queueName}>
                                {item.revisionOfExamId ? (
                                  <span className={pendingStyles.revisionBadge}>Rev · </span>
                                ) : null}
                                {getExamDisplayTitle(item)}
                              </p>
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
                  <h3 className={pendingStyles.detailTitle}>{getExamDisplayTitle(selected)}</h3>
                  {selected.revisionOfExamId ? (
                    <div className={pendingStyles.revisionBanner}>
                      <span className={pendingStyles.revisionBadge}>Bản cập nhật</span>
                      <span>
                        Thay thế đề public: {selected.revisionSourceTitle ?? selected.revisionSourceCode ?? "—"}
                        . Duyệt sẽ archive bản cũ và publish nội dung mới.
                      </span>
                    </div>
                  ) : null}
                  <dl className={pendingStyles.detailMetaGrid}>
                    <div className={pendingStyles.metaItem}>
                      <dt>Mã môn</dt>
                      <dd>{getExamSubjectCode(selected)}</dd>
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
                    <div className={pendingStyles.fileBody}>
                      <p className={pendingStyles.fileName}>
                        {!USE_MOCK && selectedId && !selectedDetail
                          ? "Đang tải thông tin file..."
                          : (selectedAttachment?.name ?? "Chưa có file đính kèm")}
                      </p>
                      <p className={pendingStyles.fileHint}>
                        {selectedAttachment
                          ? "File đính kèm từ Mod — bấm Tải xuống để xem đúng file đã upload"
                          : "Mod chưa upload file hoặc đề gửi trước bản cập nhật — yêu cầu Mod gửi lại."}
                      </p>
                    </div>
                    {selectedAttachment ? (
                      <button
                        type="button"
                        className={pendingStyles.fileDownload}
                        onClick={handleDownloadAttachment}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        Tải xuống
                      </button>
                    ) : null}
                  </div>
                  {selectedDetail?.attachments?.length > 0 ? (
                    <ExamAttachmentViewer
                      examApiId={selectedDetail.id}
                      attachments={selectedDetail.attachments}
                    />
                  ) : null}
                </div>

                <div className={pendingStyles.detailBody}>
                  {selected.typeKey === "final" ? (
                    <>
                      <p className={pendingStyles.sectionTitle}>
                        Xem trước câu hỏi ({previewQuestions.length} câu)
                      </p>
                      <div
                        ref={previewQuestionsRef}
                        className={`${pendingStyles.previewBox} ${pendingStyles.previewQuestionsBox}`}
                      >
                        {previewQuestions.length > 0 ? (
                          <ul className={pendingStyles.ocrList}>
                            {previewQuestions.map((q, index) => (
                              <li key={q.id ?? index} className={pendingStyles.ocrItem}>
                                <p className={pendingStyles.ocrQuestion}>
                                  {index + 1}. {q.text}
                                </p>
                                <ol className={pendingStyles.ocrOptions}>
                                  {q.options.map((opt, i) => (
                                    <li
                                      key={`${q.id}-${i}`}
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
                        ) : (
                          <p className={pendingStyles.contentBlock}>
                            {USE_MOCK ? "—" : "Chưa có câu hỏi hoặc đang tải chi tiết..."}
                          </p>
                        )}
                      </div>
                      <p className={pendingStyles.hintBox}>
                        Sau khi duyệt, đề cuối kỳ có {previewQuestions.length || selected.questionCount || 0}{" "}
                        câu trên kho đề — Premium được làm bài online.
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
                  <Button onClick={() => handleApprove(selected)} disabled={actionLoading} loading={actionLoading} loadingLabel={ACTION_LOADING.approve}>
                    Duyệt & Xuất bản
                  </Button>
                  <Button
                    look="outline"
                    className={pendingStyles.rejectBtn}
                    onClick={() => setRejectTarget(selected)}
                    disabled={actionLoading}
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
                {USE_MOCK ? "Lịch sử xử lý trong phiên" : "Lịch sử duyệt đề"}
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
                              [{getExamDisplayCode(row.item)}] {getExamDisplayTitle(row.item)}
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
                              Xem tài liệu môn ({getExamSubjectCode(row.item)}) →
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
                              [{getExamDisplayCode(row.item)}] {getExamDisplayTitle(row.item)}
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
                            [{getExamDisplayCode(item)}] {getExamDisplayTitle(item)}
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
                            Xem tài liệu môn ({getExamSubjectCode(item)}) →
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
                          [{getExamDisplayCode(item)}] {getExamDisplayTitle(item)}
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
        examTitle={rejectTarget ? `[${getExamDisplayCode(rejectTarget)}] ${getExamDisplayTitle(rejectTarget)}` : ""}
        onClose={() => !actionLoading && setRejectTarget(null)}
        onConfirm={handleReject}
        submitting={actionLoading}
      />
    </AdminPageLayout>
  );
}

export default AdminExamPendingPage;
