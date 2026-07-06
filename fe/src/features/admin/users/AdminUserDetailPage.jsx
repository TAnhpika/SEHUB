import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { StaffModalDetailSkeleton } from "@/common/Skeleton/StaffSkeleton";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import DashboardBadge from "@/features/admin/dashboard/DashboardBadge";
import { ACTIVITY_BADGE_VARIANT } from "@/features/admin/dashboard/dashboardConstants";
import dash from "@/features/admin/dashboard/AdminDashboardPage.module.css";
import AdminUserActionModal from "@/features/admin/users/AdminUserActionModal";
import {
  banUserPermanentlyViaApi,
  requestPasswordResetViaApi,
  unbanUserAccountViaApi,
} from "@/features/admin/users/adminUserStore";
import {
  ADMIN_USER_ACTIVITY_PAGE_SIZE,
  loadAdminUserActivities,
  loadAdminUserDetail,
} from "@/features/admin/users/adminUserDetailData";
import { getRankBadgeClass } from "@/features/admin/users/adminUserGamification";
import detailStyles from "./AdminUserDetailPage.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const ACTIVITY_TYPE_LABEL = {
  exam: "Đề thi",
  report: "Báo cáo",
  payment: "Thanh toán",
  user: "Tài khoản",
};

function AdminUserDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user: authUser } = useAuth();
  const [activityPage, setActivityPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionModal, setActionModal] = useState({ open: false, mode: "ban" });
  const [actionError, setActionError] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAdminUserDetail(id).then((detail) => {
      if (!cancelled) {
        setUser(detail);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    loadAdminUserActivities(id).then((rows) => {
      if (!cancelled) setActivities(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const activityTotalPages = Math.max(
    1,
    Math.ceil(activities.length / ADMIN_USER_ACTIVITY_PAGE_SIZE),
  );
  const safeActivityPage = Math.min(Math.max(1, activityPage), activityTotalPages);

  const pageActivities = useMemo(() => {
    const start = (safeActivityPage - 1) * ADMIN_USER_ACTIVITY_PAGE_SIZE;
    return activities.slice(start, start + ADMIN_USER_ACTIVITY_PAGE_SIZE);
  }, [activities, safeActivityPage]);

  const activityRangeStart =
    activities.length === 0 ? 0 : (safeActivityPage - 1) * ADMIN_USER_ACTIVITY_PAGE_SIZE + 1;
  const activityRangeEnd = Math.min(
    safeActivityPage * ADMIN_USER_ACTIVITY_PAGE_SIZE,
    activities.length,
  );

  useEffect(() => {
    setActivityPage(1);
  }, [id]);

  if (loading) {
    return (
      <AdminPageLayout
        title="Đang tải..."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý tài khoản", to: "/admin/users" },
        ]}
      >
        <StaffModalDetailSkeleton aria-label="Đang tải thông tin tài khoản" />
      </AdminPageLayout>
    );
  }

  if (!user) {
    return (
      <AdminPageLayout
        title="Không tìm thấy"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý tài khoản", to: "/admin/users" },
          { label: "Lỗi" },
        ]}
      >
        <p className={styles.empty}>Không tìm thấy tài khoản.</p>
      </AdminPageLayout>
    );
  }

  const initial = user.displayName.charAt(0).toUpperCase();
  const isPremium = user.plan === "Premium";
  const gamification = user.gamification;
  const canBan = user.role !== "admin" && user.status !== "banned";
  const canUnban = user.status === "banned";

  function openAction(mode) {
    setActionError("");
    setActionModal({ open: true, mode });
  }

  function closeAction() {
    if (actionSubmitting) return;
    setActionModal({ open: false, mode: "ban" });
    setActionError("");
  }

  async function handleActionSubmit(payload) {
    if (actionSubmitting) return;
    setActionSubmitting(true);
    const admin = authUser?.username ?? "admin_sehub";
    let result;

    try {
    switch (actionModal.mode) {
      case "ban":
        result = await banUserPermanentlyViaApi(id, { reason: payload.reason, adminUsername: admin });
        break;
      case "unban":
        result = await unbanUserAccountViaApi(id, { reason: payload.reason, adminUsername: admin });
        break;
      case "resetPassword":
        result = await requestPasswordResetViaApi(id, { adminUsername: admin });
        break;
      default:
        return;
    }

    if (!result.ok) {
      setActionError(result.message);
      return;
    }

    showToast(result.message);
    setActionModal({ open: false, mode: "ban" });
    setActionError("");
    setRefreshKey((k) => k + 1);
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <AdminPageLayout
      title={user.displayName}
      subtitle={`@${user.username} · ${user.email}`}
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý tài khoản", to: "/admin/users" },
        { label: user.displayName },
      ]}
      actions={
        <>
          <Button look="outline" onClick={() => openAction("resetPassword")}>
            Reset mật khẩu
          </Button>
          {canUnban ? (
            <Button onClick={() => openAction("unban")}>Mở khóa vĩnh viễn</Button>
          ) : canBan ? (
            <Button onClick={() => openAction("ban")}>Khóa vĩnh viễn</Button>
          ) : null}
        </>
      }
    >
      <section className={detailStyles.profileHero}>
        <span className={detailStyles.profileAvatar} aria-hidden>
          {initial}
        </span>
        <div className={detailStyles.profileMain}>
          <h2 className={detailStyles.profileName}>{user.displayName}</h2>
          <p className={detailStyles.profileSub}>
            @{user.username} · {user.email}
          </p>
          <div className={detailStyles.profileBadges}>
            <StatusBadge
              status={user.status}
              label={user.status === "active" ? "Hoạt động" : "Đã khóa"}
            />
            <span className={styles.badgePrimary}>{user.roleLabel}</span>
            {user.plan !== "—" ? (
              <span
                className={
                  isPremium
                    ? `${detailStyles.planBadge} ${detailStyles.planBadgePremium}`
                    : detailStyles.planBadge
                }
              >
                {user.plan}
              </span>
            ) : null}
            {user.emailVerified ? (
              <span className={styles.badgeMuted}>Email đã xác minh</span>
            ) : null}
            {gamification ? (
              <span
                className={`${styles.badge} ${styles[getRankBadgeClass(gamification.level)]}`}
              >
                {gamification.level}
              </span>
            ) : null}
          </div>
        </div>
        <dl className={detailStyles.profileAside}>
          <div className={detailStyles.profileMetaItem}>
            <dt>Tham gia</dt>
            <dd>{user.joinedAt}</dd>
          </div>
          <div className={detailStyles.profileMetaItem}>
            <dt>Đăng nhập cuối</dt>
            <dd>{user.lastLogin ?? user.lastActivityDate ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {user.status === "banned" && user.banReason ? (
        <p className={detailStyles.banAlert} role="alert">
          <strong>Tài khoản đã khóa</strong>
          {user.banReason}
          {user.bannedAt ? ` · ${user.bannedAt}` : null}
        </p>
      ) : null}

      <div className={styles.statsGrid}>
        {gamification ? (
          <>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Cấp độ</span>
              <span className={styles.statValue}>{gamification.level}</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Điểm tích lũy</span>
              <span className={styles.statValue}>
                {gamification.points.toLocaleString("vi-VN")}
              </span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Streak học tập</span>
              <span className={styles.statValue}>{gamification.streak} ngày</span>
            </article>
          </>
        ) : null}
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Bài viết</span>
          <span className={styles.statValue}>{user.postsCount}</span>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Đề đã làm</span>
          <span className={styles.statValue}>{user.examsCompleted}</span>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Tài liệu tải</span>
          <span className={styles.statValue}>{user.documentsCount ?? "—"}</span>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Token AI</span>
          <span className={styles.statValue}>
            {user.aiTokens != null ? user.aiTokens.toLocaleString("vi-VN") : "—"}
          </span>
        </article>
      </div>

      <div className={styles.twoCol}>
        <div className={detailStyles.mainCol}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Thông tin cá nhân</h2>
            <div className={styles.divider} />
            <dl className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <dt>Username</dt>
                <dd>@{user.username}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              {user.phone ? (
                <div className={styles.detailItem}>
                  <dt>Số điện thoại</dt>
                  <dd>{user.phone}</dd>
                </div>
              ) : null}
              {user.oauthProvider ? (
                <div className={styles.detailItem}>
                  <dt>Đăng nhập OAuth</dt>
                  <dd>{user.oauthProvider}</dd>
                </div>
              ) : null}
              {user.lastLoginIp ? (
                <div className={styles.detailItem}>
                  <dt>IP / vị trí gần nhất</dt>
                  <dd>{user.lastLoginIp}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Học tập & gói dịch vụ</h2>
            <div className={styles.divider} />
            <dl className={styles.detailGrid}>
              {user.role === "student" ? (
                <>
                  {gamification ? (
                    <>
                      <div className={`${styles.detailItem} ${detailStyles.rankDetailItem}`}>
                        <dt>Hạng gamification</dt>
                        <dd>
                          <span
                            className={`${styles.badge} ${styles[getRankBadgeClass(gamification.level)]}`}
                          >
                            {gamification.level}
                          </span>
                          <span className={detailStyles.rankPoints}>
                            {gamification.points.toLocaleString("vi-VN")} điểm
                          </span>
                          {gamification.nextLevel ? (
                            <div className={detailStyles.rankProgress}>
                              <div className={detailStyles.rankProgressBar}>
                                <span
                                  className={detailStyles.rankProgressFill}
                                  style={{ width: `${gamification.levelProgress}%` }}
                                />
                              </div>
                              <span className={detailStyles.rankProgressLabel}>
                                {gamification.levelProgress}% tiến độ lên {gamification.nextLevel}
                              </span>
                            </div>
                          ) : (
                            <span className={detailStyles.rankProgressLabel}>
                              Đã đạt cấp cao nhất
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className={styles.detailItem}>
                        <dt>Streak học tập</dt>
                        <dd>{gamification.streak} ngày liên tiếp</dd>
                      </div>
                    </>
                  ) : null}
                  <div className={styles.detailItem}>
                    <dt>Chuyên ngành</dt>
                    <dd>{user.major}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Cơ sở</dt>
                    <dd>{user.campus}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Học kỳ</dt>
                    <dd>{user.semester}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Gói hiện tại</dt>
                    <dd>{user.plan}</dd>
                  </div>
                  {isPremium ? (
                    <>
                      <div className={styles.detailItem}>
                        <dt>Premium từ</dt>
                        <dd>{user.premiumSince}</dd>
                      </div>
                      <div className={styles.detailItem}>
                        <dt>Hết hạn Premium</dt>
                        <dd>{user.premiumExpiresAt}</dd>
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <div className={styles.detailItem}>
                    <dt>Vai trò hệ thống</dt>
                    <dd>{user.roleLabel}</dd>
                  </div>
                  {user.modSubjects ? (
                    <div className={styles.detailItem}>
                      <dt>Môn phụ trách</dt>
                      <dd>{user.modSubjects}</dd>
                    </div>
                  ) : null}
                </>
              )}
              <div className={styles.detailItem}>
                <dt>Báo cáo đã gửi</dt>
                <dd>{user.reportsFiled}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Bị báo cáo</dt>
                <dd>{user.reportsAgainst}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Hoạt động gần đây</h2>
            <div className={styles.divider} />
            <ul className={dash.activityList}>
              {pageActivities.map((item) => (
                <li key={item.id} className={dash.activityItem}>
                  <span className={dash.activityTime}>{item.time}</span>
                  <span className={dash.activityText}>{item.text}</span>
                  <DashboardBadge variant={ACTIVITY_BADGE_VARIANT[item.type] ?? "neutral"}>
                    {ACTIVITY_TYPE_LABEL[item.type] ?? item.type}
                  </DashboardBadge>
                </li>
              ))}
            </ul>
            {activities.length > 0 ? (
              <footer className={styles.tableFooter}>
                <p className={styles.tableFooterMeta}>
                  Hiển thị {activityRangeStart}–{activityRangeEnd} / {activities.length} hoạt động
                </p>
                <Pagination
                  currentPage={safeActivityPage}
                  totalPages={activityTotalPages}
                  onPageChange={setActivityPage}
                  ariaLabel="Phân trang hoạt động người dùng"
                />
              </footer>
            ) : null}
            <p className={styles.hint} style={{ marginTop: "0.75rem" }}>
              <Link to="/admin/activity" className={styles.link}>
                Xem toàn bộ nhật ký hệ thống
              </Link>
            </p>
          </section>
        </div>

        <aside className={styles.panel}>
          <h2 className={styles.panelTitle}>Thao tác tài khoản</h2>
          <div className={styles.divider} />
          <div className={styles.actionStack}>
            <Button look="outline" fullWidth onClick={() => openAction("resetPassword")}>
              Gửi email reset mật khẩu
            </Button>
            {canUnban ? (
              <Button fullWidth onClick={() => openAction("unban")}>
                Mở khóa vĩnh viễn
              </Button>
            ) : canBan ? (
              <Button fullWidth onClick={() => openAction("ban")}>
                Khóa vĩnh viễn
              </Button>
            ) : null}
          </div>
          <p className={styles.hint} style={{ marginTop: "1rem" }}>
            Khóa tạm (1/7/30 ngày) do <Link to="/admin/moderation/banned">Moderator</Link> xử
            lý. Kích hoạt Premium & cộng token →{" "}
            <Link to="/admin/payments">Thanh toán PayOS</Link>. Gán Mod →{" "}
            <Link to="/admin/permissions">Phân quyền Mod</Link>.
          </p>
        </aside>
      </div>

      <AdminUserActionModal
        open={actionModal.open}
        mode={actionModal.mode}
        user={user}
        onClose={closeAction}
        onSubmit={handleActionSubmit}
        error={actionError}
        submitting={actionSubmitting}
      />
    </AdminPageLayout>
  );
}

export default AdminUserDetailPage;
