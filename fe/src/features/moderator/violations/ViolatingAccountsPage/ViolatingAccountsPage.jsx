import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faEye,
  faLock,
  faPlus,
  faTriangleExclamation,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { ApiError } from "@/api/httpClient";
import * as adminApi from "@/api/adminApi";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import Pagination from "@/common/Pagination/Pagination";
import { useToast } from "@/common/Toast/ToastProvider";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import ConfirmDialog from "@/common/ConfirmDialog/ConfirmDialog";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import ModeratorToolbar from "@/features/moderator/components/ModeratorToolbar/ModeratorToolbar";
import ViolatingAccountDetailPanel from "@/features/moderator/violations/components/ViolatingAccountDetailPanel/ViolatingAccountDetailPanel";
import { ModeratorAccountsTableSkeleton } from "@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton";
import EscalatedReportDetailModal from "@/features/moderator/violations/components/EscalatedReportDetailModal/EscalatedReportDetailModal";
import {
  DEFAULT_BAN_REASON,
  getAccountLockInfo,
  getLockSeverityMeta,
  getLockSeverityTone,
  loadViolatingAccountDetail,
  loadViolatingAccounts,
  LOCK_DURATION_OPTIONS,
  RANK_META,
  RANK_OPTIONS,
  SORT_OPTIONS,
  STATUS_META,
  STATUS_OPTIONS,
  submitViolatingAccountBan,
  submitViolatingAccountUnban,
  submitViolatingAccountWarning,
  VIOLATIONS_PAGE_SIZE,
} from "@/features/moderator/violations/violationsData";
import styles from "./ViolatingAccountsPage.module.css";

/**
 * @fileoverview Trang quản lý tài khoản vi phạm dành cho Moderator trong SEHUB.
 *
 * Module này cung cấp giao diện đầy đủ để:
 * - Duyệt, tìm kiếm, lọc và phân trang danh sách tài khoản có lịch sử vi phạm.
 * - Gửi cảnh báo (warn) hoặc khóa tạm (ban) theo thời hạn 1 / 7 / 30 ngày.
 * - Xem chi tiết tài khoản, gỡ khóa tạm, và xuất báo cáo CSV.
 * - Xử lý deep-link từ báo cáo (query string URL) sang chi tiết tài khoản đã có kỷ luật.
 *
 * @module features/moderator/violations/ViolatingAccountsPage
 * @see {@link module:features/moderator/violations/violationsData} — tầng dữ liệu và API nghiệp vụ
 */

/**
 * Cấu hình breadcrumb hiển thị trên `ModeratorPageShell` khi Moderator truy cập trang này.
 *
 * Mỗi phần tử mô tả một mục điều hướng theo thứ tự từ trái sang phải.
 *
 * @constant {ReadonlyArray<{ label: string, to?: string }>}
 * @readonly
 *
 * @example
 * // Render trong shell:
 * // Trang chủ > Quản lý > Tài khoản vi phạm
 * <ModeratorPageShell crumbs={VIOLATIONS_CRUMBS} />
 */
const VIOLATIONS_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Quản lý" },
  { label: "Tài khoản vi phạm" },
];

/**
 * Thời gian chờ (milliseconds) trước khi cập nhật `debouncedQuery` sau khi người dùng gõ tìm kiếm.
 *
 * Giảm số lần gọi API `loadViolatingAccounts` khi Moderator nhập liên tục vào ô tìm kiếm.
 *
 * @constant {number}
 * @readonly
 * @default 350
 */
const SEARCH_DEBOUNCE_MS = 350;

/**
 * @typedef {Object} ViolatingAccount
 * @property {string} id - Định danh duy nhất của tài khoản (UUID hoặc ID hệ thống).
 * @property {string} username - Tên đăng nhập, hiển thị kèm tiền tố `@`.
 * @property {string} displayName - Tên hiển thị trên giao diện.
 * @property {string} initial - Ký tự viết tắt dùng cho avatar placeholder.
 * @property {string} email - Địa chỉ email liên hệ.
 * @property {string} studentId - Mã sinh viên hoặc thông tin liên hệ phụ.
 * @property {string} rank - Khóa hạng thành viên (ví dụ: `bronze`, `silver`, `gold`).
 * @property {number} violations - Tổng số lần vi phạm đã ghi nhận.
 * @property {string} status - Trạng thái tài khoản (`normal`, `warned`, `banned`, ...).
 */

/**
 * @typedef {Object} StatusBadgeProps
 * @property {ViolatingAccount} account - Đối tượng tài khoản vi phạm cần hiển thị badge trạng thái.
 */

/**
 * Hiển thị badge trạng thái tài khoản vi phạm dựa trên thông tin khóa và trạng thái hệ thống.
 *
 * Thứ tự ưu tiên render:
 * 1. Nếu đang bị khóa tạm (`lockInfo.isActive`) — badge theo mức độ nghiêm trọng khóa.
 * 2. Nếu khóa đã hết hạn (`lockInfo.expired`) — badge cảnh báo màu `warning`.
 * 3. Ngược lại — badge theo `STATUS_META[account.status]`, mặc định `normal`.
 *
 * @param {StatusBadgeProps} props - Props của component.
 * @returns {import('react').ReactElement} Badge trạng thái kèm chi tiết (nếu có khóa).
 *
 * @example
 * <StatusBadge account={{ status: 'normal', lockUntil: null }} />
 * // => ModeratorBadge "Bình thường"
 *
 * @example
 * <StatusBadge account={{ status: 'banned', lockUntil: '2026-07-10' }} />
 * // => Badge khóa tạm + dòng mô tả thời hạn
 */
function StatusBadge({ account }) {
  const lockInfo = getAccountLockInfo(account);

  if (lockInfo.isActive) {
    return (
      <div className={styles.statusWrap}>
        <ModeratorBadge
          label={lockInfo.statusLabel}
          tone={getLockSeverityTone(lockInfo.severity)}
          dot
        />
        <p className={styles.statusDetail}>{lockInfo.detailLabel}</p>
      </div>
    );
  }

  if (lockInfo.expired) {
    return (
      <div className={styles.statusWrap}>
        <ModeratorBadge label={lockInfo.statusLabel} tone="warning" dot />
        <p className={styles.statusDetail}>{lockInfo.detailLabel}</p>
      </div>
    );
  }

  const meta = STATUS_META[account.status] ?? STATUS_META.normal;
  return <ModeratorBadge label={meta.label} tone={meta.tone} dot />;
}

/**
 * @typedef {Object} RankBadgeProps
 * @property {string} rank - Khóa hạng thành viên; tra cứu trong `RANK_META`, mặc định `bronze` nếu không khớp.
 */

/**
 * Hiển thị huy hiệu hạng thành viên kèm icon cúp và màu theo `RANK_META`.
 *
 * @param {RankBadgeProps} props - Props của component.
 * @returns {import('react').ReactElement} Thẻ `<span>` chứa icon trophy và nhãn hạng.
 *
 * @example
 * <RankBadge rank="gold" />
 * // => <span class="rank rank-gold">🏆 Vàng</span>
 */
function RankBadge({ rank }) {
  const meta = RANK_META[rank] ?? RANK_META.bronze;
  return (
    <span className={`${styles.rank} ${styles[`rank-${meta.tone}`]}`}>
      <FontAwesomeIcon icon={faTrophy} className={styles["rank-icon"]} />
      {meta.label}
    </span>
  );
}

/**
 * Trang chính quản lý tài khoản vi phạm — container stateful cho toàn bộ luồng Moderator.
 *
 * **Luồng dữ liệu:**
 * - `query` → debounce → `debouncedQuery` → `loadViolatingAccounts` → `accounts`.
 * - `detailId` thay đổi → `loadViolatingAccountDetail` → panel chi tiết bên phải.
 * - Query URL (`userId`, `username`, `reason`, `code`, `reporter`) → mở modal báo cáo leo thang.
 *
 * **Hành động Moderator:**
 * - Cảnh báo: `openWarnModal` → `confirmWarn` → `submitViolatingAccountWarning`.
 * - Khóa tạm: `openLockModal` → `confirmLock` → `submitViolatingAccountBan`.
 * - Gỡ khóa: `handleUnban` → `submitViolatingAccountUnban` (từ panel chi tiết).
 *
 * @returns {import('react').ReactElement} Layout trang moderator với bảng, dialog xác nhận và panel chi tiết.
 *
 * @example
 * // Đăng ký route (ví dụ):
 * <Route path="/moderator/violations" element={<ViolatingAccountsPage />} />
 *
 * @example
 * // Deep-link từ báo cáo leo thang:
 * // /moderator/violations?userId=abc&username=@user&reason=Spam&code=R-001
 */
function ViolatingAccountsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  /** @type {string|null} ID tài khoản từ query `userId` — deep-link báo cáo leo thang. */
  const focusUserId = searchParams.get("userId");
  /** @type {string|null} Username từ query `username` — hiển thị trong modal báo cáo. */
  const focusUsername = searchParams.get("username");
  /** @type {string} Lý do vi phạm từ query `reason`; điền sẵn vào ô khóa nếu có. */
  const focusReason = searchParams.get("reason") ?? "";
  /** @type {string} Mã báo cáo từ query `code`. */
  const focusReportCode = searchParams.get("code") ?? "";
  /** @type {string} Username người báo cáo từ query `reporter`. */
  const focusReporter = searchParams.get("reporter") ?? "";

  /** @type {import('react').MutableRefObject<boolean>} Cờ một lần — tránh mở lại modal focus khi re-render. */
  const focusHandledRef = useRef(false);

  /** @type {[ViolatingAccount[], import('react').Dispatch<import('react').SetStateAction<ViolatingAccount[]>>]} Danh sách tài khoản trang hiện tại. */
  const [accounts, setAccounts] = useState([]);
  /** @type {[string, import('react').Dispatch<import('react').SetStateAction<string>>]} Giá trị ô tìm kiếm (chưa debounce). */
  const [query, setQuery] = useState(() => focusUsername?.replace(/^@/, "") ?? "");
  /** @type {[string, import('react').Dispatch<import('react').SetStateAction<string>>]} Từ khóa tìm kiếm sau debounce — gửi lên API. */
  const [debouncedQuery, setDebouncedQuery] = useState("");
  /** @type {[string, import('react').Dispatch<import('react').SetStateAction<string>>]} Bộ lọc trạng thái (`all`, `normal`, ...). */
  const [statusFilter, setStatusFilter] = useState("all");
  /** @type {[string, import('react').Dispatch<import('react').SetStateAction<string>>]} Bộ lọc hạng thành viên. */
  const [rankFilter, setRankFilter] = useState("all");
  /** @type {[string, import('react').Dispatch<import('react').SetStateAction<string>>]} Khóa sắp xếp (ví dụ `violations-desc`). */
  const [sort, setSort] = useState("violations-desc");
  /** @type {[number, import('react').Dispatch<import('react').SetStateAction<number>>]} Trang phân trang hiện tại (1-based). */
  const [page, setPage] = useState(1);
  /** @type {[number, import('react').Dispatch<import('react').SetStateAction<number>>]} Tổng số tài khoản khớp bộ lọc. */
  const [totalCount, setTotalCount] = useState(0);
  /** @type {[number, import('react').Dispatch<import('react').SetStateAction<number>>]} Tổng số trang tính từ API. */
  const [totalPages, setTotalPages] = useState(1);
  /** @type {[boolean, import('react').Dispatch<import('react').SetStateAction<boolean>>]} `true` khi đang tải danh sách. */
  const [loading, setLoading] = useState(true);
  /** @type {[boolean, import('react').Dispatch<import('react').SetStateAction<boolean>>]} `true` khi đang xử lý ban/warn. */
  const [actionLoading, setActionLoading] = useState(false);
  /** @type {[ViolatingAccount|null, import('react').Dispatch<import('react').SetStateAction<ViolatingAccount|null>>]} Tài khoản đích trong dialog khóa tạm. */
  const [lockTarget, setLockTarget] = useState(null);
  /** @type {[number, import('react').Dispatch<import('react').SetStateAction<number>>]} Số ngày khóa đã chọn (1, 7 hoặc 30). */
  const [lockDays, setLockDays] = useState(7);
  /** @type {[string, import('react').Dispatch<import('react').SetStateAction<string>>]} Lý do khóa nhập trong dialog. */
  const [lockReason, setLockReason] = useState(DEFAULT_BAN_REASON);
  /** @type {[ViolatingAccount|null, import('react').Dispatch<import('react').SetStateAction<ViolatingAccount|null>>]} Tài khoản đích trong dialog cảnh báo. */
  const [warnTarget, setWarnTarget] = useState(null);
  /** @type {[string, import('react').Dispatch<import('react').SetStateAction<string>>]} Lý do cảnh báo (bắt buộc, không rỗng sau trim). */
  const [warnReason, setWarnReason] = useState("");
  /** @type {[string|null, import('react').Dispatch<import('react').SetStateAction<string|null>>]} ID tài khoản đang mở panel chi tiết. */
  const [detailId, setDetailId] = useState(null);
  /** @type {[Object|null, import('react').Dispatch<import('react').SetStateAction<Object|null>>]} Payload chi tiết từ `loadViolatingAccountDetail`. */
  const [detail, setDetail] = useState(null);
  /** @type {[boolean, import('react').Dispatch<import('react').SetStateAction<boolean>>]} `true` khi đang tải chi tiết panel. */
  const [detailLoading, setDetailLoading] = useState(false);
  /** @type {[boolean, import('react').Dispatch<import('react').SetStateAction<boolean>>]} `true` khi đang gọi API gỡ khóa. */
  const [unbanLoading, setUnbanLoading] = useState(false);
  /** @type {[boolean, import('react').Dispatch<import('react').SetStateAction<boolean>>]} Điều khiển hiển thị `EscalatedReportDetailModal`. */
  const [reportModalOpen, setReportModalOpen] = useState(false);

  /**
   * Debounce ô tìm kiếm: sau `SEARCH_DEBOUNCE_MS` ms không gõ thêm thì đồng bộ `debouncedQuery`
   * và reset trang về 1 để tránh hiển thị trang trống khi bộ lọc thu hẹp kết quả.
   *
   * @effect
   * @dependency {string} query - Giá trị thô từ `ModeratorToolbar`.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  /**
   * Tải lại danh sách tài khoản vi phạm từ API theo bộ lọc và phân trang hiện tại.
   *
   * Gọi `loadViolatingAccounts` với `page`, `debouncedQuery`, `statusFilter`, `rankFilter`, `sort`.
   * Khi thành công, cập nhật `accounts`, `totalCount`, `totalPages`; đồng bộ `page` nếu API trả về
   * trang khác (ví dụ khi trang hiện tại vượt quá tổng số trang).
   *
   * @async
   * @function
   * @returns {Promise<void>} Promise hoàn tất sau khi state loading và danh sách được cập nhật.
   *
   * @throws {ApiError} Khi API trả lỗi có cấu trúc — message hiển thị qua `showToast`.
   * @throws {Error} Lỗi mạng hoặc không mong đợi — fallback toast tiếng Việt mặc định.
   *
   * @example
   * await refreshList();
   * // Sau khi confirmLock/confirmWarn thành công để làm mới bảng.
   */
  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadViolatingAccounts({
        page,
        pageSize: VIOLATIONS_PAGE_SIZE,
        search: debouncedQuery,
        status: statusFilter,
        rank: rankFilter,
        sort,
      });
      setAccounts(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      if (result.page !== page) {
        setPage(result.page);
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không tải được danh sách tài khoản vi phạm.";
      showToast(message);
      setAccounts([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, rankFilter, showToast, sort, statusFilter]);

  /**
   * Kích hoạt `refreshList` mỗi khi dependency của callback thay đổi (trang, lọc, sort, tìm kiếm).
   *
   * @effect
   * @dependency {Function} refreshList
   */
  useEffect(() => {
    refreshList();
  }, [refreshList]);

  /**
   * Xử lý deep-link từ báo cáo leo thang: khi URL có `userId` và `username` lần đầu,
   * điền sẵn `lockReason` (nếu có `reason`) và mở `EscalatedReportDetailModal`.
   *
   * `focusHandledRef` đảm bảo chỉ chạy một lần mỗi lần mount, tránh mở lại modal khi re-render.
   *
   * @effect
   * @dependency {string|null} focusUserId
   * @dependency {string|null} focusUsername
   * @dependency {string} focusReason
   */
  useEffect(() => {
    if (!focusUserId || !focusUsername || focusHandledRef.current) {
      return;
    }

    focusHandledRef.current = true;
    if (focusReason) {
      setLockReason(focusReason);
    }
    setReportModalOpen(true);
  }, [focusUserId, focusUsername, focusReason]);

  /**
   * Xóa các query parameter liên quan đến báo cáo leo thang khỏi URL.
   *
   * Dùng `replace: true` để không tạo thêm mục lịch sử trình duyệt khi đóng modal.
   *
   * @function
   * @returns {void}
   *
   * @example
   * closeReportModal(); // gọi nội bộ clearReportFocusParams()
   */
  function clearReportFocusParams() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("userId");
        next.delete("username");
        next.delete("reason");
        next.delete("code");
        next.delete("reporter");
        return next;
      },
      { replace: true },
    );
  }

  /**
   * Đóng modal chi tiết báo cáo leo thang và dọn query string URL.
   *
   * @function
   * @returns {void}
   */
  function closeReportModal() {
    setReportModalOpen(false);
    clearReportFocusParams();
  }

  /**
   * Chuyển từ modal báo cáo sang xem chi tiết tài khoản bị báo cáo.
   *
   * Nếu `focusUserId` có giá trị, gán `detailId` để mở `ViolatingAccountDetailPanel`,
   * sau đó đóng modal và xóa tham số URL.
   *
   * @function
   * @returns {void}
   *
   * @example
   * // Trong EscalatedReportDetailModal, nút "Xem tài khoản":
   * onViewAccount={handleViewAccountFromReport}
   */
  function handleViewAccountFromReport() {
    if (focusUserId) {
      setDetailId(focusUserId);
    }
    closeReportModal();
  }

  /**
   * Tải chi tiết tài khoản khi `detailId` thay đổi; hủy request nếu component unmount hoặc đổi id.
   *
   * Khi `detailId` là `null`, reset `detail` về `null` và không gọi API.
   * Lỗi tải chi tiết hiển thị toast và đóng panel (`setDetailId(null)`).
   *
   * @effect
   * @dependency {string|null} detailId
   * @dependency {Function} showToast
   */
  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return undefined;
    }

    let cancelled = false;
    setDetailLoading(true);

    loadViolatingAccountDetail(detailId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((error) => {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : "Không tải được chi tiết tài khoản.";
          showToast(message);
          setDetailId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailId, showToast]);

  /**
   * Trang hiện tại được clamp không vượt quá `totalPages` — tránh index lỗi khi API thu hẹp kết quả.
   * @type {number}
   */
  const safePage = Math.min(page, totalPages);

  /**
   * Chỉ số bản ghi đầu tiên trên trang hiện tại (1-based); `0` khi không có dữ liệu.
   * @type {number}
   */
  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * VIOLATIONS_PAGE_SIZE + 1;

  /**
   * Chỉ số bản ghi cuối trên trang hiện tại, không vượt `totalCount`.
   * @type {number}
   */
  const rangeEnd = Math.min(safePage * VIOLATIONS_PAGE_SIZE, totalCount);

  /**
   * Tạo handler onChange cho `FilterDropdown`: cập nhật state lọc và reset về trang 1.
   *
   * @function
   * @param {import('react').Dispatch<import('react').SetStateAction<string>>} setter - Hàm setState của filter (`setStatusFilter`, `setRankFilter`, `setSort`).
   * @returns {(value: string) => void} Callback nhận giá trị mới từ dropdown.
   *
   * @example
   * <FilterDropdown onChange={handleFilterChange(setStatusFilter)} />
   */
  function handleFilterChange(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  /**
   * Xuất báo cáo CSV danh sách vi phạm qua `adminApi.downloadModerationViolationsExport`.
   *
   * @async
   * @function
   * @returns {Promise<void>}
   *
   * @throws {ApiError} Khi API từ chối hoặc lỗi máy chủ — message hiển thị qua toast loại `error`.
   * @throws {Error} Lỗi mạng — toast "Không xuất được báo cáo."
   *
   * @example
   * // Nút "Xuất báo cáo" trên header:
   * <button onClick={handleExport}>Xuất báo cáo</button>
   */
  async function handleExport() {
    try {
      await adminApi.downloadModerationViolationsExport();
      showToast("Đã tải file CSV tài khoản vi phạm.");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Không xuất được báo cáo.", "error");
    }
  }

  /**
   * Hướng dẫn Moderator lọc tài khoản "Bình thường" để thêm cảnh báo thủ công (§2.4).
   *
   * Đặt `statusFilter` thành `"normal"`, reset `page` về 1, và hiển thị toast hướng dẫn
   * bấm nút "Cảnh báo" trên từng dòng trong bảng.
   *
   * @function
   * @returns {void}
   */
  function handleAddWarning() {
    setStatusFilter("normal");
    setPage(1);
    showToast(
      "Đã lọc tài khoản Bình thường — bấm Cảnh báo trên từng dòng (§2.4: Mod cảnh báo tài khoản vi phạm).",
    );
  }

  /**
   * Mở panel chi tiết cho một tài khoản trong bảng.
   *
   * @function
   * @param {ViolatingAccount} account - Hàng được chọn từ `accounts`.
   * @returns {void}
   *
   * @example
   * <button onClick={() => handleDetail(account)}>Chi tiết</button>
   */
  function handleDetail(account) {
    setDetailId(account.id);
  }

  /**
   * Đóng panel chi tiết và xóa dữ liệu chi tiết đang cache trong state.
   *
   * @function
   * @returns {void}
   */
  function closeDetail() {
    setDetailId(null);
    setDetail(null);
  }

  /**
   * Mở dialog xác nhận khóa tạm cho tài khoản được chọn.
   *
   * @function
   * @param {ViolatingAccount} account - Tài khoản cần khóa.
   * @param {number} [days=7] - Số ngày khóa mặc định (1, 7 hoặc 30 theo `LOCK_DURATION_OPTIONS`).
   * @returns {void}
   *
   * @example
   * openLockModal(account, 1);  // Khóa 1 ngày
   * openLockModal(account);     // Mặc định 7 ngày
   */
  function openLockModal(account, days = 7) {
    setLockTarget(account);
    setLockDays(days);
    setLockReason(DEFAULT_BAN_REASON);
  }

  /**
   * Đóng dialog khóa tạm và xóa `lockTarget` khỏi state.
   *
   * @function
   * @returns {void}
   */
  function closeLockModal() {
    setLockTarget(null);
  }

  /**
   * Mở dialog gửi cảnh báo và reset ô lý do về chuỗi rỗng.
   *
   * @function
   * @param {ViolatingAccount} account - Tài khoản nhận cảnh báo.
   * @returns {void}
   */
  function openWarnModal(account) {
    setWarnTarget(account);
    setWarnReason("");
  }

  /**
   * Đóng dialog cảnh báo, xóa `warnTarget` và `warnReason`.
   *
   * @function
   * @returns {void}
   */
  function closeWarnModal() {
    setWarnTarget(null);
    setWarnReason("");
  }

  /**
   * Xác nhận và thực thi khóa tạm tài khoản qua `submitViolatingAccountBan`.
   *
   * No-op nếu không có `lockTarget` hoặc đang `actionLoading`. Sau thành công: đóng modal,
   * làm mới danh sách, và reload chi tiết nếu panel đang mở cùng tài khoản.
   *
   * @async
   * @function
   * @returns {Promise<void>}
   *
   * @throws {ApiError} Lỗi từ API — hiển thị message qua `showToast`.
   * @throws {Error} Lỗi không xác định — toast "Không thể khóa tài khoản."
   *
   * @example
   * // Gắn vào ConfirmDialog khóa tạm:
   * <ConfirmDialog onConfirm={confirmLock} />
   */
  async function confirmLock() {
    if (!lockTarget || actionLoading) return;

    setActionLoading(true);
    try {
      await submitViolatingAccountBan(lockTarget.id, lockDays, lockReason);
      showToast(
        `Đã khóa tạm tài khoản ${lockTarget.username} trong ${lockDays} ngày (${getLockSeverityMeta(lockDays).severityLabel}).`,
      );
      closeLockModal();
      await refreshList();
      if (detailId === lockTarget.id) {
        setDetailId(lockTarget.id);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể khóa tài khoản.";
      showToast(message);
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Xác nhận và gửi cảnh báo vi phạm qua `submitViolatingAccountWarning`.
   *
   * Yêu cầu `warnReason` sau khi trim không rỗng; nếu thiếu hiển thị toast và không gọi API.
   * No-op khi không có `warnTarget` hoặc đang `actionLoading`.
   *
   * @async
   * @function
   * @returns {Promise<void>}
   *
   * @throws {ApiError} Lỗi từ API — hiển thị message qua `showToast`.
   * @throws {Error} Lỗi không xác định — toast "Không thể gửi cảnh báo."
   *
   * @example
   * // Textarea bắt buộc trong dialog cảnh báo:
   * await confirmWarn(); // sau khi warnReason = "Spam bài viết"
   */
  async function confirmWarn() {
    if (!warnTarget || actionLoading) return;

    const reason = warnReason.trim();
    if (!reason) {
      showToast("Vui lòng nhập lý do cảnh báo.");
      return;
    }

    setActionLoading(true);
    try {
      await submitViolatingAccountWarning(warnTarget.id, reason);
      showToast(`Đã gửi cảnh báo cho tài khoản ${warnTarget.username}.`);
      closeWarnModal();
      await refreshList();
      if (detailId === warnTarget.id) {
        setDetailId(warnTarget.id);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể gửi cảnh báo.";
      showToast(message);
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Gỡ khóa tạm cho tài khoản đang xem trong panel chi tiết.
   *
   * Gọi `submitViolatingAccountUnban(detailId)`. No-op khi không có `detailId` hoặc `unbanLoading`.
   * Sau thành công làm mới danh sách và trigger reload chi tiết bằng cách set lại `detailId`.
   *
   * @async
   * @function
   * @returns {Promise<void>}
   *
   * @throws {ApiError} Lỗi từ API — hiển thị message qua `showToast`.
   * @throws {Error} Lỗi không xác định — toast "Không thể gỡ khóa."
   *
   * @example
   * <ViolatingAccountDetailPanel onUnban={handleUnban} />
   */
  async function handleUnban() {
    if (!detailId || unbanLoading) return;

    setUnbanLoading(true);
    try {
      await submitViolatingAccountUnban(detailId);
      showToast("Đã gỡ khóa tạm cho tài khoản.");
      await refreshList();
      setDetailId(detailId);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể gỡ khóa.";
      showToast(message);
    } finally {
      setUnbanLoading(false);
    }
  }

  /**
   * Nhóm nút hành động trên header trang: xuất CSV và hướng dẫn thêm cảnh báo.
   *
   * @type {import('react').ReactElement}
   * @readonly
   */
  const headerActions = (
    <div className={styles.headerActions}>
      <button type="button" className={styles.btnOutline} onClick={handleExport}>
        <FontAwesomeIcon icon={faDownload} />
        Xuất báo cáo
      </button>
      <button type="button" className={styles.btnPrimary} onClick={handleAddWarning}>
        <FontAwesomeIcon icon={faPlus} />
        Thêm cảnh báo
      </button>
    </div>
  );

  return (
    <ModeratorPageShell
      variant="wide"
      title="Quản lý Tài khoản vi phạm"
      description="Cảnh báo hoặc khóa tạm tài khoản vi phạm: 1 ngày / 7 ngày / 30 ngày (Moderator)."
      crumbs={VIOLATIONS_CRUMBS}
      actions={headerActions}
    >
      <div className={styles.layout}>
        <section className={styles.card}>
          <ModeratorToolbar
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm kiếm theo Tên, Email hoặc username..."
          >
            <FilterDropdown
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              ariaLabel="Lọc trạng thái"
            />
            <FilterDropdown
              options={RANK_OPTIONS}
              value={rankFilter}
              onChange={handleFilterChange(setRankFilter)}
              ariaLabel="Lọc hạng thành viên"
            />
            <FilterDropdown
              options={SORT_OPTIONS}
              value={sort}
              onChange={handleFilterChange(setSort)}
              ariaLabel="Sắp xếp"
            />
          </ModeratorToolbar>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Email / Liên hệ</th>
                  <th>Hạng thành viên</th>
                  <th>Số vi phạm</th>
                  <th>Trạng thái</th>
                  <th>Cảnh báo / khóa tạm</th>
                  <th aria-label="Thao tác khác" />
                </tr>
              </thead>
              {loading ? (
                <ModeratorAccountsTableSkeleton />
              ) : (
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      {focusUserId
                        ? "Tài khoản chưa có lịch sử vi phạm — bấm Chi tiết để xem và xử lý."
                        : "Không có tài khoản vi phạm nào. Hiển thị user đã bị cảnh báo hoặc khóa (tạm / vĩnh viễn)."}
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => {
                    const lockInfo = getAccountLockInfo(account);
                    const lockDisabled = lockInfo.isActive;
                    const isSelected = detailId === account.id;

                    return (
                      <tr key={account.id} className={isSelected ? styles.rowSelected : undefined}>
                        <td data-label="Tài khoản">
                          <div className={styles.account}>
                            <div className={styles.avatar} aria-hidden>
                              {account.initial}
                            </div>
                            <div>
                              <p className={styles.accountName}>{account.displayName}</p>
                              <p className={styles.accountId}>@{account.username}</p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Email / Liên hệ">
                          <p className={styles.email}>{account.email}</p>
                          <p className={styles.dept}>{account.studentId}</p>
                        </td>
                        <td data-label="Hạng thành viên">
                          <RankBadge rank={account.rank} />
                        </td>
                        <td data-label="Số vi phạm">
                          <span className={styles.violations}>{account.violations}</span>
                        </td>
                        <td data-label="Trạng thái">
                          <StatusBadge account={account} />
                        </td>
                        <td data-label="Cảnh báo / khóa tạm">
                          <div className={styles.sanctionActions}>
                            <button
                              type="button"
                              className={styles.warnBtn}
                              onClick={() => openWarnModal(account)}
                              disabled={lockDisabled || actionLoading}
                            >
                              <FontAwesomeIcon icon={faTriangleExclamation} />
                              Cảnh báo
                            </button>
                            <div className={styles.lockGroup} role="group" aria-label="Khóa tạm">
                              {LOCK_DURATION_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`${styles.lockChip} ${styles[`lockChip-${option.severity}`]}`}
                                  onClick={() => openLockModal(account, option.value)}
                                  disabled={lockDisabled || actionLoading}
                                  title={`Khóa tạm ${option.label} — ${option.severityLabel}`}
                                >
                                  <FontAwesomeIcon icon={faLock} />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className={styles.detailCell} data-label="Thao tác">
                          <button
                            type="button"
                            className={styles.detailBtn}
                            onClick={() => handleDetail(account)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              )}
            </table>
          </div>

          <footer className={styles.tableFooter}>
            <p className={styles.summary}>
              Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> / {totalCount} tài khoản
            </p>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              ariaLabel="Phân trang tài khoản vi phạm"
              alwaysShow
              flush
            />
            <p className={styles.footerBalance} aria-hidden="true">
              Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> / {totalCount} tài khoản
            </p>
          </footer>
        </section>
      </div>

      <ViolatingAccountDetailPanel
        open={Boolean(detailId)}
        detail={detail}
        loading={detailLoading}
        onClose={closeDetail}
        onUnban={handleUnban}
        unbanLoading={unbanLoading}
      />

      <ConfirmDialog
        open={Boolean(lockTarget)}
        title="Khóa tạm tài khoản"
        description={
          lockTarget
            ? `Xác nhận khóa tạm tài khoản ${lockTarget.username} (${lockTarget.displayName}).`
            : ""
        }
        confirmLabel={actionLoading ? "Đang xử lý..." : "Xác nhận khóa"}
        variant="danger"
        onConfirm={confirmLock}
        onCancel={closeLockModal}
      >
        <div className={styles.lockOptions} role="radiogroup" aria-label="Thời hạn khóa">
          {LOCK_DURATION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`${styles.lockOption} ${styles[`lockOption-${option.severity}`]} ${
                lockDays === option.value ? styles.lockOptionActive : ""
              }`}
            >
              <input
                type="radio"
                name="lockDuration"
                value={option.value}
                checked={lockDays === option.value}
                onChange={() => setLockDays(option.value)}
              />
              <span className={styles.lockOptionBody}>
                <span className={styles.lockOptionMain}>
                  <span className={styles.lockOptionLabel}>{option.label}</span>
                  <ModeratorBadge
                    label={option.severityLabel}
                    tone={getLockSeverityTone(option.severity)}
                    size="sm"
                  />
                </span>
                <span className={styles.lockOptionMeta}>{option.description}</span>
              </span>
            </label>
          ))}
        </div>
        <label className={styles.reasonField}>
          <span className={styles.reasonLabel}>Lý do khóa</span>
          <textarea
            className={styles.reasonInput}
            rows={3}
            value={lockReason}
            onChange={(event) => setLockReason(event.target.value)}
            placeholder={DEFAULT_BAN_REASON}
          />
        </label>
        <p className={styles.lockHint}>
          Moderator chỉ được khóa tạm 1 / 7 / 30 ngày. Khóa vĩnh viễn thuộc quyền Admin.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(warnTarget)}
        title="Gửi cảnh báo"
        description={
          warnTarget
            ? `Gửi cảnh báo vi phạm tiêu chuẩn cộng đồng cho ${warnTarget.username} (${warnTarget.displayName}).`
            : ""
        }
        confirmLabel={actionLoading ? "Đang gửi..." : "Gửi cảnh báo"}
        variant="primary"
        onConfirm={confirmWarn}
        onCancel={closeWarnModal}
      >
        <label className={styles.reasonField}>
          <span className={styles.reasonLabel}>
            Lý do cảnh báo <span className={styles.required}>*</span>
          </span>
          <textarea
            className={styles.reasonInput}
            rows={3}
            value={warnReason}
            onChange={(event) => setWarnReason(event.target.value)}
            placeholder="Mô tả vi phạm (bắt buộc)..."
          />
        </label>
      </ConfirmDialog>

      <EscalatedReportDetailModal
        open={reportModalOpen}
        onClose={closeReportModal}
        reportCode={focusReportCode}
        username={focusUsername}
        reporterUsername={focusReporter}
        detail={focusReason}
        onViewAccount={handleViewAccountFromReport}
      />
    </ModeratorPageShell>
  );
}

/**
 * Export mặc định của trang quản lý tài khoản vi phạm cho router Moderator.
 *
 * @type {typeof ViolatingAccountsPage}
 * @default
 *
 * @example
 * import ViolatingAccountsPage from './ViolatingAccountsPage/ViolatingAccountsPage';
 * <Route path="violations" element={<ViolatingAccountsPage />} />
 */
export default ViolatingAccountsPage;
