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
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import {
  REPORT_STATUS_LABELS,
  banReportedUser,
  deleteReportedPost,
  dismissReport,
  getAdminReports,
} from "@/features/admin/moderation/adminReportData";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import modStyles from "@/features/admin/moderation/AdminModerationPage.module.css";

const TAB_OPTIONS = [
  { id: "pending", label: "Chờ xử lý" },
  { id: "resolved", label: "Đã xử lý" },
  { id: "all", label: "Tất cả" },
];

function AdminModerationPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState(getAdminReports);
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [lastResolved, setLastResolved] = useState(null);

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const urgentCount = reports.filter((r) => r.status === "pending" && r.urgent).length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (tab === "pending" && r.status !== "pending") return false;
      if (tab === "resolved" && r.status !== "resolved") return false;
      if (!q) return true;
      return (
        r.postId.includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.reporter.toLowerCase().includes(q) ||
        r.reportedUser.toLowerCase().includes(q) ||
        r.post.title.toLowerCase().includes(q)
      );
    });
  }, [reports, tab, query]);

  const reportPage = useAdminPagination(filtered, ADMIN_PAGE_SIZES.reports, [tab, query, reports]);

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

  function refresh() {
    setReports(getAdminReports());
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

  function handleResolve(fn, toastMsg) {
    if (!selected) return;
    const result = fn(selected.id);
    if (!result) return;
    refresh();
    setLastResolved(result);
    showToast(toastMsg);
    if (result.status === "resolved") {
      const nextPending = getAdminReports().filter((r) => r.status === "pending");
      setSelectedId(nextPending[0]?.id ?? null);
    }
  }

  return (
    <AdminPageLayout
      title="Hàng chờ báo cáo"
      subtitle="Xem bài bị báo cáo, quyết định xóa nội dung, giữ nguyên hoặc khóa tài khoản vi phạm."
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Báo cáo" }]}
      actions={
        <Button look="outline" to="/admin/users?status=banned">
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
              Xem nội dung bài viết
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
              <p className={modStyles.bannerTitle}>
                Đã xử lý báo cáo bài #{lastResolved.postId}
              </p>
              <p className={modStyles.bannerMeta}>
                {lastResolved.resolution?.action} · {lastResolved.resolution?.resolvedAt}
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
                placeholder="Tìm bài, lý do, @user..."
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
            </div>

            <div className={modStyles.queueScroll}>
              {filtered.length === 0 ? (
                <div className={modStyles.emptyQueue}>
                  <FontAwesomeIcon icon={faInbox} className={modStyles.emptyIcon} />
                  <p className={modStyles.emptyTitle}>Không có báo cáo</p>
                  <p className={modStyles.emptyDesc}>Thử đổi tab hoặc từ khóa tìm kiếm.</p>
                </div>
              ) : (
                <ul className={modStyles.queueList}>
                  {reportPage.pageItems.map((report) => {
                    const isActive = selectedId === report.id;
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
                              <p className={modStyles.queueTitle}>Bài #{report.postId}</p>
                              <p className={modStyles.queueReason}>{report.reason}</p>
                              <div className={modStyles.tagRow}>
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
                                @{report.reporter} → @{report.reportedUser} · {report.createdAt}
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
          </div>

          <div className={modStyles.detailCol}>
            {!selected ? (
              <div className={modStyles.detailEmpty}>
                <FontAwesomeIcon icon={faMousePointer} className={modStyles.emptyIcon} />
                <p className={modStyles.emptyTitle}>Chọn một báo cáo</p>
                <p className={modStyles.emptyDesc}>Nội dung bài và thao tác xử lý hiển thị tại đây.</p>
              </div>
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
                        <Link
                          to={`/admin/users`}
                          className={modStyles.linkUser}
                        >
                          @{selected.reportedUser}
                        </Link>
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
                          handleResolve(deleteReportedPost, "Đã xóa bài viết (mock).")
                        }
                      >
                        Xóa bài viết
                      </Button>
                      <Button
                        look="outline"
                        onClick={() =>
                          handleResolve(dismissReport, "Đã từ chối báo cáo — giữ bài (mock).")
                        }
                      >
                        Giữ nguyên bài
                      </Button>
                      <Button
                        look="outline"
                        onClick={() =>
                          handleResolve(
                            (id) => banReportedUser(id, "7 ngày"),
                            "Đã khóa tài khoản 7 ngày (mock).",
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faUserSlash} />
                        Khóa 7 ngày
                      </Button>
                      <Button
                        look="outline"
                        onClick={() =>
                          handleResolve(
                            (id) => banReportedUser(id, "vĩnh viễn"),
                            "Đã khóa vĩnh viễn (mock).",
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
