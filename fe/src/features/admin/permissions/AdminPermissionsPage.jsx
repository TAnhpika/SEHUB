import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faUserPlus,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import {
  grantModeratorViaApi,
  loadPermissionsData,
  MOD_PERMISSIONS,
  revokeModeratorViaApi,
} from "@/features/admin/permissions/adminPermissionsData";
import PermissionConfirmModal from "@/features/admin/permissions/PermissionConfirmModal";
import {
  StaffAuditListSkeleton,
  StaffStatsStripSkeleton,
} from "@/common/Skeleton/StaffSkeleton";
import permStyles from "@/features/admin/permissions/AdminPermissions.module.css";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import styles from "@/features/admin/shared/adminPage.module.css";

function formatAuditTime(iso) {
  return iso.slice(0, 16).replace("T", " ");
}

function AdminPermissionsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [permissionsState, setPermissionsState] = useState({
    moderators: [],
    candidates: [],
    stats: { activeMods: 0, candidates: 0, permissionCount: MOD_PERMISSIONS.length },
    audit: [],
  });
  const [loading, setLoading] = useState(true);
  const [modSearch, setModSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [confirm, setConfirm] = useState({
    open: false,
    mode: "grant",
    username: null,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPermissionsData()
      .then((data) => {
        if (!cancelled) setPermissionsState(data);
      })
      .catch((err) => {
        if (!cancelled) showToast(err.message ?? "Không tải được dữ liệu phân quyền.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const stats = permissionsState.stats;
  const moderators = permissionsState.moderators;
  const candidates = permissionsState.candidates;
  const auditLog = permissionsState.audit;
  const auditPage = useAdminPagination(
    auditLog,
    ADMIN_PAGE_SIZES.permissionsAudit,
    [permissionsState],
  );

  const filteredMods = useMemo(() => {
    const q = modSearch.trim().toLowerCase();
    if (!q) return moderators;
    return moderators.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
    );
  }, [moderators, modSearch]);

  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [candidates, candidateSearch]);

  function openConfirm(mode, target) {
    setConfirm({
      open: true,
      mode,
      username: target.username,
      user: {
        displayName: target.displayName,
        username: target.username,
        initial: target.initial,
      },
    });
  }

  function refreshPermissions() {
    loadPermissionsData()
      .then(setPermissionsState)
      .catch((err) => showToast(err.message ?? "Không tải được dữ liệu phân quyền."));
  }

  function handleConfirm() {
    const admin = user?.username ?? "admin_sehub";
    const action =
      confirm.mode === "grant"
        ? () => grantModeratorViaApi(confirm.username, admin)
        : () => revokeModeratorViaApi(confirm.username, admin);

    action()
      .then((result) => {
        if (!result.ok) {
          showToast(result.message);
          return;
        }
        showToast(result.message);
        setConfirm({ open: false, mode: "grant", username: null, user: null });
        refreshPermissions();
      })
      .catch((err) => {
        showToast(err.message ?? "Không cập nhật được quyền Moderator.");
      });
  }

  if (loading) {
    return (
      <AdminPageLayout
        title="Phân quyền Mod"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Phân quyền Mod" }]}
      >
        <StaffStatsStripSkeleton count={3} aria-label="Đang tải thống kê phân quyền" />
        <div className={permStyles.layout}>
          <StaffAuditListSkeleton aria-label="Đang tải danh sách moderator" />
          <StaffAuditListSkeleton aria-label="Đang tải danh sách ứng viên" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Phân quyền Mod"
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Phân quyền Mod" }]}
    >
      <div className={permStyles.statsStrip}>
        <div className={permStyles.statCard}>
          <span className={permStyles.statIcon} aria-hidden>
            <FontAwesomeIcon icon={faUserShield} />
          </span>
          <p className={permStyles.statLabel}>Mod đang hoạt động</p>
          <p className={permStyles.statValue}>{stats.activeMods}</p>
          <p className={permStyles.statHint}>có quyền /moderator</p>
        </div>
        <div className={permStyles.statCard}>
          <span className={permStyles.statIcon} aria-hidden>
            <FontAwesomeIcon icon={faUserPlus} />
          </span>
          <p className={permStyles.statLabel}>Ứng viên</p>
          <p className={permStyles.statValue}>{stats.candidates}</p>
          <p className={permStyles.statHint}>sẵn sàng gán Mod</p>
        </div>
        <div className={permStyles.statCard}>
          <span className={permStyles.statIcon} aria-hidden>
            <FontAwesomeIcon icon={faShieldHalved} />
          </span>
          <p className={permStyles.statLabel}>Phạm vi quyền</p>
          <p className={permStyles.statValue}>{stats.permissionCount}</p>
          <p className={permStyles.statHint}>module kiểm duyệt</p>
        </div>
      </div>

      <div className={permStyles.scopeBanner}>
        <p className={permStyles.scopeTitle}>Moderator được phép</p>
        {MOD_PERMISSIONS.map((perm) => (
          <span key={perm.id} className={permStyles.scopeChip}>
            <strong>{perm.label}</strong>
            <span>{perm.desc}</span>
          </span>
        ))}
      </div>

      <div className={permStyles.layout}>
        <section className={permStyles.panelCard}>
          <header className={`${permStyles.panelHead} ${permStyles.panelHeadMod}`}>
            <div className={permStyles.panelHeadMain}>
              <span className={permStyles.panelHeadIcon} aria-hidden>
                <FontAwesomeIcon icon={faUserShield} />
              </span>
              <div>
                <h2 className={permStyles.panelTitle}>
                  Moderator hiện tại ({moderators.length})
                </h2>
                <p className={permStyles.panelDesc}>
                  Thu hồi quyền khi cần — user quay về vai trò Sinh viên
                </p>
              </div>
            </div>
          </header>
          <div className={permStyles.searchWrap}>
            <input
              className={permStyles.search}
              type="search"
              placeholder="Tìm Mod..."
              value={modSearch}
              onChange={(e) => setModSearch(e.target.value)}
            />
          </div>
          <div className={permStyles.userList}>
            {filteredMods.length === 0 ? (
              <p className={permStyles.emptyState}>Chưa có Moderator hoặc không khớp tìm kiếm.</p>
            ) : (
              filteredMods.map((mod) => (
                <article key={mod.username} className={`${permStyles.userCard} ${permStyles.userCardMod}`}>
                  <span className={permStyles.avatar}>{mod.initial}</span>
                  <div className={permStyles.userMain}>
                    <h3 className={permStyles.userName}>{mod.displayName}</h3>
                    <p className={permStyles.userMeta}>
                      <code>@{mod.username}</code> · {mod.email}
                    </p>
                    {mod.grantedAt ? (
                      <div className={permStyles.modStats}>
                        <span className={permStyles.modStat}>Gán {mod.grantedAt}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className={permStyles.cardActions}>
                    <button
                      type="button"
                      className={permStyles.revokeBtn}
                      onClick={() => openConfirm("revoke", mod)}
                    >
                      Thu hồi
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className={permStyles.panelCard}>
          <header className={`${permStyles.panelHead} ${permStyles.panelHeadGrant}`}>
            <div className={permStyles.panelHeadMain}>
              <span className={`${permStyles.panelHeadIcon} ${permStyles.panelHeadIconGrant}`} aria-hidden>
                <FontAwesomeIcon icon={faUserPlus} />
              </span>
              <div>
                <h2 className={permStyles.panelTitle}>
                  Gán quyền ({candidates.length})
                </h2>
                <p className={permStyles.panelDesc}>
                  Sinh viên tin cậy — xem hạng & điểm tin cậy trước khi gán
                </p>
              </div>
            </div>
          </header>
          <div className={permStyles.searchWrap}>
            <input
              className={permStyles.search}
              type="search"
              placeholder="Tìm ứng viên..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
            />
          </div>
          <div className={permStyles.userList}>
            {filteredCandidates.length === 0 ? (
              <p className={permStyles.emptyState}>
                Không còn ứng viên hoặc tất cả đã là Mod.
              </p>
            ) : (
              filteredCandidates.map((candidate) => (
                <article
                  key={candidate.username}
                  className={`${permStyles.userCard} ${permStyles.userCardCandidate}`}
                >
                  <span className={`${permStyles.avatar} ${permStyles.avatarCandidate}`}>
                    {candidate.initial}
                  </span>
                  <div className={permStyles.userMain}>
                    <h3 className={permStyles.userName}>{candidate.displayName}</h3>
                    <p className={permStyles.userMeta}>
                      <code>@{candidate.username}</code> · {candidate.rank} ·{" "}
                      {candidate.points} điểm
                    </p>
                    {candidate.note ? (
                      <p className={permStyles.userNote}>{candidate.note}</p>
                    ) : null}
                    <div className={permStyles.trustBar}>
                      <div className={permStyles.trustTrack}>
                        <div
                          className={permStyles.trustFill}
                          style={{ width: `${candidate.trustScore}%` }}
                        />
                      </div>
                      <span className={permStyles.trustLabel}>
                        Tin cậy {candidate.trustScore}%
                      </span>
                    </div>
                  </div>
                  <div className={permStyles.cardActions}>
                    <button
                      type="button"
                      className={permStyles.grantBtn}
                      onClick={() => openConfirm("grant", candidate)}
                    >
                      Gán Mod
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className={`${styles.panel} ${permStyles.auditPanel}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Nhật ký phân quyền</h2>
            <p className={styles.panelDesc}>Audit bất biến — gán / thu hồi Mod</p>
          </div>
        </div>
        <ul className={permStyles.auditList}>
          {auditPage.pageItems.length === 0 ? (
            <li className={permStyles.emptyState}>Chưa có nhật ký gán / thu hồi Mod.</li>
          ) : (
            auditPage.pageItems.map((row) => (
              <li
                key={row.id}
                className={[
                  permStyles.auditItem,
                  row.action === "grant" ? permStyles.auditGrant : permStyles.auditRevoke,
                ].join(" ")}
              >
                <span className={permStyles.auditDetail}>{row.detail}</span>
                <span className={permStyles.auditMeta}>
                  {row.admin} · {formatAuditTime(row.at)}
                </span>
              </li>
            ))
          )}
        </ul>
        <AdminTableFooter
          rangeStart={auditPage.rangeStart}
          rangeEnd={auditPage.rangeEnd}
          total={auditPage.total}
          unit="bản ghi"
          currentPage={auditPage.safePage}
          totalPages={auditPage.totalPages}
          onPageChange={auditPage.handlePageChange}
          ariaLabel="Phân trang nhật ký phân quyền"
        />
      </section>

      <PermissionConfirmModal
        open={confirm.open}
        mode={confirm.mode}
        user={confirm.user}
        onClose={() =>
          setConfirm({ open: false, mode: "grant", username: null, user: null })
        }
        onConfirm={handleConfirm}
      />
    </AdminPageLayout>
  );
}

export default AdminPermissionsPage;
