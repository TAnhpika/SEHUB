import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faCheck,
  faClock,
  faInbox,
  faLock,
  faMousePointer,
  faUnlock,
  faUserSlash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import {
  BAN_TYPE_LABELS,
  getAdminBannedUsers,
  unbanUser,
} from "@/features/admin/moderation/adminBannedData";
import { unbanFromBannedList } from "@/features/admin/users/adminUserStore";
import modStyles from "@/features/admin/moderation/AdminModerationPage.module.css";

const TAB_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "temporary", label: "Tạm thời" },
  { id: "permanent", label: "Vĩnh viễn" },
];

function AdminBannedPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [banned, setBanned] = useState(getAdminBannedUsers);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [lastUnbanned, setLastUnbanned] = useState(null);

  const tempCount = banned.filter((b) => b.type === "temporary").length;
  const permCount = banned.filter((b) => b.type === "permanent").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return banned.filter((b) => {
      if (tab === "temporary" && b.type !== "temporary") return false;
      if (tab === "permanent" && b.type !== "permanent") return false;
      if (!q) return true;
      return (
        b.username.toLowerCase().includes(q) ||
        b.displayName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.reason.toLowerCase().includes(q) ||
        b.bannedBy.toLowerCase().includes(q)
      );
    });
  }, [banned, tab, query]);

  useEffect(() => {
    const fromUrl = searchParams.get("id");
    if (fromUrl && banned.some((b) => b.id === fromUrl)) {
      setSelectedId(fromUrl);
    }
  }, [searchParams, banned]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((b) => b.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = banned.find((b) => b.id === selectedId) ?? null;

  function refresh() {
    setBanned(getAdminBannedUsers());
  }

  function selectUser(id) {
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

  function handleUnban() {
    if (!selected) return;
    const removed = unbanUser(selected.id);
    if (!removed) return;
    unbanFromBannedList(removed.username);
    refresh();
    setLastUnbanned(removed);
    showToast(`Đã mở khóa @${removed.username}.`);
    const next = getAdminBannedUsers();
    setSelectedId(next[0]?.id ?? null);
  }

  return (
    <AdminPageLayout
      title="Tài khoản bị khóa"
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Báo cáo", to: "/admin/moderation" },
        { label: "Bị khóa" },
      ]}
      actions={
        <Button look="outline" to="/admin/moderation">
          Hàng chờ báo cáo
        </Button>
      }
    >
      <div className={modStyles.page}>
        <div className={modStyles.metrics}>
          <div className={modStyles.metric}>
            <span className={`${modStyles.metricIcon} ${modStyles.metricIconPending}`}>
              <FontAwesomeIcon icon={faUserSlash} />
            </span>
            <div>
              <p className={modStyles.metricValue}>{banned.length}</p>
              <p className={modStyles.metricLabel}>Đang khóa</p>
            </div>
          </div>
          <div className={modStyles.metric}>
            <span className={`${modStyles.metricIcon} ${modStyles.metricIconUrgent}`}>
              <FontAwesomeIcon icon={faClock} />
            </span>
            <div>
              <p className={modStyles.metricValue}>{tempCount}</p>
              <p className={modStyles.metricLabel}>Khóa tạm</p>
            </div>
          </div>
          <div className={modStyles.metric}>
            <span className={`${modStyles.metricIcon} ${modStyles.metricIconResolved}`}>
              <FontAwesomeIcon icon={faLock} />
            </span>
            <div>
              <p className={modStyles.metricValue}>{permCount}</p>
              <p className={modStyles.metricLabel}>Vĩnh viễn</p>
            </div>
          </div>
        </div>

        <div className={modStyles.stepper}>
          <div className={modStyles.step}>
            <span className={modStyles.stepNum}>1</span>
            <span className={modStyles.stepText}>
              <strong>Chọn tài khoản</strong>
              Xem lý do & thời hạn
            </span>
          </div>
          <span className={modStyles.stepDivider} aria-hidden />
          <div className={modStyles.step}>
            <span className={modStyles.stepNum}>2</span>
            <span className={modStyles.stepText}>
              <strong>Kiểm tra</strong>
              Báo cáo liên quan (nếu có)
            </span>
          </div>
          <span className={modStyles.stepDivider} aria-hidden />
          <div className={modStyles.step}>
            <span className={`${modStyles.stepNum} ${modStyles.stepNumMuted}`}>3</span>
            <span className={modStyles.stepText}>
              <strong>Mở khóa</strong>
              Khi hết hạn / đủ căn cứ
            </span>
          </div>
        </div>

        {lastUnbanned ? (
          <div className={`${modStyles.banner} ${modStyles.bannerSuccess}`} role="status">
            <FontAwesomeIcon icon={faCheck} className={modStyles.bannerIcon} />
            <div className={modStyles.bannerBody}>
              <p className={modStyles.bannerTitle}>Đã mở khóa @{lastUnbanned.username}</p>
              <p className={modStyles.bannerMeta}>
                {lastUnbanned.displayName} · {lastUnbanned.bannedAt}
              </p>
            </div>
            <button
              type="button"
              className={modStyles.bannerClose}
              aria-label="Đóng"
              onClick={() => setLastUnbanned(null)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ) : null}

        <div className={modStyles.workspace}>
          <div className={modStyles.queueCol}>
            <div className={modStyles.queueToolbar}>
              <div className={modStyles.queueToolbarHead}>
                <h2 className={modStyles.queueHeading}>Danh sách</h2>
                <span className={modStyles.queueCount}>{filtered.length}</span>
              </div>
              <input
                type="search"
                className={modStyles.searchInput}
                placeholder="Tìm @user, email, lý do..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Tìm tài khoản bị khóa"
              />
              <div className={modStyles.filterTrack} role="group" aria-label="Lọc loại khóa">
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
                  </button>
                ))}
              </div>
            </div>

            <div className={modStyles.queueScroll}>
              {filtered.length === 0 ? (
                <div className={modStyles.emptyQueue}>
                  <FontAwesomeIcon icon={faInbox} className={modStyles.emptyIcon} />
                  <p className={modStyles.emptyTitle}>Không có tài khoản</p>
                  <p className={modStyles.emptyDesc}>Không khớp bộ lọc hoặc danh sách trống.</p>
                </div>
              ) : (
                <ul className={modStyles.queueList}>
                  {filtered.map((row) => {
                    const isActive = selectedId === row.id;
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          className={`${modStyles.queueCard} ${
                            isActive ? modStyles.queueCardActive : ""
                          } ${row.type === "permanent" ? modStyles.queueCardUrgent : ""}`}
                          onClick={() => selectUser(row.id)}
                        >
                          <div className={modStyles.queueCardInner}>
                            <div className={modStyles.queueCardBody}>
                              <p className={modStyles.queueTitle}>@{row.username}</p>
                              <p className={modStyles.queueReason}>{row.reason}</p>
                              <div className={modStyles.tagRow}>
                                <span
                                  className={`${modStyles.tag} ${
                                    row.type === "permanent"
                                      ? modStyles.tagUrgent
                                      : modStyles.tagPending
                                  }`}
                                >
                                  {BAN_TYPE_LABELS[row.type]}
                                </span>
                                {row.until ? (
                                  <span className={`${modStyles.tag} ${modStyles.tagResolved}`}>
                                    đến {row.until}
                                  </span>
                                ) : null}
                              </div>
                              <p className={modStyles.queueFooter}>
                                {row.bannedBy} · {row.bannedAt}
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
          </div>

          <div className={modStyles.detailCol}>
            {!selected ? (
              <div className={modStyles.detailEmpty}>
                <FontAwesomeIcon icon={faMousePointer} className={modStyles.emptyIcon} />
                <p className={modStyles.emptyTitle}>Chọn tài khoản</p>
                <p className={modStyles.emptyDesc}>Chi tiết khóa và thao tác hiển thị bên phải.</p>
              </div>
            ) : (
              <>
                <header className={modStyles.detailHead}>
                  <h3 className={modStyles.detailTitle}>@{selected.username}</h3>
                  <p className={modStyles.detailSub}>
                    {selected.displayName} ·{" "}
                    <StatusBadge
                      status={selected.type === "permanent" ? "banned" : "pending"}
                      label={BAN_TYPE_LABELS[selected.type]}
                    />
                  </p>
                </header>

                <div className={modStyles.detailScroll}>
                  <div className={modStyles.previewBox}>
                    <p className={modStyles.previewMeta}>Lý do khóa</p>
                    <p style={{ margin: 0 }}>{selected.reason}</p>
                  </div>

                  <dl className={modStyles.metaGrid}>
                    <div className={modStyles.metaItem}>
                      <dt>Email</dt>
                      <dd>{selected.email}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Người xử lý</dt>
                      <dd>{selected.bannedBy}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Ngày khóa</dt>
                      <dd>{selected.bannedAt}</dd>
                    </div>
                    <div className={modStyles.metaItem}>
                      <dt>Hết hạn</dt>
                      <dd>
                        {selected.until ? (
                          <>
                            <FontAwesomeIcon icon={faCalendar} /> {selected.until}
                            {selected.days ? ` (${selected.days} ngày)` : ""}
                          </>
                        ) : (
                          "Không có — vĩnh viễn"
                        )}
                      </dd>
                    </div>
                  </dl>

                  {selected.relatedReportId ? (
                    <div className={modStyles.resolutionBox}>
                      <p className={modStyles.resolutionTitle}>Liên kết báo cáo</p>
                      <p className={modStyles.resolutionText}>
                        Bài #{selected.relatedPostId} ·{" "}
                        <Link
                          to={`/admin/moderation?id=${selected.relatedReportId}`}
                          className={modStyles.linkUser}
                        >
                          Xem báo cáo {selected.relatedReportId}
                        </Link>
                      </p>
                    </div>
                  ) : null}
                </div>

                <footer className={modStyles.detailActions}>
                  <Button onClick={handleUnban}>
                    <FontAwesomeIcon icon={faUnlock} />
                    Mở khóa tài khoản
                  </Button>
                  {selected.type === "temporary" ? (
                    <Button
                      look="outline"
                      onClick={() => showToast("Đã gia hạn khóa 7 ngày.")}
                    >
                      Gia hạn 7 ngày
                    </Button>
                  ) : null}
                  <Button look="outline" to="/admin/users">
                    Xem danh sách user
                  </Button>
                </footer>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}

export default AdminBannedPage;
