import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFlag,
  faInbox,
  faMousePointer,
  faTriangleExclamation,
  faUserSlash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { ACTION_LOADING } from "@/utils/actionLoadingLabels";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { StaffQueueSkeleton } from "@/common/Skeleton/StaffSkeleton";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import { getAdminUserDetailUrl } from "@/features/admin/adminMockData";
import {
  REPORT_STATUS_LABELS,
  banCommunityReportedUserViaApi,
  banReportedUser,
  deleteReportedPost,
  dismissReport,
  fetchAdminReportsPage,
  resolveReportDeleteViaApi,
  resolveReportDismissViaApi,
} from "@/features/admin/moderation/adminReportData";
import { banUserPermanentlyViaApi } from "@/features/admin/users/adminUserStore";
import { resolveExamQuestionReport } from "@/features/exams/examQuestionReportStore";
import { EXAM_REPORT_ROUTING } from "@/features/exams/examQuestionReportData";
import { resolveConversationReport } from "@/features/moderator/reports/conversationReportStore";
import { REASON_META } from "@/features/moderator/reports/reportsData";
import {
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_OPTIONS,
  REPORT_TAB_OPTIONS,
} from "@/features/moderator/reports/shared/reportCategoryConstants";
import ReasonTag from "@/features/moderator/reports/shared/ReasonTag";
import {
  filterModerationReports,
  getReportedUsername,
  getResolvedBannerTitle,
  pickNextPendingReportId,
} from "@/features/moderator/reports/shared/reportQueueUtils";
import { useModerationReportsQueue } from "@/features/moderator/reports/shared/useModerationReportsQueue";
import { submitViolatingAccountBan } from "@/features/moderator/violations/violationsData";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import modStyles from "@/features/admin/moderation/AdminModerationPage.module.css";

function AdminModerationPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    communityReports,
    setCommunityReports,
    communityHasMore,
    communityPage,
    setCommunityHasMore,
    setCommunityPage,
    isLoading,
    loadError,
    reports,
    refreshAllReports,
  } = useModerationReportsQueue({
    onLoadError: (message) => showToast(message),
  });
  const [loadingMoreReports, setLoadingMoreReports] = useState(false);
  const [tab, setTab] = useState("pending");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [lastResolved, setLastResolved] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const urgentCount = reports.filter(
    (r) => r.status === "pending" && r.urgent && r.category === "community",
  ).length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const filtered = useMemo(
    () => filterModerationReports(reports, { tab, category, query }),
    [reports, tab, category, query],
  );

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

  async function handleLoadMoreReports() {
    if (loadingMoreReports || !communityHasMore) return;
    setLoadingMoreReports(true);
    try {
      const nextPage = communityPage + 1;
      const { items, hasMore } = await fetchAdminReportsPage(nextPage);
      setCommunityReports((prev) => [...prev, ...items]);
      setCommunityHasMore(hasMore);
      setCommunityPage(nextPage);
    } finally {
      setLoadingMoreReports(false);
    }
  }

  function finishResolved(id, result, refreshedList, toastMsg = "Đã xử lý báo cáo.") {
    setLastResolved(result);
    showToast(toastMsg);
    if (result?.status === "resolved") {
      setSelectedId(pickNextPendingReportId(refreshedList ?? reports, id, tab));
    }
  }

  async function handleCommunityResolve(mockFn, toastMsg, apiResolveFn, actionKey) {
    if (!selected || selected.category !== "community" || pendingAction) return;
    setPendingAction(actionKey);
    try {
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

      const refreshedList = await refreshAllReports();
      finishResolved(selected.id, result, refreshedList, toastMsg);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCommunityBan(durationDays, permanent = false) {
    if (!selected || selected.category !== "community" || pendingAction) return;
    const actionKey = permanent ? "community-ban-perm" : "community-ban-7";
    setPendingAction(actionKey);
    const reportedUserId = selected.reportedUserId;
    const reason = selected.reason ?? selected.post?.excerpt ?? "Báo cáo vi phạm cộng đồng";

    try {
      let result = null;
      if (reportedUserId) {
        result = await banCommunityReportedUserViaApi(selected.id, reportedUserId, {
          durationDays,
          permanent,
          reason,
        });
      }
      if (!result) {
        result = banReportedUser(selected.id, permanent ? "vĩnh viễn" : `${durationDays} ngày`);
      }
      if (!result) return;

      const refreshedList = await refreshAllReports();
      finishResolved(
        selected.id,
        result,
        refreshedList,
        permanent ? "Đã khóa vĩnh viễn." : `Đã khóa tài khoản ${durationDays} ngày.`,
      );
    } catch (err) {
      showToast(err.message ?? "Không khóa được tài khoản.");
    } finally {
      setPendingAction(null);
    }
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

  async function handleUserDismiss() {
    if (!selected || selected.category !== "user" || pendingAction) return;
    setPendingAction("user-dismiss");
    try {
      await resolveConversationReport(selected.id, "ignored");
      const refreshedList = await refreshAllReports();
      finishResolved(
        selected.id,
        { ...selected, status: "resolved", resolution: "ignored" },
        refreshedList,
        "Đã bỏ qua báo cáo người dùng.",
      );
    } catch (err) {
      showToast(err.message ?? "Không xử lý được báo cáo.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUserBan(durationDays, permanent = false) {
    if (!selected || selected.category !== "user" || pendingAction) return;
    const actionKey = permanent ? "user-ban-perm" : "user-ban-7";
    setPendingAction(actionKey);
    const userId = selected.reportedUserId;
    if (!userId) {
      showToast("Không xác định được người dùng bị báo cáo.");
      setPendingAction(null);
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
      const refreshedList = await refreshAllReports();
      finishResolved(
        selected.id,
        {
          ...selected,
          status: "resolved",
          resolution: permanent ? "banned_permanent" : `banned_${durationDays}d`,
        },
        refreshedList,
        permanent ? "Đã khóa vĩnh viễn." : `Đã khóa tài khoản ${durationDays} ngày.`,
      );
    } catch (err) {
      showToast(err.message ?? "Không khóa được tài khoản.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleExamDismiss() {
    if (!selected || selected.category !== "exam_question" || pendingAction) return;
    setPendingAction("exam-dismiss");
    try {
      await resolveExamQuestionReport(selected.id, "ignored");
      const refreshedList = await refreshAllReports();
      finishResolved(
        selected.id,
        { ...selected, status: "resolved", resolution: "ignored" },
        refreshedList,
        "Đã bỏ qua báo cáo câu hỏi.",
      );
    } catch (err) {
      showToast(err.message ?? "Không xử lý được báo cáo.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleExamResolved() {
    if (!selected || selected.category !== "exam_question" || pendingAction) return;
    setPendingAction("exam-resolve");
    try {
      await resolveExamQuestionReport(selected.id, "resolved_exam");
      const refreshedList = await refreshAllReports();
      finishResolved(
        selected.id,
        { ...selected, status: "resolved", resolution: "resolved_exam" },
        refreshedList,
        "Đã ghi nhận xử lý đề thi.",
      );
    } catch (err) {
      showToast(err.message ?? "Không xử lý được báo cáo.");
    } finally {
      setPendingAction(null);
    }
  }

  const showLoadMore =
    communityHasMore && (category === "all" || category === "community");
  const isActing = Boolean(pendingAction);

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

        {loadError ? (
          <div className={`${modStyles.banner} ${modStyles.bannerError}`} role="alert">
            <p className={modStyles.bannerTitle}>{loadError}</p>
          </div>
        ) : null}

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
                {REPORT_TAB_OPTIONS.map((opt) => (
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
                {REPORT_CATEGORY_OPTIONS.map((opt) => (
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
                <StaffQueueSkeleton aria-label="Đang tải báo cáo" />
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
                                  {REPORT_CATEGORY_LABELS[report.category] ?? report.category}
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
                      <Button
                        look="outline"
                        className={modStyles.actionBtnDismiss}
                        disabled={isActing}
                        loading={pendingAction === "exam-dismiss"}
                        loadingLabel={ACTION_LOADING.dismiss}
                        onClick={handleExamDismiss}
                      >
                        Bỏ qua báo cáo
                      </Button>
                      <Button
                        className={modStyles.actionBtnResolve}
                        disabled={isActing}
                        loading={pendingAction === "exam-resolve"}
                        loadingLabel={ACTION_LOADING.dismiss}
                        onClick={handleExamResolved}
                      >
                        Đã xử lý đề
                      </Button>
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
                      <Button
                        look="outline"
                        className={modStyles.actionBtnDismiss}
                        disabled={isActing}
                        loading={pendingAction === "user-dismiss"}
                        loadingLabel={ACTION_LOADING.dismiss}
                        onClick={handleUserDismiss}
                      >
                        Bỏ qua báo cáo
                      </Button>
                      <Button
                        look="outline"
                        className={modStyles.actionBtnBanTemp}
                        disabled={isActing}
                        loading={pendingAction === "user-ban-7"}
                        loadingLabel={ACTION_LOADING.ban}
                        onClick={() => handleUserBan(7)}
                      >
                        <FontAwesomeIcon icon={faUserSlash} />
                        Khóa 7 ngày
                      </Button>
                      <Button
                        look="outline"
                        className={modStyles.actionBtnBanPerm}
                        disabled={isActing}
                        loading={pendingAction === "user-ban-perm"}
                        loadingLabel={ACTION_LOADING.ban}
                        onClick={() => handleUserBan(0, true)}
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
                        className={modStyles.actionBtnDelete}
                        disabled={isActing}
                        loading={pendingAction === "community-delete"}
                        loadingLabel={ACTION_LOADING.delete}
                        onClick={() =>
                          handleCommunityResolve(
                            deleteReportedPost,
                            "Đã xóa bài viết.",
                            resolveReportDeleteViaApi,
                            "community-delete",
                          )
                        }
                      >
                        Xóa bài viết
                      </Button>
                      <Button
                        look="outline"
                        className={modStyles.actionBtnKeep}
                        disabled={isActing}
                        loading={pendingAction === "community-keep"}
                        loadingLabel={ACTION_LOADING.dismiss}
                        onClick={() =>
                          handleCommunityResolve(
                            dismissReport,
                            "Đã từ chối báo cáo — giữ bài.",
                            resolveReportDismissViaApi,
                            "community-keep",
                          )
                        }
                      >
                        Giữ nguyên bài
                      </Button>
                      <Button
                        look="outline"
                        className={modStyles.actionBtnBanTemp}
                        disabled={isActing}
                        loading={pendingAction === "community-ban-7"}
                        loadingLabel={ACTION_LOADING.ban}
                        onClick={() => handleCommunityBan(7)}
                      >
                        <FontAwesomeIcon icon={faUserSlash} />
                        Khóa 7 ngày
                      </Button>
                      <Button
                        look="outline"
                        className={modStyles.actionBtnBanPerm}
                        disabled={isActing}
                        loading={pendingAction === "community-ban-perm"}
                        loadingLabel={ACTION_LOADING.ban}
                        onClick={() => handleCommunityBan(0, true)}
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
