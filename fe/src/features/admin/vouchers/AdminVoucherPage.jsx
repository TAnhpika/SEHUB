import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import * as adminApi from "@/api/adminApi";
import { getAdminUserDetailUrl } from "@/features/admin/adminMockData";
import AdminGrantVoucherModal from "@/features/admin/vouchers/AdminGrantVoucherModal";
import {
  loadAdminVoucherGrants,
  loadStudentsForVoucherGrant,
  grantVoucherToUser,
  revokeVoucherGrant,
} from "@/features/admin/vouchers/adminVoucherData";
import {
  getVoucherTemplate,
  VOUCHER_SOURCE_LABELS,
  VOUCHER_STATUS_META,
  VOUCHER_TEMPLATES,
} from "@/features/admin/vouchers/adminVoucherPolicy";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import voucherStyles from "@/features/admin/vouchers/AdminVouchers.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hiệu lực" },
  { value: "used", label: "Đã dùng" },
  { value: "expired", label: "Hết hạn" },
  { value: "revoked", label: "Đã thu hồi" },
];

const SOURCE_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "manual", label: "Admin thủ công" },
  { value: "payment", label: "Sau thanh toán" },
  { value: "rank", label: "Thưởng rank" },
];

function AdminVoucherPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!USE_MOCK);
  const [grants, setGrants] = useState(USE_MOCK ? [] : []);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
    revoked: 0,
    manual: 0,
  });
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantError, setGrantError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [voucherData, studentList] = await Promise.all([
          loadAdminVoucherGrants({
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: search.trim() || undefined,
          }),
          loadStudentsForVoucherGrant(),
        ]);

        if (!cancelled) {
          setGrants(voucherData.items);
          setStats(voucherData.stats);
          setStudents(studentList);
        }

        if (!USE_MOCK && !cancelled) {
          const levelRows = await adminApi.getGamificationLevels();
          setLevels(levelRows ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error.message ?? "Không tải được danh sách voucher.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, statusFilter, search, showToast]);

  const filtered = useMemo(() => {
    if (!USE_MOCK) return grants;

    const q = search.trim().toLowerCase();
    return grants.filter((grant) => {
      if (statusFilter !== "all" && grant.status !== statusFilter) return false;
      if (sourceFilter !== "all" && grant.source !== sourceFilter) return false;
      if (!q) return true;
      const template = getVoucherTemplate(grant.templateId);
      return (
        grant.username.toLowerCase().includes(q) ||
        grant.code?.toLowerCase().includes(q) ||
        grant.reason?.toLowerCase().includes(q) ||
        (template?.label.toLowerCase().includes(q) ?? false)
      );
    });
  }, [grants, statusFilter, sourceFilter, search]);

  const grantPage = useAdminPagination(filtered, ADMIN_PAGE_SIZES.vouchers, [
    statusFilter,
    sourceFilter,
    search,
    refreshKey,
  ]);

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  async function handleGrantSubmit(payload) {
    const result = await grantVoucherToUser({
      ...payload,
      grantedBy: user?.username ?? "admin_sehub",
    });
    if (!result.ok) {
      setGrantError(result.message ?? "Không thể cấp voucher.");
      return;
    }
    setGrantError("");
    setGrantOpen(false);
    refresh();
    showToast(`Đã cấp voucher cho @${payload.username}.`);
  }

  async function handleRevoke(id) {
    const result = await revokeVoucherGrant(id, user?.username ?? "admin_sehub");
    if (!result.ok) {
      showToast(result.message ?? "Không thể thu hồi voucher.");
      return;
    }
    refresh();
    showToast("Đã thu hồi voucher.");
  }

  return (
    <AdminPageLayout
      title="Quản lý voucher"
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý voucher" },
      ]}
      actions={
        <Button onClick={() => setGrantOpen(true)}>
          <FontAwesomeIcon icon={faTicket} />
          Cấp voucher
        </Button>
      }
    >
      <p className={voucherStyles.flowNote}>
        <strong>Luồng cấp voucher:</strong> Admin cấp → voucher gắn vào tài khoản → SV thấy tại{" "}
        <em>Voucher của tôi</em> + thông báo in-app.
        {USE_MOCK
          ? " Gói Premium tự động cấp FTES sau PayOS — Admin chỉ can thiệp khi bù lỗi / event."
          : " Voucher rank thưởng giảm % Premium theo level Gamification."}
      </p>

      <div className={voucherStyles.kpiStrip}>
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>Tổng đã cấp</span>
          <strong className={voucherStyles.kpiValue}>{stats.total}</strong>
        </div>
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>Đang hiệu lực</span>
          <strong className={voucherStyles.kpiValue}>{stats.active}</strong>
          <span className={voucherStyles.kpiHint}>SV có thể dùng</span>
        </div>
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>Đã dùng</span>
          <strong className={voucherStyles.kpiValue}>{stats.used}</strong>
        </div>
        {USE_MOCK ? (
          <div className={voucherStyles.kpiCard}>
            <span className={voucherStyles.kpiLabel}>Admin cấp tay</span>
            <strong className={voucherStyles.kpiValue}>{stats.manual}</strong>
          </div>
        ) : null}
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>Đã thu hồi</span>
          <strong className={voucherStyles.kpiValue}>{stats.revoked}</strong>
        </div>
      </div>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Danh sách voucher đã gắn</h2>
        <div className={styles.divider} />

        <div className={voucherStyles.filters}>
          <label className={voucherStyles.filterField}>
            <span className={voucherStyles.filterLabel}>Tìm kiếm</span>
            <input
              className={styles.input}
              placeholder={USE_MOCK ? "@username, mã voucher, lý do…" : "@username…"}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className={voucherStyles.filterField}>
            <span className={voucherStyles.filterLabel}>Trạng thái</span>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {USE_MOCK ? (
            <label className={voucherStyles.filterField}>
              <span className={voucherStyles.filterLabel}>Nguồn cấp</span>
              <select
                className={styles.select}
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                {SOURCE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {loading ? (
          <p className={styles.empty}>Đang tải voucher…</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>{USE_MOCK ? "Loại voucher" : "Level / Giảm giá"}</th>
                    {USE_MOCK ? <th>Mã</th> : null}
                    {USE_MOCK ? <th>Nguồn</th> : null}
                    <th>Trạng thái</th>
                    <th>Cấp lúc</th>
                    <th>Hết hạn</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {grantPage.pageItems.length > 0 ? (
                    grantPage.pageItems.map((grant) => {
                      const template = USE_MOCK ? getVoucherTemplate(grant.templateId) : null;
                      const userUrl = getAdminUserDetailUrl(grant.username);
                      const statusMeta = VOUCHER_STATUS_META[grant.status] ?? {
                        status: "draft",
                        label: grant.status,
                      };

                      return (
                        <tr key={grant.id}>
                          <td className={styles.cellMain}>
                            {userUrl ? (
                              <Link to={userUrl} className={styles.link}>
                                @{grant.username}
                              </Link>
                            ) : (
                              `@${grant.username}`
                            )}
                            {USE_MOCK ? (
                              <span className={styles.cellSub}>{grant.reason}</span>
                            ) : (
                              <span className={styles.cellSub}>{grant.displayName}</span>
                            )}
                          </td>
                          <td>
                            {USE_MOCK ? (
                              <>
                                {template?.label ?? grant.templateId}
                                {template?.partner ? (
                                  <span className={voucherStyles.partnerTag}>{template.partner}</span>
                                ) : null}
                              </>
                            ) : (
                              <>
                                {grant.levelName} · −{grant.discountPercent}%
                              </>
                            )}
                          </td>
                          {USE_MOCK ? (
                            <td>
                              <span className={voucherStyles.codePill}>{grant.code}</span>
                            </td>
                          ) : null}
                          {USE_MOCK ? (
                            <td>{VOUCHER_SOURCE_LABELS[grant.source]}</td>
                          ) : null}
                          <td>
                            <StatusBadge status={statusMeta.status} label={statusMeta.label} />
                          </td>
                          <td>
                            {grant.grantedAt}
                            {USE_MOCK ? (
                              <span className={styles.cellSub}>bởi {grant.grantedBy}</span>
                            ) : null}
                          </td>
                          <td>{grant.expiresAt}</td>
                          <td>
                            <button
                              type="button"
                              className={voucherStyles.revokeBtn}
                              disabled={grant.status !== "active"}
                              onClick={() => handleRevoke(grant.id)}
                            >
                              Thu hồi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={USE_MOCK ? 8 : 6} style={{ color: "#434655", padding: "1.5rem" }}>
                        Chưa có voucher phù hợp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <AdminTableFooter
              rangeStart={grantPage.rangeStart}
              rangeEnd={grantPage.rangeEnd}
              total={grantPage.total}
              unit="voucher"
              currentPage={grantPage.safePage}
              totalPages={grantPage.totalPages}
              onPageChange={grantPage.handlePageChange}
              ariaLabel="Phân trang voucher"
            />
          </>
        )}
      </section>

      {USE_MOCK ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Mẫu voucher hệ thống</h2>
          <p className={styles.panelDesc}>
            Template dùng khi cấp thủ công hoặc tự động sau thanh toán / lên rank.
          </p>
          <div className={voucherStyles.templateGrid}>
            {VOUCHER_TEMPLATES.map((template) => (
              <article key={template.id} className={voucherStyles.templateCard}>
                <h3 className={voucherStyles.templateCardTitle}>{template.label}</h3>
                <p className={voucherStyles.templateCardMeta}>
                  {template.discountLabel} · {template.validityDays} ngày · {template.scope}
                </p>
                <p className={voucherStyles.templateCardDesc}>{template.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <AdminGrantVoucherModal
        open={grantOpen}
        students={students}
        levels={levels}
        useMock={USE_MOCK}
        onClose={() => {
          setGrantOpen(false);
          setGrantError("");
        }}
        onSubmit={handleGrantSubmit}
        error={grantError}
      />
    </AdminPageLayout>
  );
}

export default AdminVoucherPage;
