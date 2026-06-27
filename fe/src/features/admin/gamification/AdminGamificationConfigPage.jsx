import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import BadgeFormModal from "@/features/admin/gamification/BadgeFormModal";
import GamificationDeleteModal from "@/features/admin/gamification/GamificationDeleteModal";
import PointRuleFormModal from "@/features/admin/gamification/PointRuleFormModal";
import RankFormModal from "@/features/admin/gamification/RankFormModal";
import {
  createBadge,
  createPointRule,
  createRankTier,
  deleteBadge,
  deletePointRule,
  deleteRankTier,
  getBadges,
  getGamificationStats,
  getPointRules,
  getRankColorHex,
  getRankTiers,
  hydrateGamificationFromApi,
  saveRankTiersToApi,
  toggleBadgeActive,
  togglePointRuleActive,
  toggleRankTierActive,
  updateBadge,
  updatePointRule,
  updateRankTier,
} from "@/features/admin/gamification/adminGamificationData";
import {
  formatTriggerRule,
  getCategoryLabel,
  getPointRuleTypeLabel,
} from "@/features/admin/gamification/adminGamificationPolicy";
import gStyles from "@/features/admin/gamification/Gamification.module.css";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import styles from "@/features/admin/shared/adminPage.module.css";

const TABS = [
  { id: "ranks", label: "Cấp độ hạng" },
  { id: "badges", label: "Danh hiệu" },
  { id: "rules", label: "Quy tắc điểm" },
];

const CATEGORY_CLASS = {
  community: gStyles.categoryPillCommunity,
  learning: gStyles.categoryPillLearning,
  exam: gStyles.categoryPillExam,
  streak: gStyles.categoryPillStreak,
  social: gStyles.categoryPillSocial,
};

function AdminGamificationConfigPage() {
  const { showToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState("ranks");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rankModal, setRankModal] = useState({ open: false, editing: null, error: "" });
  const [badgeModal, setBadgeModal] = useState({ open: false, editing: null, error: "" });
  const [ruleModal, setRuleModal] = useState({ open: false, editing: null, error: "" });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: "",
    id: null,
    label: "",
  });

  useEffect(() => {
    hydrateGamificationFromApi().then((result) => {
      if (result && result.ok === false) {
        showToast(result.message ?? "Không tải được cấu hình gamification.");
      }
      setRefreshKey((k) => k + 1);
    });
  }, []);

  const stats = useMemo(() => getGamificationStats(), [refreshKey]);
  const ranks = useMemo(() => getRankTiers(), [refreshKey]);
  const badges = useMemo(() => getBadges(), [refreshKey]);
  const rules = useMemo(() => getPointRules(), [refreshKey]);

  const filteredBadges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return badges.filter((b) => {
      const matchCat = categoryFilter === "all" || b.category === categoryFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && b.active) ||
        (statusFilter === "inactive" && !b.active);
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q);
      return matchCat && matchStatus && matchSearch;
    });
  }, [badges, search, categoryFilter, statusFilter]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((r) => {
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.active) ||
        (statusFilter === "inactive" && !r.active);
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [rules, search, statusFilter]);

  const badgePage = useAdminPagination(
    filteredBadges,
    ADMIN_PAGE_SIZES.badges,
    [search, categoryFilter, statusFilter, tab, refreshKey],
  );
  const rulePage = useAdminPagination(
    filteredRules,
    ADMIN_PAGE_SIZES.pointRules,
    [search, statusFilter, tab, refreshKey],
  );
  function bump() {
    setRefreshKey((k) => k + 1);
  }

  function openCreate() {
    if (tab === "ranks") setRankModal({ open: true, editing: null, error: "" });
    if (tab === "badges") setBadgeModal({ open: true, editing: null, error: "" });
    if (tab === "rules") setRuleModal({ open: true, editing: null, error: "" });
  }

  async function handleRankSubmit(payload) {
    const result = rankModal.editing
      ? updateRankTier(rankModal.editing.id, payload)
      : createRankTier(payload);
    if (!result.ok) {
      setRankModal((m) => ({ ...m, error: result.message }));
      return;
    }
    const saveResult = await saveRankTiersToApi();
    if (!saveResult.ok) {
      setRankModal((m) => ({ ...m, error: saveResult.message }));
      return;
    }
    showToast(rankModal.editing ? "Đã cập nhật cấp hạng." : "Đã tạo cấp hạng mới.");
    setRankModal({ open: false, editing: null, error: "" });
    bump();
  }

  function handleBadgeSubmit(payload) {
    const action = badgeModal.editing
      ? updateBadge(badgeModal.editing.id, payload)
      : createBadge(payload);
    action
      .then((result) => {
        if (!result.ok) {
          setBadgeModal((m) => ({ ...m, error: result.message }));
          return;
        }
        showToast(badgeModal.editing ? "Đã cập nhật danh hiệu." : "Đã tạo danh hiệu mới.");
        setBadgeModal({ open: false, editing: null, error: "" });
        bump();
      })
      .catch((err) => {
        setBadgeModal((m) => ({ ...m, error: err.message ?? "Không lưu được danh hiệu." }));
      });
  }

  function handleRuleSubmit(payload) {
    const runSave = ruleModal.editing
      ? updatePointRule(ruleModal.editing.id, payload)
      : createPointRule(payload);

    Promise.resolve(runSave)
      .then((result) => {
        if (!result.ok) {
          setRuleModal((m) => ({ ...m, error: result.message }));
          return;
        }
        showToast(ruleModal.editing ? "Đã cập nhật quy tắc." : "Đã tạo quy tắc mới.");
        setRuleModal({ open: false, editing: null, error: "" });
        bump();
      })
      .catch((err) => {
        setRuleModal((m) => ({ ...m, error: err.message ?? "Không lưu được quy tắc." }));
      });
  }

  function confirmDelete() {
    if (!deleteModal.id) return;
    const runDelete = async () => {
      if (deleteModal.type === "rank") return deleteRankTier(deleteModal.id);
      if (deleteModal.type === "badge") return deleteBadge(deleteModal.id);
      return deletePointRule(deleteModal.id);
    };

    runDelete()
      .then((result) => {
        if (!result.ok) {
          showToast(result.message);
          return;
        }
        showToast(`Đã xóa ${deleteModal.label}.`);
        setDeleteModal({ open: false, type: "", id: null, label: "" });
        bump();
      })
      .catch((err) => {
        showToast(err.message ?? "Không xóa được.");
      });
  }

  const createLabel =
    tab === "ranks" ? "Thêm cấp hạng" : tab === "badges" ? "Thêm danh hiệu" : "Thêm quy tắc";

  return (
    <AdminPageLayout
      title="Gamification config"
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Gamification config" },
      ]}
      actions={<Button onClick={openCreate}>{createLabel}</Button>}
    >
      <div className={gStyles.statsStrip}>
        <div className={gStyles.statCard}>
          <p className={gStyles.statLabel}>Cấp hạng</p>
          <p className={gStyles.statValue}>{stats.rankCount}</p>
          <p className={gStyles.statHint}>đang bật</p>
        </div>
        <div className={gStyles.statCard}>
          <p className={gStyles.statLabel}>Danh hiệu</p>
          <p className={gStyles.statValue}>{stats.badgeCount}</p>
          <p className={gStyles.statHint}>
            {stats.activeBadges} bật · {stats.inactiveBadges} tắt
          </p>
        </div>
        <div className={gStyles.statCard}>
          <p className={gStyles.statLabel}>Quy tắc điểm</p>
          <p className={gStyles.statValue}>{stats.pointRuleCount}</p>
          <p className={gStyles.statHint}>đang bật</p>
        </div>
        <div className={gStyles.statCard}>
          <p className={gStyles.statLabel}>Lượt mở khóa</p>
          <p className={gStyles.statValue}>
            {stats.totalUnlocks.toLocaleString("vi-VN")}
          </p>
          <p className={gStyles.statHint}>tổng lượt mở khóa danh hiệu</p>
        </div>
        <div className={gStyles.statCard}>
          <p className={gStyles.statLabel}>Mục tiêu §3.6</p>
          <p className={gStyles.statValue}>26</p>
          <p className={gStyles.statHint}>
            hiện {stats.badgeCount} / 26 danh hiệu
          </p>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={[styles.tab, tab === t.id ? styles.tabActive : ""].filter(Boolean).join(" ")}
            onClick={() => {
              setTab(t.id);
              setSearch("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ranks" ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Cấp độ hạng (Rank)</h2>
              <p className={styles.panelDesc}>
                Bronze → Platinum. Ngưỡng điểm do Admin cấu hình — thanh tiến trình trên hồ sơ SV.
              </p>
            </div>
            <Button size="sm" onClick={() => setRankModal({ open: true, editing: null, error: "" })}>
              <FontAwesomeIcon icon={faPlus} /> Thêm
            </Button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cấp</th>
                  <th>Ngưỡng điểm</th>
                  <th>Phần thưởng</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ranks.map((rank) => (
                  <tr key={rank.id}>
                    <td>
                      <span
                        className={gStyles.rankDot}
                        style={{ background: getRankColorHex(rank.colorKey) }}
                        aria-hidden
                      />
                      <strong>{rank.name}</strong>
                      <div className={styles.cellSub}>
                        <code className={gStyles.slugCode}>{rank.slug}</code>
                      </div>
                    </td>
                    <td>{rank.minPoints.toLocaleString("vi-VN")} đ</td>
                    <td>
                      {rank.voucherDiscount != null ? (
                        <>
                          <strong>{rank.rewardLabel || `Giảm ${rank.voucherDiscount}%`}</strong>
                          {rank.description ? (
                            <div className={styles.cellSub}>{rank.description}</div>
                          ) : null}
                        </>
                      ) : (
                        <span className={styles.cellSub}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={[
                          gStyles.toggleBtn,
                          rank.active ? gStyles.toggleOn : gStyles.toggleOff,
                        ].join(" ")}
                        onClick={async () => {
                          const r = toggleRankTierActive(rank.id);
                          if (!r.ok) {
                            showToast(r.message);
                            return;
                          }
                          const saveResult = await saveRankTiersToApi();
                          if (!saveResult.ok) showToast(saveResult.message);
                          bump();
                        }}
                      >
                        {rank.active ? "Đang bật" : "Đã tắt"}
                      </button>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Sửa"
                            onClick={() =>
                              setRankModal({ open: true, editing: rank, error: "" })
                            }
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            title="Xóa"
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                type: "rank",
                                id: rank.id,
                                label: rank.name,
                              })
                            }
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "badges" ? (
        <section className={styles.panel}>
          <div className={styles.filterShell}>
            <div className={styles.searchRow}>
              <input
                className={styles.search}
                type="search"
                placeholder="Tìm tên, slug, mô tả…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className={styles.resultChip}>{filteredBadges.length} danh hiệu</span>
            </div>
            <div className={styles.filterRow}>
              <select
                className={styles.select}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Tất cả nhóm</option>
                <option value="community">Cộng đồng</option>
                <option value="learning">Học tập</option>
                <option value="exam">Đề thi</option>
                <option value="streak">Streak</option>
                <option value="social">Tương tác</option>
              </select>
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Đã tắt</option>
              </select>
              <div className={styles.filterActions}>
                <Button
                  size="sm"
                  onClick={() => setBadgeModal({ open: true, editing: null, error: "" })}
                >
                  <FontAwesomeIcon icon={faPlus} /> Thêm danh hiệu
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Danh hiệu</th>
                  <th>Điều kiện</th>
                  <th>Điểm</th>
                  <th>Mở khóa</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredBadges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.cellSub}>
                      Không có danh hiệu phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  badgePage.pageItems.map((badge) => (
                    <tr key={badge.id}>
                      <td>
                        <div className={styles.cellUser}>
                          <span className={gStyles.badgeIcon} aria-hidden>
                            {badge.icon}
                          </span>
                          <div>
                            <div className={styles.cellMain}>{badge.name}</div>
                            <div className={styles.cellSub}>
                              <code className={gStyles.slugCode}>{badge.slug}</code>
                            </div>
                            <span
                              className={[
                                gStyles.categoryPill,
                                CATEGORY_CLASS[badge.category] ?? "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {getCategoryLabel(badge.category)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={gStyles.ruleDesc}>
                          {formatTriggerRule(badge.triggerType, badge.triggerValue)}
                        </div>
                        {badge.description ? (
                          <div className={styles.cellSub}>{badge.description}</div>
                        ) : null}
                      </td>
                      <td>
                        <strong>+{badge.pointsReward}</strong>
                      </td>
                      <td>{badge.unlockCount.toLocaleString("vi-VN")} SV</td>
                      <td>
                        <StatusBadge
                          status={badge.active ? "success" : "pending"}
                          label={badge.active ? "Bật" : "Tắt"}
                        />
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <div className={styles.actionGroup}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              title="Sửa"
                              onClick={() =>
                                setBadgeModal({ open: true, editing: badge, error: "" })
                              }
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              title={badge.active ? "Tắt" : "Bật"}
                              onClick={() => {
                                toggleBadgeActive(badge.id)
                                  .then((result) => {
                                    if (!result.ok) showToast(result.message);
                                    else bump();
                                  })
                                  .catch((err) => showToast(err.message ?? "Không đổi trạng thái."));
                              }}
                            >
                              {badge.active ? "⏸" : "▶"}
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              title="Xóa"
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  type: "badge",
                                  id: badge.id,
                                  label: badge.name,
                                })
                              }
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <AdminTableFooter
            rangeStart={badgePage.rangeStart}
            rangeEnd={badgePage.rangeEnd}
            total={badgePage.total}
            unit="danh hiệu"
            currentPage={badgePage.safePage}
            totalPages={badgePage.totalPages}
            onPageChange={badgePage.handlePageChange}
            ariaLabel="Phân trang danh hiệu"
          />
        </section>
      ) : null}

      {tab === "rules" ? (
        <section className={styles.panel}>
          <div className={styles.filterShell}>
            <div className={styles.searchRow}>
              <input
                className={styles.search}
                type="search"
                placeholder="Tìm quy tắc…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Đã tắt</option>
              </select>
              <div className={styles.filterActions}>
                <Button
                  size="sm"
                  onClick={() => setRuleModal({ open: true, editing: null, error: "" })}
                >
                  <FontAwesomeIcon icon={faPlus} /> Thêm quy tắc
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Quy tắc</th>
                  <th>Sự kiện</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rulePage.pageItems.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <strong>{rule.name}</strong>
                      <div className={styles.cellSub}>
                        <code className={gStyles.slugCode}>{rule.slug}</code>
                      </div>
                      {rule.description ? (
                        <p className={gStyles.ruleDesc}>{rule.description}</p>
                      ) : null}
                    </td>
                    <td>
                      {getPointRuleTypeLabel(rule.eventType)}
                      {rule.intervalDays ? (
                        <div className={styles.cellSub}>mỗi {rule.intervalDays} ngày</div>
                      ) : null}
                    </td>
                    <td>
                      <strong>+{rule.points}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={[
                          gStyles.toggleBtn,
                          rule.active ? gStyles.toggleOn : gStyles.toggleOff,
                        ].join(" ")}
                        onClick={() => {
                          Promise.resolve(togglePointRuleActive(rule.id))
                            .then((result) => {
                              if (result?.ok === false) {
                                showToast(result.message);
                                return;
                              }
                              bump();
                            })
                            .catch((err) => showToast(err.message ?? "Không đổi trạng thái."));
                        }}
                      >
                        {rule.active ? "Đang bật" : "Đã tắt"}
                      </button>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Sửa"
                            onClick={() =>
                              setRuleModal({ open: true, editing: rule, error: "" })
                            }
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            title="Xóa"
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                type: "rule",
                                id: rule.id,
                                label: rule.name,
                              })
                            }
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminTableFooter
            rangeStart={rulePage.rangeStart}
            rangeEnd={rulePage.rangeEnd}
            total={rulePage.total}
            unit="quy tắc"
            currentPage={rulePage.safePage}
            totalPages={rulePage.totalPages}
            onPageChange={rulePage.handlePageChange}
            ariaLabel="Phân trang quy tắc điểm"
          />
        </section>
      ) : null}

      <RankFormModal
        open={rankModal.open}
        editing={rankModal.editing}
        error={rankModal.error}
        onClose={() => setRankModal({ open: false, editing: null, error: "" })}
        onSubmit={handleRankSubmit}
      />
      <BadgeFormModal
        open={badgeModal.open}
        editing={badgeModal.editing}
        error={badgeModal.error}
        onClose={() => setBadgeModal({ open: false, editing: null, error: "" })}
        onSubmit={handleBadgeSubmit}
      />
      <PointRuleFormModal
        open={ruleModal.open}
        editing={ruleModal.editing}
        error={ruleModal.error}
        onClose={() => setRuleModal({ open: false, editing: null, error: "" })}
        onSubmit={handleRuleSubmit}
      />
      <GamificationDeleteModal
        open={deleteModal.open}
        title={
          deleteModal.type === "rank"
            ? "Xóa cấp hạng"
            : deleteModal.type === "badge"
              ? "Xóa danh hiệu"
              : "Xóa quy tắc điểm"
        }
        targetLabel={deleteModal.label}
        onClose={() => setDeleteModal({ open: false, type: "", id: null, label: "" })}
        onConfirm={confirmDelete}
      />
    </AdminPageLayout>
  );
}

export default AdminGamificationConfigPage;
