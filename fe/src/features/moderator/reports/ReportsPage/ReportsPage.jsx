import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFlag,
  faInbox,
  faMousePointer,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  loadModeratorCommunityReports,
  REASON_META,
  reloadModeratorCommunityReportsAfterResolve,
} from "@/features/moderator/reports/reportsData";
import {
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_OPTIONS,
  REPORT_TAB_OPTIONS,
} from "@/features/moderator/reports/shared/reportCategoryConstants";
import ReasonTag from "@/features/moderator/reports/shared/ReasonTag";
import { filterModerationReports } from "@/features/moderator/reports/shared/reportQueueUtils";
import {
  getExamQuestionReports,
  resolveExamQuestionReport,
} from "@/features/exams/examQuestionReportStore";
import { EXAM_REPORT_ROUTING } from "@/features/exams/examQuestionReportData";
import {
  getConversationReports,
  resolveConversationReport,
} from "@/features/moderator/reports/conversationReportStore";
import styles from "./ReportsPage.module.css";

const TAB_OPTIONS = REPORT_TAB_OPTIONS;
const CATEGORY_OPTIONS = REPORT_CATEGORY_OPTIONS;
const CATEGORY_LABELS = REPORT_CATEGORY_LABELS;

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  resolved: "Đã xử lý",
};

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
        <span className={`${styles.trustValue} ${tone}`} aria-label={`Trust score ${clamped} trên 100`}>
          {clamped}/100
        </span>
      </div>
    </div>
  );
}

function ReportsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [communityReports, setCommunityReports] = useState([]);
  const [hasMoreCommunityReports, setHasMoreCommunityReports] = useState(false);
  const [loadingMoreCommunity, setLoadingMoreCommunity] = useState(false);
  const [communityApiPage, setCommunityApiPage] = useState(1);
  const [examReports, setExamReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [communityLoadError, setCommunityLoadError] = useState(null);
  const [tab, setTab] = useState("pending");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [lastResolved, setLastResolved] = useState(null);
  const deepLinkSyncedRef = useRef(false);
  const urlReportId = searchParams.get("id");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setCommunityLoadError(null);

    const communityPromise = loadModeratorCommunityReports()
      .then((result) => {
        if (!cancelled) {
          setCommunityReports(result.items);
          setHasMoreCommunityReports(result.hasMore);
          setCommunityApiPage(result.page);
        }
        return result.items;
      })
      .catch((err) => {
        const message = err.message ?? "Không tải được báo cáo cộng đồng.";
        if (!cancelled) {
          setCommunityReports([]);
          setCommunityLoadError(message);
          showToast(message);
        }
        return [];
      });

    const examPromise = getExamQuestionReports()
      .then((items) => {
        if (!cancelled) {
          setExamReports(items);
        }
        return items;
      })
      .catch(() => {
        if (!cancelled) {
          setExamReports([]);
        }
        return [];
      });

    const userPromise = getConversationReports()
      .then((items) => {
        if (!cancelled) {
          setUserReports(items);
        }
        return items;
      })
      .catch(() => {
        if (!cancelled) {
          setUserReports([]);
        }
        return [];
      });

    Promise.all([communityPromise, examPromise, userPromise]).finally(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;

    function refreshExamReports() {
      getExamQuestionReports()
        .then((items) => {
          if (!cancelled) setExamReports(items);
        })
        .catch(() => {
          if (!cancelled) setExamReports([]);
        });
    }

    function refreshUserReports() {
      getConversationReports()
        .then((items) => {
          if (!cancelled) setUserReports(items);
        })
        .catch(() => {
          if (!cancelled) setUserReports([]);
        });
    }

    window.addEventListener("sehubs-exam-reports-changed", refreshExamReports);
    window.addEventListener("sehubs-conversation-reports-changed", refreshUserReports);
    window.addEventListener("storage", refreshExamReports);
    return () => {
      cancelled = true;
      window.removeEventListener("sehubs-exam-reports-changed", refreshExamReports);
      window.removeEventListener("sehubs-conversation-reports-changed", refreshUserReports);
      window.removeEventListener("storage", refreshExamReports);
    };
  }, []);

  const reports = useMemo(
    () => [...examReports, ...communityReports, ...userReports],
    [examReports, communityReports, userReports],
  );

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const filtered = useMemo(
    () => filterModerationReports(reports, { tab, category, query }),
    [reports, tab, category, query],
  );

  useEffect(() => {
    deepLinkSyncedRef.current = false;
  }, [urlReportId]);

  useEffect(() => {
    if (!urlReportId || reports.length === 0) {
      return;
    }

    const urlItem = reports.find((report) => report.id === urlReportId);
    if (!urlItem) {
      return;
    }

    setSelectedId(urlItem.id);

    if (!deepLinkSyncedRef.current) {
      deepLinkSyncedRef.current = true;
      if (urlItem.status === "resolved") {
        setTab("resolved");
      } else if (urlItem.status === "pending") {
        setTab("pending");
      }
    }
  }, [urlReportId, reports]);

  useEffect(() => {
    if (urlReportId) {
      return;
    }

    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((current) =>
      current && filtered.some((report) => report.id === current) ? current : filtered[0].id,
    );
  }, [filtered, urlReportId]);

  const selected = reports.find((r) => r.id === selectedId) ?? null;

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("id");
        return next;
      },
      { replace: true },
    );
  }

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("id");
        return next;
      },
      { replace: true },
    );
  }

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

  function finishResolvedReport(id, resolution, reloadedList, setList) {
    const target = reports.find((report) => report.id === id);
    if (reloadedList) {
      setList(reloadedList);
      const resolved =
        reloadedList.find((report) => report.id === id) ??
        (target ? { ...target, status: "resolved", resolution } : null);
      if (resolved) {
        setLastResolved(resolved);
      }
    } else if (target) {
      setLastResolved({ ...target, status: "resolved", resolution });
    }

    setTab("resolved");
    setSelectedId(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("id", id);
        return next;
      },
      { replace: true },
    );
    deepLinkSyncedRef.current = true;
  }

  function resolveReportLocal(id, resolution) {
    const target = reports.find((report) => report.id === id);
    if (target?.category === "exam_question") {
      resolveExamQuestionReport(id, resolution)
        .then(() => getExamQuestionReports())
        .then((items) => setExamReports(items))
        .catch((err) => showToast(err.message ?? "Không xử lý được báo cáo câu hỏi."));
    } else if (target?.category === "user") {
      resolveConversationReport(id, resolution)
        .then(() => getConversationReports())
        .then((items) => setUserReports(items))
        .catch((err) => showToast(err.message ?? "Không xử lý được báo cáo người dùng."));
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

  function finishCommunityResolve(id, resolution, reloaded) {
    const target = reports.find((report) => report.id === id);
    if (reloaded) {
      setCommunityReports(reloaded);
      const resolved =
        reloaded.find((report) => report.id === id) ??
        (target ? { ...target, status: "resolved", resolution } : null);
      if (resolved) {
        setLastResolved(resolved);
      }
      setTab("resolved");
      setSelectedId(id);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("id", id);
          return next;
        },
        { replace: true },
      );
      deepLinkSyncedRef.current = true;
      return;
    }

    resolveReportLocal(id, resolution);
    setTab("resolved");
    setSelectedId(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("id", id);
        return next;
      },
      { replace: true },
    );
    deepLinkSyncedRef.current = true;
  }

  async function handleLoadMoreCommunityReports() {
    if (loadingMoreCommunity || !hasMoreCommunityReports) return;
    setLoadingMoreCommunity(true);
    try {
      const nextPage = communityApiPage + 1;
      const { items, hasMore, page } = await loadModeratorCommunityReports({ page: nextPage });
      setCommunityReports((prev) => [...prev, ...items]);
      setHasMoreCommunityReports(hasMore);
      setCommunityApiPage(page);
    } finally {
      setLoadingMoreCommunity(false);
    }
  }

  async function handleDismiss(id) {
    const target = reports.find((report) => report.id === id);
    if (target?.category === "exam_question") {
      resolveReportLocal(id, "ignored");
      setTab("resolved");
      setSelectedId(id);
      deepLinkSyncedRef.current = true;
    } else if (target?.category === "user") {
      try {
        await resolveConversationReport(id, "ignored");
        const reloaded = await getConversationReports();
        finishResolvedReport(id, "ignored", reloaded, setUserReports);
      } catch (err) {
        showToast(err.message ?? "Không xử lý được báo cáo.");
        return;
      }
    } else {
      try {
        const reloaded = await reloadModeratorCommunityReportsAfterResolve(id, "dismiss");
        finishCommunityResolve(id, "ignored", reloaded);
      } catch (err) {
        showToast(err.message ?? "Không xử lý được báo cáo.");
        return;
      }
    }
    showToast(
      target?.category === "exam_question"
        ? "Đã bỏ qua — giữ nguyên câu hỏi trong ngân hàng đề."
        : target?.category === "user"
          ? "Đã bỏ qua báo cáo người dùng."
          : "Đã bỏ qua báo cáo — giữ nguyên nội dung.",
    );
    window.dispatchEvent(new CustomEvent("sehub-moderator-stats-updated"));
  }

  async function handleDelete(id) {
    const target = reports.find((report) => report.id === id);
    if (target?.category === "exam_question") {
      resolveReportLocal(id, "deleted");
      setTab("resolved");
      setSelectedId(id);
      deepLinkSyncedRef.current = true;
    } else {
      try {
        const reloaded = await reloadModeratorCommunityReportsAfterResolve(id, "delete");
        finishCommunityResolve(id, "deleted", reloaded);
      } catch (err) {
        showToast(err.message ?? "Không xóa được nội dung.");
        return;
      }
    }
    showToast("Đã xóa nội dung vi phạm.");
    window.dispatchEvent(new CustomEvent("sehub-moderator-stats-updated"));
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
        Xử lý báo cáo cộng đồng, người dùng (tin nhắn) và câu hỏi đề thi ôn tập. Báo cáo đề được
        Moderator rà soát, Admin duyệt trước khi cập nhật ngân hàng câu hỏi.
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
                  onClick={() => handleTabChange(opt.id)}
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
                  onClick={() => handleCategoryChange(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.queueScroll}>
            {isLoading ? (
              <div className={styles.loadingQueue} role="status" aria-live="polite">
                <FontAwesomeIcon icon={faSpinner} spin className={styles.loadingIcon} />
                <p className={styles.emptyTitle}>Đang tải báo cáo…</p>
                <p className={styles.emptyDesc}>Đồng bộ từ máy chủ.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyQueue}>
                <FontAwesomeIcon icon={faInbox} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>
                  {communityLoadError ? "Không tải được dữ liệu" : "Không có báo cáo"}
                </p>
                <p className={`${styles.emptyDesc} ${communityLoadError ? styles.emptyDescError : ""}`}>
                  {communityLoadError ?? "Thử đổi tab hoặc từ khóa tìm kiếm."}
                </p>
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
            {!isLoading && hasMoreCommunityReports ? (
              <div className={styles.loadMoreRow}>
                <Button
                  look="outline"
                  disabled={loadingMoreCommunity}
                  onClick={handleLoadMoreCommunityReports}
                >
                  {loadingMoreCommunity ? "Đang tải…" : "Tải thêm báo cáo"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.detailCol}>
          {isLoading ? (
            <div className={styles.detailEmpty} role="status" aria-live="polite">
              <FontAwesomeIcon icon={faSpinner} spin className={styles.loadingIcon} />
              <p className={styles.emptyTitle}>Đang tải…</p>
            </div>
          ) : !selected ? (
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
                  <p className={styles.violationLabel}>
                    {selected.category === "user" ? "Nội dung báo cáo" : "Nội dung vi phạm"}
                  </p>
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
                  ) : selected.category === "user" ? (
                    <>
                      <Button look="outline" onClick={() => handleDismiss(selected.id)}>
                        Bỏ qua báo cáo
                      </Button>
                      <Link to="/moderator/violations">
                        <Button>Chuyển xử lý vi phạm</Button>
                      </Link>
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
