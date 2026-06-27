import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFlag,
  faInbox,
  faMousePointer,
  faSpinner,
  faTriangleExclamation,
  faUserSlash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import { getAdminUserDetailUrl } from "@/features/admin/adminMockData";
import {
  REPORT_STATUS_LABELS,
  banReportedUser,
  deleteReportedPost,
  dismissReport,
  fetchAdminReportsPage,
  getAdminReports,
  loadAdminModerationReports,
  loadAdminReports,
  resolveReportBanViaApi,
  resolveReportDeleteViaApi,
  resolveReportDismissViaApi,
} from "@/features/admin/moderation/adminReportData";
import { banUserPermanentlyViaApi } from "@/features/admin/users/adminUserStore";
import { resolveExamQuestionReport, getExamQuestionReports } from "@/features/exams/examQuestionReportStore";
import { EXAM_REPORT_ROUTING } from "@/features/exams/examQuestionReportData";
import { resolveConversationReport, getConversationReports } from "@/features/moderator/reports/conversationReportStore";
import { REASON_META } from "@/features/moderator/reports/reportsData";
import { submitViolatingAccountBan } from "@/features/moderator/violations/violationsData";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import modStyles from "@/features/admin/moderation/AdminModerationPage.module.css";

const TAB_OPTIONS = [
  { id: "pending", label: "Chờ xử lý" },
  { id: "resolved", label: "Đã xử lý" },
  { id: "all", label: "Tất cả" },
];

const CATEGORY_OPTIONS = [
  { id: "all", label: "Tất cả loại" },
  { id: "community", label: "Cộng đồng" },
  { id: "user", label: "Người dùng" },
  { id: "exam_question", label: "Câu hỏi đề" },
];

const CATEGORY_LABELS = {
  community: "Cộng đồng",
  user: "Người dùng",
  exam_question: "Câu hỏi đề",
};

function ReasonTag({ reason }) {
  const meta = REASON_META[reason] ?? { label: reason, tone: "muted" };
  return (
    <span
      className={`${modStyles.tag} ${
        meta.tone === "danger" ? modStyles.tagDanger : modStyles.tagMuted
      }`}
    >
      {meta.label}
    </span>
  );
}

function getReportedUsername(report) {
  if (!report) return "";
  if (report.category === "community") return report.reportedUser ?? "";
  return report.reportedUser?.username?.replace(/^@/, "") ?? "";
}

function getResolvedBannerTitle(resolved) {
  if (!resolved) return "Đã xử lý báo cáo";
  if (resolved.category === "community") return `Đã xử lý báo cáo bài #${resolved.postId}`;
  return `Đã xử lý báo cáo ${resolved.code ?? ""}`;
}

function AdminModerationPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [communityReports, setCommunityReports] = useState(getAdminReports);
  const [examReports, setExamReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [hasMoreReports, setHasMoreReports] = useState(false);
  const [loadingMoreReports, setLoadingMoreReports] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiReportPage, setApiReportPage] = useState(1);
  const [tab, setTab] = useState("pending");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [lastResolved, setLastResolved] = useState(null);

  const reports = useMemo(
    () => [...examReports, ...communityReports, ...userReports],
    [examReports, communityReports, userReports],
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    loadAdminModerationReports()
      .then((data) => {
        if (!cancelled) {
          setCommunityReports(data.communityReports);
          setExamReports(data.examReports);
          setUserReports(data.userReports);
          setHasMoreReports(data.communityHasMore);
          setApiReportPage(data.communityPage);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    return () => {
      cancelled = true;
      window.removeEventListener("sehubs-exam-reports-changed", refreshExamReports);
      window.removeEventListener("sehubs-conversation-reports-changed", refreshUserReports);
    };
  }, []);

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const urgentCount = reports.filter(
    (r) => r.status === "pending" && r.urgent && r.category === "community",
  ).length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (tab === "pending" && r.status !== "pending") return false;
      if (tab === "resolved" && r.status !== "resolved") return false;
      if (category !== "all" && r.category !== category) return false;
      if (!q) return true;

      const reasonLabel = REASON_META[r.reason]?.label ?? r.reason ?? "";
      const searchable = [
        r.code,
        r.snippet,
        r.reason,
        reasonLabel,
        r.postId,
        r.reporter,
        r.reportedUser,
        r.reporterUsername,
        r.reportedUser?.username,
        r.examId,
        r.post?.title,
        r.post?.excerpt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [reports, tab, category, query]);

  const reportPage = useAdminPagination(filtered, ADMIN_PAGE_SIZES.reports, [
    tab,
    category,
    query,
    reports,
  ]);

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
  const reportedUserDetailUrl = selected
    ? getAdminUserDetailUrl(getReportedUsername(selected))
    : null;

  async function refreshAllReports() {
    const data = await loadAdminModerationReports();
    setCommunityReports(data.communityReports);
    setExamReports(data.examReports);
    setUserReports(data.userReports);
    setHasMoreReports(data.communityHasMore);
    setApiReportPage(data.communityPage);
    return [...data.examReports, ...data.communityReports, ...data.userReports];
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

  async function handleLoadMoreReports() {
    if (loadingMoreReports || !hasMoreReports) return;
    setLoadingMoreReports(true);
    try {
      const nextPage = apiReportPage + 1;
      const { items, hasMore } = await fetchAdminReportsPage(nextPage);
      setCommunityReports((prev) => [...prev, ...items]);
      setHasMoreReports(hasMore);
      setApiReportPage(nextPage);
    } finally {
      setLoadingMoreReports(false);
    }
  }

  function finishResolved(id, result, toastMsg = "Đã xử lý báo cáo.") {
    setLastResolved(result);
    showToast(toastMsg);
    if (result?.status === "resolved") {
      const nextPending = reports.filter((r) => r.id !== id && r.status === "pending");
      setSelectedId(nextPending[0]?.id ?? null);
    }
  }

  async function handleCommunityResolve(mockFn, toastMsg, apiResolveFn) {
    if (!selected || selected.category !== "community") return;
    let result = null;
    if (apiResolveFn) {
      result = await apiResolveFn(selected.id);
    }
    if (!result) {
      result = mockFn(selected.id);
    } else if (mockFn !== dismissReport && mockFn !== deleteReportedPost) {
      mockFn(selected.id);
    }
    if (!result) return;
    const next = await loadAdminReports();
    setCommunityReports(next);
    setHasMoreReports(false);
    setApiReportPage(1);
    setLastResolved(result);
    showToast(toastMsg);
    if (result.status === "resolved") {
      const nextPending = reports.filter((r) => r.id !== selected.id && r.status === "pending");
      setSelectedId(nextPending[0]?.id ?? null);
    }
  }

  async function handleUserDismiss() {
    if (!selected || selected.category !== "user") return;
    try {
      await resolveConversationReport(selected.id, "ignored");
      await refreshAllReports();
      finishResolved(
        selected.id,
        { ...selected, status: "resolved", resolution: "ignored" },
        "Đã bỏ qua báo cáo người dùng.",
      );
    } catch (err) {
      showToast(err.message ?? "Không xử lý được báo cáo.");
    }
  }

  async function handleUserBan(durationDays, permanent = false) {
    if (!selected || selected.category !== "user") return;
    const userId = selected.reportedUserId;
    if (!userId) {
      showToast("Không xác định được người dùng bị báo cáo.");
      return;
    }

    const reason = (selected.reporterReason ?? "Báo cáo tin nhắn vi phạm").slice(0, 200);

    try {
      if (permanent) {
        const banResult = await banUserPermanentlyViaApi(userId, {
          reason: reason.length >= 10 ? reason : `${reason} — khóa từ báo cáo chat.`,
          adminUsername: "admin",
        });
        if (!banResult?.ok) {
          showToast(banResult?.message ?? "Không khóa được tài khoản.");
          return;
        }
      } else {
        await submitViolatingAccountBan(userId, durationDays, reason);
      }
      await resolveConversationReport(
        selected.id,
        permanent ? "banned_permanent" : `banned_${durationDays}d`,
      );
      await refreshAllReports();
      finishResolved(
        selected.id,
        {
          ...selected,
          status: "resolved",
          resolution: permanent ? "banned_permanent" : `banned_${durationDays}d`,
        },
        permanent ? "Đã khóa vĩnh viễn." : `Đã khóa tài khoản ${durationDays} ngày.`,
      );
    } catch (err) {
      showToast(err.message ?? "Không khóa được tài khoản.");
    }
  }

  async function handleExamDismiss() {
    if (!selected || selected.category !== "exam_question") return;
    try {
      await resolveExamQuestionReport(selected.id, "ignored");
      await refreshAllReports();
      finishResolved(
        selected.id,
        { ...selected, status: "resolved", resolution: "ignored" },
        "Đã bỏ qua báo cáo câu hỏi.",
      );
    } catch (err) {
      showToast(err.message ?? "Không xử lý được báo cáo.");
    }
  }

  async function handleExamResolved() {
    if (!selected || selected.category !== "exam_question") return;
    try {
      await resolveExamQuestionReport(selected.id, "resolved_exam");
      await refreshAllReports();
      finishResolved(selected.id, { ...selected, status: "resolved", resolution: "resolved_exam" }, "Đã ghi nhận xử lý đề thi.");
    } catch (err) {
      showToast(err.message ?? "Không xử lý được báo cáo.");
    }
  }

  const showLoadMore =
    hasMoreReports && (category === "all" || category === "community");

  return (
    <AdminPageLayout
      title="Hàng chờ báo cáo"
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Báo cáo" }]}
      actions={
        <Button look="outline" to="/admin/moderation/banned">
          Tài khoản bị khóa
        </Button>
      }
    >
      <div className={modStyles.page}>
        <div className={modStyles.metrics}>
          <div className={modStyles.metric}>
            <span className={`${modStyles.metricIcon} ${modStyles.metricIconPending}`}>
              <FontAwesomeIcon icon={faFlag} />
            </span>
            <div>
              <p className={modStyles.metricValue}>{pendingCount}</p>
              <p className={modStyles.metricLabel}>Chờ xử lý</p>
            </div>
          </div>
          <div className={modStyles.metric}>
            <span className={`${modStyles.metricIcon} ${modStyles.metricIconUrgent}`}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </span>
            <div>
              <p className={modStyles.metricValue}>{urgentCount}</p>
              <p className={modStyles.metricLabel}>Ưu tiên</p>
            </div>
          </div>
          <div className={modStyles.metric}>
            <span className={`${modStyles.metricIcon} ${modStyles.metricIconResolved}`}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <div>
              <p className={modStyles.metricValue}>{resolvedCount}</p>
              <p className={modStyles.metricLabel}>Đã xử lý</p>
            </div>
          </div>
        </div>

        <div className={modStyles.stepper}>
          <div className={modStyles.step}>
            <span className={modStyles.stepNum}>1</span>
            <span className={modStyles.stepText}>
              <strong>Chọn báo cáo</strong>
              Xem nội dung vi phạm
            </span>
          </div>
          <span className={modStyles.stepDivider} aria-hidden />
          <div className={modStyles.step}>
            <span className={modStyles.stepNum}>2</span>
            <span className={modStyles.stepText}>
              <strong>Quyết định</strong>
              Xóa / Giữ / Khóa
            </span>
          </div>
          <span className={modStyles.stepDivider} aria-hidden />
          <div className={modStyles.step}>
            <span className={`${modStyles.stepNum} ${modStyles.stepNumMuted}`}>3</span>
            <span className={modStyles.stepText}>
              <strong>Lưu vết</strong>
              Ghi nhận xử lý
            </span>
          </div>
        </div>

        {lastResolved ? (
          <div className={`${modStyles.banner} ${modStyles.bannerSuccess}`} role="status">
            <FontAwesomeIcon icon={faCheck} className={modStyles.bannerIcon} />
            <div className={modStyles.bannerBody}>
              <p className={modStyles.bannerTitle}>{getResolvedBannerTitle(lastResolved)}</p>
              <p className={modStyles.bannerMeta}>
                {lastResolved.resolution?.action ?? lastResolved.resolution} ·{" "}
                {lastResolved.resolution?.resolvedAt ?? lastResolved.timeLabel ?? lastResolved.createdAt}
              </p>
            </div>
            <button
              type="button"
              className={modStyles.bannerClose}
              aria-label="Đóng"
              onClick={() => setLastResolved(null)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ) : null}

        <div className={modStyles.workspace}>
          <div className={modStyles.queueCol}>
            <div className={modStyles.queueToolbar}>
              <div className={modStyles.queueToolbarHead}>
                <h2 className={modStyles.queueHeading}>Hàng chờ</h2>
                <span className={modStyles.queueCount}>{filtered.length}</span>
              </div>
              <input
                type="search"
                className={modStyles.searchInput}
                placeholder="Tìm mã, @user, lý do..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Tìm báo cáo"
              />
              <div className={modStyles.filterTrack} role="group" aria-label="Lọc trạng thái">
                {TAB_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${modStyles.filterBtn} ${
                      tab === opt.id ? modStyles.filterBtnActive : ""
                    }`}
                    onClick={() => setTab(opt.id)}
                  >
                    {opt.label}
                    {opt.id === "pending" ? ` (${pendingCount})` : ""}
                  </button>
                ))}
              </div>
              <div className={modStyles.filterTrack} role="group" aria-label="Lọc loại báo cáo">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${modStyles.filterBtn} ${
                      category === opt.id ? modStyles.filterBtnActive : ""
                    }`}
                    onClick={() => handleCategoryChange(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={modStyles.queueScroll}>
              {isLoading ? (
                <div className={modStyles.emptyQueue} role="status" aria-live="polite">
                  <FontAwesomeIcon icon={faSpinner} spin className={modStyles.emptyIcon} />
                  <p className={modStyles.emptyTitle}>Đang tải báo cáo…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className={modStyles.emptyQueue}>
                  <FontAwesomeIcon icon={faInbox} className={modStyles.emptyIcon} />
                  <p className={modStyles.emptyTitle}>Không có báo cáo</p>
                  <p className={modStyles.emptyDesc}>Thử đổi tab hoặc từ khóa tìm kiếm.</p>
                </div>
              ) : (
                <ul className={modStyles.queueList}>
                  {reportPage.pageItems.map((report) => {
                    const isActive = selectedId === report.id;
                    const cardTitle =
                      report.category === "community" ? `Bài #${report.postId}` : report.code;
                    const cardSubtitle =
                      report.category === "community" ? report.reason : report.snippet;
                    return (
                      <li key={report.id}>
                        <button
                          type="button"
                          className={`${modStyles.queueCard} ${
                            isActive ? modStyles.queueCardActive : ""
                          } ${report.urgent && report.status === "pending" ? modStyles.queueCardUrgent : ""}`}
                          onClick={() => selectReport(report.id)}
                        >
                          <div className={modStyles.queueCardInner}>
                            <div className={modStyles.queueCardBody}>
                              <p className={modStyles.queueTitle}>{cardTitle}</p>
                              <p className={modStyles.queueReason}>{cardSubtitle}</p>
                              <div className={modStyles.tagRow}>
                                <span className={`${modStyles.tag} ${modStyles.tagMuted}`}>
                                  {CATEGORY_LABELS[report.category] ?? report.category}
                                </span>
                                {report.category !== "community" ? (
                                  <ReasonTag reason={report.reason} />
                                ) : null}
                                <span
                                  className={`${modStyles.tag} ${
                                    report.status === "pending"
                                      ? modStyles.tagPending
                                      : modStyles.tagResolved
                                  }`}
                                >
                                  {REPORT_STATUS_LABELS[report.status]}
                                </span>
                                {report.urgent && report.status === "pending" ? (
                                  <span className={`${modStyles.tag} ${modStyles.tagUrgent}`}>
                                    Ưu tiên
                                  </span>
                                ) : null}
                              </div>
                              <p className={modStyles.queueFooter}>
                                {report.category === "exam_question"
                                  ? `${report.reporterUsername} · ${report.examId} · Câu ${report.questionIndex}`
                                  : report.category === "user"
                                    ? `${report.reporterUsername} → ${report.reportedUser?.username ?? "@unknown"}`
                                    : `@${report.reporter} → @${report.reportedUser}`}{" "}
                                · {report.timeLabel ?? report.createdAt}
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
            <AdminTableFooter
              rangeStart={reportPage.rangeStart}
              rangeEnd={reportPage.rangeEnd}
              total={reportPage.total}
              unit="báo cáo"
              currentPage={reportPage.safePage}
              totalPages={reportPage.totalPages}
              onPageChange={reportPage.handlePageChange}
              ariaLabel="Phân trang hàng chờ báo cáo"
              compact
            />
            {showLoadMore ? (
              <div className={modStyles.loadMoreRow}>
                <Button look="outline" disabled={loadingMoreReports} onClick={handleLoadMoreReports}>
                  {loadingMoreReports ? "Đang tải…" : "Tải thêm báo cáo"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className={modStyles.detailCol}>
            {!selected ? (
              <div className={modStyles.detailEmpty}>
                <FontAwesomeIcon icon={faMousePointer} className={modStyles.emptyIcon} />
                <p className={modStyles.emptyTitle}>Chọn một báo cáo</p>
                <p className={modStyles.emptyDesc}>Nội dung và thao tác xử lý hiển thị tại đây.</p>
              </div>
            ) : selected.category === "exam_question" ? (
              <>
                <header className={modStyles.detailHead}>
                  <h3 className={modStyles.detailTitle}>
                    {selected.code} — {REASON_META[selected.reason]?.label ?? selected.reason}
                  </h3>
                  <p className={modStyles.detailSub}>
                    Báo cáo lúc {selected.reportedAt ?? selected.timeLabel} ·{" "}
                    <StatusBadge
                      status={selected.status === "pending" ? "pending" : "resolved"}
                      label={REPORT_STATUS_LABELS[selected.status]}
                    />
                  </p>
                </header>

                <div className={modStyles.detailScroll}>
                  {selected.status === "resolved" ? (
                    <div className={modStyles.resolutionBox}>
                      <p className={modStyles.resolutionTitle}>Đã xử lý</p>
                      <p className={modStyles.resolutionText}>
                        {selected.resolution === "resolved_exam"
                          ? "Admin đã ghi nhận xử lý đề thi."
                          : "Báo cáo đã bỏ qua — câu hỏi được giữ nguyên."}
                      </p>
                    </div>
                  ) : null}

                  <div className={modStyles.previewBox}>
                    <p className={modStyles.previewMeta}>Câu hỏi được báo cáo</p>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{selected.violatingContent}</p>
                    {selected.markedAnswer ? (
                      <p className={modStyles.previewMeta} style={{ marginTop: "0.75rem" }}>
                        Đáp án hệ thống: <strong>{selected.markedAnswer}</strong>
                      </p>
                    ) : null}
                  </div>

                  <dl className={modStyles.metaGrid}>
                    <div className={modStyles.metaItem}>
                      <dt>Mã đề</dt>
                      <dd>{selected.examId}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Câu hỏi</dt>
                      <dd>Câu {selected.questionIndex}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Người báo cáo</dt>
                      <dd>{selected.reporterUsername}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Luồng xử lý</dt>
                      <dd>{EXAM_REPORT_ROUTING.escalationLabel}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Lý do chi tiết</dt>
                      <dd>{selected.reporterReason}</dd>
                    </div>
                  </dl>
                </div>

                <footer className={modStyles.detailActions}>
                  {selected.status === "pending" ? (
                    <>
                      <Button look="outline" onClick={handleExamDismiss}>
                        Bỏ qua báo cáo
                      </Button>
                      <Button onClick={handleExamResolved}>Đã xử lý đề</Button>
                    </>
                  ) : (
                    <p className={modStyles.detailActionsMuted}>
                      Báo cáo đã đóng. Chọn báo cáo khác trong hàng chờ.
                    </p>
                  )}
                </footer>
              </>
            ) : selected.category === "user" ? (
              <>
                <header className={modStyles.detailHead}>
                  <h3 className={modStyles.detailTitle}>
                    {selected.code} — {REASON_META[selected.reason]?.label ?? selected.reason}
                  </h3>
                  <p className={modStyles.detailSub}>
                    Báo cáo lúc {selected.reportedAt ?? selected.timeLabel} ·{" "}
                    <StatusBadge
                      status={selected.status === "pending" ? "pending" : "resolved"}
                      label={REPORT_STATUS_LABELS[selected.status]}
                    />
                  </p>
                </header>

                <div className={modStyles.detailScroll}>
                  {selected.status === "resolved" ? (
                    <div className={modStyles.resolutionBox}>
                      <p className={modStyles.resolutionTitle}>Đã xử lý</p>
                      <p className={modStyles.resolutionText}>
                        {String(selected.resolution ?? "").includes("banned")
                          ? "Tài khoản đã bị khóa và báo cáo đã đóng."
                          : "Báo cáo đã bỏ qua."}
                      </p>
                    </div>
                  ) : null}

                  <div className={modStyles.previewBox}>
                    <p className={modStyles.previewMeta}>Nội dung báo cáo</p>
                    <p style={{ margin: 0 }}>{selected.violatingContent}</p>
                    <p className={modStyles.previewMeta} style={{ marginTop: "0.75rem" }}>
                      Lý do từ {selected.reporterUsername}: {selected.reporterReason}
                    </p>
                  </div>

                  <dl className={modStyles.metaGrid}>
                    <div className={modStyles.metaItem}>
                      <dt>Người báo cáo</dt>
                      <dd>{selected.reporterUsername}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Tài khoản bị báo cáo</dt>
                      <dd>
                        {reportedUserDetailUrl ? (
                          <Link to={reportedUserDetailUrl} className={modStyles.linkUser}>
                            {selected.reportedUser?.username}
                          </Link>
                        ) : (
                          <span>{selected.reportedUser?.username}</span>
                        )}
                      </dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Mã báo cáo</dt>
                      <dd>{selected.code}</dd>
                    </div>
                  </dl>
                </div>

                <footer className={modStyles.detailActions}>
                  {selected.status === "pending" ? (
                    <>
                      <Button look="outline" onClick={handleUserDismiss}>
                        Bỏ qua báo cáo
                      </Button>
                      <Button
                        look="outline"
                        onClick={() => handleUserBan(7)}
                      >
                        <FontAwesomeIcon icon={faUserSlash} />
                        Khóa 7 ngày
                      </Button>
                      <Button look="outline" onClick={() => handleUserBan(0, true)}>
                        Khóa vĩnh viễn
                      </Button>
                    </>
                  ) : (
                    <p className={modStyles.detailActionsMuted}>
                      Báo cáo đã đóng. Chọn báo cáo khác trong hàng chờ.
                    </p>
                  )}
                </footer>
              </>
            ) : (
              <>
                <header className={modStyles.detailHead}>
                  <h3 className={modStyles.detailTitle}>
                    Bài #{selected.postId} — {selected.reason}
                  </h3>
                  <p className={modStyles.detailSub}>
                    Báo cáo lúc {selected.createdAt} ·{" "}
                    <StatusBadge
                      status={selected.status === "pending" ? "pending" : "resolved"}
                      label={REPORT_STATUS_LABELS[selected.status]}
                    />
                  </p>
                </header>

                <div className={modStyles.detailScroll}>
                  {selected.resolution ? (
                    <div className={modStyles.resolutionBox}>
                      <p className={modStyles.resolutionTitle}>Đã xử lý</p>
                      <p className={modStyles.resolutionText}>
                        <strong>{selected.resolution.action}</strong>
                        {selected.resolution.note ? ` — ${selected.resolution.note}` : ""}
                        <br />
                        {selected.resolution.resolvedBy} · {selected.resolution.resolvedAt}
                      </p>
                    </div>
                  ) : null}

                  <div className={modStyles.previewBox}>
                    <p className={modStyles.previewMeta}>
                      @{selected.post.author} · {selected.post.postedAt}
                    </p>
                    <p className={modStyles.previewPostTitle}>{selected.post.title}</p>
                    <p style={{ margin: 0 }}>{selected.post.excerpt}</p>
                  </div>

                  <dl className={modStyles.metaGrid}>
                    <div className={modStyles.metaItem}>
                      <dt>Người báo cáo</dt>
                      <dd>@{selected.reporter}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Tài khoản bị báo cáo</dt>
                      <dd>
                        {reportedUserDetailUrl ? (
                          <Link to={reportedUserDetailUrl} className={modStyles.linkUser}>
                            @{selected.reportedUser}
                          </Link>
                        ) : (
                          <span>@{selected.reportedUser}</span>
                        )}
                      </dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Mã bài viết</dt>
                      <dd>#{selected.postId}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Lý do</dt>
                      <dd>{selected.reason}</dd>
                    </div>
                  </dl>
                </div>

                <footer className={modStyles.detailActions}>
                  {selected.status === "pending" ? (
                    <>
                      <Button
                        onClick={() =>
                          handleCommunityResolve(
                            deleteReportedPost,
                            "Đã xóa bài viết.",
                            resolveReportDeleteViaApi,
                          )
                        }
                      >
                        Xóa bài viết
                      </Button>
                      <Button
                        look="outline"
                        onClick={() =>
                          handleCommunityResolve(
                            dismissReport,
                            "Đã từ chối báo cáo — giữ bài.",
                            resolveReportDismissViaApi,
                          )
                        }
                      >
                        Giữ nguyên bài
                      </Button>
                      <Button
                        look="outline"
                        onClick={() =>
                          handleCommunityResolve(
                            (id) => banReportedUser(id, "7 ngày"),
                            "Đã khóa tài khoản 7 ngày.",
                            resolveReportBanViaApi,
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faUserSlash} />
                        Khóa 7 ngày
                      </Button>
                      <Button
                        look="outline"
                        onClick={() =>
                          handleCommunityResolve(
                            (id) => banReportedUser(id, "vĩnh viễn"),
                            "Đã khóa vĩnh viễn.",
                            resolveReportBanViaApi,
                          )
                        }
                      >
                        Khóa vĩnh viễn
                      </Button>
                    </>
                  ) : (
                    <p className={modStyles.detailActionsMuted}>
                      Báo cáo đã đóng. Chọn báo cáo khác trong hàng chờ.
                    </p>
                  )}
                </footer>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}

export default AdminModerationPage;
