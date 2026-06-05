import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import { ADMIN_USERS, ADMIN_USERS_PAGE_SIZE } from "@/features/admin/adminMockData";
import {
  getRankBadgeClass,
  getUserGamification,
  RANK_LEVELS,
} from "@/features/admin/users/adminUserGamification";
import styles from "@/features/admin/shared/adminPage.module.css";

const ROLE_LABEL = { student: "Sinh viên", moderator: "Moderator", admin: "Admin" };

function AdminUserListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "all",
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fromUrl = searchParams.get("status");
    if (fromUrl === "banned") {
      setStatusFilter("banned");
    } else if (!fromUrl) {
      setStatusFilter((prev) => (prev === "banned" ? "all" : prev));
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_USERS.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (rankFilter !== "all") {
        const rank = getUserGamification(user)?.level;
        if (rank !== rankFilter) return false;
      }
      if (statusFilter !== "all" && user.status !== statusFilter) return false;
      if (!q) return true;
      return (
        user.username.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.displayName.toLowerCase().includes(q)
      );
    });
  }, [query, roleFilter, rankFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_USERS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageUsers = useMemo(() => {
    const start = (safePage - 1) * ADMIN_USERS_PAGE_SIZE;
    return filtered.slice(start, start + ADMIN_USERS_PAGE_SIZE);
  }, [filtered, safePage]);

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * ADMIN_USERS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * ADMIN_USERS_PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, rankFilter, statusFilter]);

  const hasActiveFilters =
    query.trim() !== "" ||
    roleFilter !== "all" ||
    rankFilter !== "all" ||
    statusFilter !== "all";

  function resetFilters() {
    setQuery("");
    setRoleFilter("all");
    setRankFilter("all");
    setStatusFilter("all");
    if (searchParams.get("status")) {
      setSearchParams({}, { replace: true });
    }
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value);
    if (value === "banned") {
      setSearchParams({ status: "banned" }, { replace: true });
    } else if (searchParams.get("status")) {
      setSearchParams({}, { replace: true });
    }
  }

  function handlePageChange(next) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminPageLayout
      title="Quản lý tài khoản"
      subtitle={
        statusFilter === "banned"
          ? "Danh sách tài khoản đã khóa — lọc từ Quản lý tài khoản."
          : "Xem, khóa/mở khóa, reset mật khẩu và gán Premium thủ công."
      }
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Quản lý tài khoản" }]}
      actions={<Button look="outline">Xuất CSV</Button>}
    >
      <section className={styles.panel}>
        <div className={styles.filterShell}>
          <div className={styles.searchRow}>
            <input
              type="search"
              className={styles.search}
              placeholder="Tìm username, email, tên..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm tài khoản"
            />
            <span className={styles.resultChip}>
              {filtered.length} tài khoản{hasActiveFilters ? " · đã lọc" : ""}
            </span>
          </div>

          <div className={styles.filterRow}>
            <select
              className={styles.select}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Lọc vai trò"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="student">Sinh viên</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className={styles.select}
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              aria-label="Lọc hạng"
            >
              <option value="all">Tất cả hạng</option>
              {RANK_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              aria-label="Lọc trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="banned">Đã khóa</option>
            </select>
            <div className={styles.filterActions}>
              <button
                type="button"
                className={styles.btnReset}
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Hạng</th>
                <th>Gói</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((user) => {
                const gamification = getUserGamification(user);
                return (
                <tr key={user.id}>
                  <td>
                    <div className={styles.cellUser}>
                      <span className={styles.avatar} aria-hidden>
                        {user.displayName.charAt(0)}
                      </span>
                      <div>
                        <div className={styles.cellMain}>{user.displayName}</div>
                        <div className={styles.cellSub}>
                          @{user.username} · {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{ROLE_LABEL[user.role] ?? user.role}</td>
                  <td>
                    {gamification ? (
                      <div>
                        <span
                          className={`${styles.badge} ${styles[getRankBadgeClass(gamification.level)]}`}
                        >
                          {gamification.level}
                        </span>
                        <div className={styles.cellSub}>
                          {gamification.points.toLocaleString("vi-VN")} điểm
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{user.plan}</td>
                  <td>
                    <StatusBadge
                      status={user.status}
                      label={user.status === "active" ? "Hoạt động" : "Đã khóa"}
                    />
                  </td>
                  <td>{user.joinedAt}</td>
                  <td>
                    <Link to={`/admin/users/${user.id}`} className={styles.link}>
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>Không có kết quả phù hợp.</p>
        ) : (
          <footer className={styles.tableFooter}>
            <p className={styles.tableFooterMeta}>
              Hiển thị {rangeStart}–{rangeEnd} / {filtered.length} tài khoản
            </p>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              ariaLabel="Phân trang danh sách tài khoản"
            />
          </footer>
        )}
      </section>
    </AdminPageLayout>
  );
}

export default AdminUserListPage;
