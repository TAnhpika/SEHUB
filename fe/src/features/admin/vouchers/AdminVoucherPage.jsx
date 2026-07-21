import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import * as adminApi from "@/api/adminApi";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import { StaffGenericTableSkeleton } from "@/common/Skeleton/StaffSkeleton";
import AdminGrantVoucherModal from "@/features/admin/vouchers/AdminGrantVoucherModal";
import ImportPartnerVoucherModal from "@/features/admin/vouchers/ImportPartnerVoucherModal";
import {
  assignPartnerVoucherToUser,
  grantVoucherToUser,
  importPartnerVoucherCodes,
  loadAdminVoucherGrants,
  loadPartnerVoucherInventory,
  loadPartnerVoucherTypes,
  loadStudentsForVoucherGrant,
  revokePartnerVoucherGrant,
  revokeVoucherGrant,
} from "@/features/admin/vouchers/adminVoucherData";
import { VOUCHER_STATUS_META } from "@/features/admin/vouchers/adminVoucherPolicy";
import voucherStyles from "@/features/admin/vouchers/AdminVouchers.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const PARTNER_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "available", label: "Trong kho" },
  { value: "assigned", label: "Đã gán" },
  { value: "revoked", label: "Đã thu hồi" },
];

const RANK_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hiệu lực" },
  { value: "used", label: "Đã dùng" },
  { value: "expired", label: "Hết hạn" },
  { value: "revoked", label: "Đã thu hồi" },
];

function AdminVoucherPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState("ftes");
  const [loading, setLoading] = useState(true);
  const [partnerItems, setPartnerItems] = useState([]);
  const [partnerStats, setPartnerStats] = useState({
    availableFtes20: 0,
    availableFtes100: 0,
    availableTotal: 0,
    assigned: 0,
    revoked: 0,
    total: 0,
  });
  const [rankItems, setRankItems] = useState([]);
  const [rankStats, setRankStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
    revoked: 0,
  });
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantMode, setGrantMode] = useState("partner");
  const [grantError, setGrantError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [partnerData, rankData, studentList, types] = await Promise.all([
          loadPartnerVoucherInventory({
            status: statusFilter !== "all" && tab === "ftes" ? statusFilter : undefined,
            typeCode: typeFilter !== "all" ? typeFilter : undefined,
            search: search.trim() || undefined,
          }),
          loadAdminVoucherGrants({
            status: statusFilter !== "all" && tab === "rank" ? statusFilter : undefined,
            search: search.trim() || undefined,
          }),
          loadStudentsForVoucherGrant(),
          loadPartnerVoucherTypes(),
        ]);

        if (cancelled) return;
        setPartnerItems(partnerData.items);
        setPartnerStats(partnerData.stats);
        setRankItems(rankData.items);
        setRankStats(rankData.stats);
        setStudents(studentList);
        setPartnerTypes(types);

        const levelRows = await adminApi.getGamificationLevels();
        if (!cancelled) setLevels(levelRows ?? []);
      } catch (error) {
        if (!cancelled) {
          showToast(error.message ?? "Không tải được dữ liệu voucher.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, statusFilter, typeFilter, search, tab, showToast]);

  const partnerPage = useAdminPagination(partnerItems, ADMIN_PAGE_SIZES.vouchers, [
    statusFilter,
    typeFilter,
    search,
    refreshKey,
    tab,
  ]);
  const rankPage = useAdminPagination(rankItems, ADMIN_PAGE_SIZES.vouchers, [
    statusFilter,
    search,
    refreshKey,
    tab,
  ]);

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  async function handleImportSubmit({ typeCode, codes }) {
    setImporting(true);
    setImportError("");
    const result = await importPartnerVoucherCodes({ typeCode, codes });
    setImporting(false);
    if (!result.ok) {
      setImportError(result.message);
      return;
    }
    setImportOpen(false);
    refresh();
    showToast(
      `Import ${result.imported} mã · bỏ trùng ${result.duplicatesSkipped} · không hợp lệ ${result.invalid}. Kho còn ${result.remainingAvailable}.`,
    );
  }

  async function handleGrantSubmit(payload) {
    if (grantMode === "partner") {
      const result = await assignPartnerVoucherToUser({
        userId: payload.userId,
        typeCode: payload.typeCode,
      });
      if (!result.ok) {
        setGrantError(result.message ?? "Không cấp được mã FTES.");
        return;
      }
      setGrantError("");
      setGrantOpen(false);
      refresh();
      showToast(`Đã cấp mã FTES cho @${payload.username}.`);
      return;
    }

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
    showToast(`Đã cấp voucher rank cho @${payload.username}.`);
  }

  async function handleRevokePartner(id) {
    const result = await revokePartnerVoucherGrant(id);
    if (!result.ok) {
      showToast(result.message ?? "Không thể thu hồi mã FTES.");
      return;
    }
    refresh();
    showToast("Đã thu hồi mã FTES.");
  }

  async function handleRevokeRank(id) {
    const result = await revokeVoucherGrant(id);
    if (!result.ok) {
      showToast(result.message ?? "Không thể thu hồi voucher.");
      return;
    }
    refresh();
    showToast("Đã thu hồi voucher rank.");
  }

  const poolEmpty = partnerStats.availableTotal === 0;

  return (
    <AdminPageLayout
      title="Quản lý voucher"
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Quản lý voucher" }]}
      actions={
        <div className={voucherStyles.actionRow}>
          <Button
            look="outline"
            onClick={() => {
              setGrantMode("rank");
              setGrantOpen(true);
            }}
          >
            Cấp voucher rank
          </Button>
          <Button
            look="outline"
            onClick={() => {
              setGrantMode("partner");
              setGrantOpen(true);
            }}
          >
            Cấp bù FTES
          </Button>
          <Button onClick={() => setImportOpen(true)}>
            <FontAwesomeIcon icon={faFileImport} />
            Import mã FTES
          </Button>
        </div>
      }
    >
      <p className={voucherStyles.flowNote}>
        <strong>Mã FTES:</strong> Admin import vào kho → SV mua Premium <code>8m</code> (20%) /{" "}
        <code>4y</code> (100%) được gán tự động khi Paid.{" "}
        <strong>Voucher rank:</strong> giảm % checkout Premium SEHUB (Gold/Platinum) — tách biệt.
      </p>

      <div className={voucherStyles.kpiStrip}>
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>Kho FTES 20%</span>
          <strong className={voucherStyles.kpiValue}>{partnerStats.availableFtes20}</strong>
        </div>
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>Kho FTES 100%</span>
          <strong className={voucherStyles.kpiValue}>{partnerStats.availableFtes100}</strong>
        </div>
        <div className={`${voucherStyles.kpiCard} ${poolEmpty ? voucherStyles.kpiWarn : ""}`}>
          <span className={voucherStyles.kpiLabel}>Tổng còn trong kho</span>
          <strong className={voucherStyles.kpiValue}>{partnerStats.availableTotal}</strong>
          {poolEmpty ? <span className={voucherStyles.kpiHint}>Hết kho — cần import</span> : null}
        </div>
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>FTES đã gán</span>
          <strong className={voucherStyles.kpiValue}>{partnerStats.assigned}</strong>
        </div>
        <div className={voucherStyles.kpiCard}>
          <span className={voucherStyles.kpiLabel}>Rank đang hiệu lực</span>
          <strong className={voucherStyles.kpiValue}>{rankStats.active}</strong>
        </div>
      </div>

      <div className={voucherStyles.tabRow} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ftes"}
          className={tab === "ftes" ? voucherStyles.tabActive : voucherStyles.tab}
          onClick={() => {
            setTab("ftes");
            setStatusFilter("all");
          }}
        >
          Kho mã FTES
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "rank"}
          className={tab === "rank" ? voucherStyles.tabActive : voucherStyles.tab}
          onClick={() => {
            setTab("rank");
            setStatusFilter("all");
          }}
        >
          Voucher rank SEHUB
        </button>
      </div>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>
          {tab === "ftes" ? "Mã FTES trong hệ thống" : "Voucher rank đã cấp"}
        </h2>
        <div className={styles.divider} />

        <div className={voucherStyles.filters}>
          <label className={voucherStyles.filterField}>
            <span className={voucherStyles.filterLabel}>Tìm kiếm</span>
            <input
              className={styles.input}
              placeholder={tab === "ftes" ? "Mã FTES…" : "@username…"}
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
              {(tab === "ftes" ? PARTNER_STATUS_OPTIONS : RANK_STATUS_OPTIONS).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {tab === "ftes" ? (
            <label className={voucherStyles.filterField}>
              <span className={voucherStyles.filterLabel}>Loại</span>
              <select
                className={styles.select}
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">Tất cả</option>
                {partnerTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {loading ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th colSpan={tab === "ftes" ? 8 : 6}>Đang tải…</th>
                </tr>
              </thead>
              <StaffGenericTableSkeleton
                columns={tab === "ftes" ? 8 : 6}
                aria-label="Đang tải danh sách voucher"
              />
            </table>
          </div>
        ) : tab === "ftes" ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Sinh viên</th>
                    <th>Import</th>
                    <th>Gán</th>
                    <th>Hết hạn</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {partnerPage.pageItems.length > 0 ? (
                    partnerPage.pageItems.map((item) => {
                      const statusMeta = VOUCHER_STATUS_META[item.status] ?? {
                        status: "draft",
                        label: item.status,
                      };
                      const userUrl = item.assignedUserId
                        ? `/admin/users/${item.assignedUserId}`
                        : null;
                      return (
                        <tr key={item.id}>
                          <td>
                            <span className={voucherStyles.codePill}>{item.code}</span>
                          </td>
                          <td>
                            {item.typeLabel || item.typeCode}
                            <span className={voucherStyles.partnerTag}>FTES</span>
                          </td>
                          <td>
                            <StatusBadge status={statusMeta.status} label={statusMeta.label} />
                          </td>
                          <td>
                            {item.assignedUsername ? (
                              <div className={voucherStyles.studentCell}>
                                {item.assignedDisplayName ? (
                                  <span className={voucherStyles.studentName}>
                                    {item.assignedDisplayName}
                                  </span>
                                ) : null}
                                {userUrl ? (
                                  <Link to={userUrl} className={voucherStyles.studentHandle}>
                                    @{item.assignedUsername}
                                  </Link>
                                ) : (
                                  <span className={voucherStyles.studentHandle}>
                                    @{item.assignedUsername}
                                  </span>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={voucherStyles.dateCell}>{item.importedAt || "—"}</td>
                          <td className={voucherStyles.dateCell}>
                            {item.assignedAt && item.assignedAt !== "—" ? item.assignedAt : "—"}
                          </td>
                          <td className={voucherStyles.dateCell}>{item.expiresAt}</td>
                          <td>
                            <button
                              type="button"
                              className={voucherStyles.revokeBtn}
                              disabled={
                                item.status !== "available" && item.status !== "assigned"
                              }
                              onClick={() => handleRevokePartner(item.id)}
                            >
                              Thu hồi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ color: "#434655", padding: "1.5rem" }}>
                        Chưa có mã FTES. Hãy import lô mã partner.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminTableFooter
              rangeStart={partnerPage.rangeStart}
              rangeEnd={partnerPage.rangeEnd}
              total={partnerPage.total}
              unit="mã"
              currentPage={partnerPage.safePage}
              totalPages={partnerPage.totalPages}
              onPageChange={partnerPage.handlePageChange}
              ariaLabel="Phân trang mã FTES"
            />
          </>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Level / Giảm giá</th>
                    <th>Trạng thái</th>
                    <th>Cấp lúc</th>
                    <th>Hết hạn</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rankPage.pageItems.length > 0 ? (
                    rankPage.pageItems.map((grant) => {
                      const userUrl = grant.userId ? `/admin/users/${grant.userId}` : null;
                      const statusMeta = VOUCHER_STATUS_META[grant.status] ?? {
                        status: "draft",
                        label: grant.status,
                      };
                      return (
                        <tr key={grant.id}>
                          <td>
                            <div className={voucherStyles.studentCell}>
                              {grant.displayName ? (
                                <span className={voucherStyles.studentName}>{grant.displayName}</span>
                              ) : null}
                              {userUrl ? (
                                <Link to={userUrl} className={voucherStyles.studentHandle}>
                                  @{grant.username}
                                </Link>
                              ) : (
                                <span className={voucherStyles.studentHandle}>@{grant.username}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {grant.levelName} · −{grant.discountPercent}%
                          </td>
                          <td>
                            <StatusBadge status={statusMeta.status} label={statusMeta.label} />
                          </td>
                          <td>{grant.grantedAt}</td>
                          <td>{grant.expiresAt}</td>
                          <td>
                            <button
                              type="button"
                              className={voucherStyles.revokeBtn}
                              disabled={grant.status !== "active"}
                              onClick={() => handleRevokeRank(grant.id)}
                            >
                              Thu hồi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ color: "#434655", padding: "1.5rem" }}>
                        Chưa có voucher rank phù hợp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminTableFooter
              rangeStart={rankPage.rangeStart}
              rangeEnd={rankPage.rangeEnd}
              total={rankPage.total}
              unit="voucher"
              currentPage={rankPage.safePage}
              totalPages={rankPage.totalPages}
              onPageChange={rankPage.handlePageChange}
              ariaLabel="Phân trang voucher rank"
            />
          </>
        )}
      </section>

      <ImportPartnerVoucherModal
        open={importOpen}
        types={partnerTypes}
        error={importError}
        submitting={importing}
        onClose={() => {
          setImportOpen(false);
          setImportError("");
        }}
        onSubmit={handleImportSubmit}
      />

      <AdminGrantVoucherModal
        open={grantOpen}
        mode={grantMode}
        students={students}
        levels={levels}
        partnerTypes={partnerTypes}
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
