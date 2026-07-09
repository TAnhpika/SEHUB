/**
 * @fileoverview Trang hàng đợi duyệt bài viết pre-moderation dành cho Moderator SEHUB.
 *
 * Module này cung cấp giao diện đầy đủ để:
 * - Xem, tìm kiếm, sắp xếp và phân trang bài viết sinh viên gửi chờ duyệt.
 * - Chọn nhiều bài (checkbox) để duyệt hoặc từ chối hàng loạt.
 * - Xem chi tiết bài (ảnh bìa, nội dung, file đính kèm) trong panel bên phải.
 * - Hỗ trợ layout mobile: chuyển giữa danh sách và chi tiết.
 *
 * @module features/moderator/content/ContentModerationPage
 * @see {@link module:features/moderator/content/contentModerationStore} — hook `useContentModerationQueue`
 * @see {@link module:features/moderator/content/components/ContentPostDetailPanel} — panel chi tiết
 */

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faFilePdf, faImage, faRotateRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import Pagination from "@/common/Pagination/Pagination";
import { useToast } from "@/common/Toast/ToastProvider";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import ModeratorToolbar from "@/features/moderator/components/ModeratorToolbar/ModeratorToolbar";
import ContentPostDetailPanel from "@/features/moderator/content/components/ContentPostDetailPanel/ContentPostDetailPanel";
import {
    ModeratorContentQueueTableSkeleton,
    ModeratorDetailSkeleton,
} from "@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton";
import { CONTENT_QUEUE_PAGE_SIZE, filterContentQueue, SORT_OPTIONS } from "@/features/moderator/content/contentModerationData";
import { useContentModerationDetail, useContentModerationQueue } from "@/features/moderator/content/contentModerationStore";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import styles from "./ContentModerationPage.module.css";

/**
 * Cấu hình breadcrumb trên `ModeratorPageShell` cho trang hàng đợi duyệt.
 *
 * @constant {ReadonlyArray<{ label: string, to?: string }>}
 * @readonly
 */
const CONTENT_CRUMBS = [{ label: "Trang chủ", to: "/home" }, { label: "Kiểm duyệt", to: "/moderator/content" }, { label: "Duyệt bài viết" }];

/**
 * Thời gian debounce (ms) ô tìm kiếm trước khi cập nhật `search` trong store.
 *
 * @constant {number}
 * @readonly
 * @default 350
 */
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Trang hàng đợi duyệt bài viết — container stateful cho luồng pre-moderation.
 *
 * **Luồng dữ liệu:**
 * - `searchInput` → debounce → `setSearch` → `useContentModerationQueue` → `items`.
 * - `filterContentQueue` → phân trang client → `pageItems`.
 * - `focusedId` → `useContentModerationDetail` → `ContentPostDetailPanel`.
 *
 * **Hành động Moderator:**
 * - Duyệt/từ chối đơn hoặc hàng loạt qua `approveItems` / `rejectItems`.
 *
 * @param {{ portal?: 'admin' | 'moderator' }} [props]
 * @returns {import('react').ReactElement} Layout workspace với bảng, bulk bar và panel chi tiết.
 *
 * @example
 * <Route path="/moderator/content" element={<ContentModerationPage />} />
 */
function ContentModerationPage({ portal = "moderator" }) {
    const { showToast } = useToast();
    const { items, loading, error, sort, setSort, search, setSearch, refresh, approveItems, rejectItems } = useContentModerationQueue();
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [focusedId, setFocusedId] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const acting = pendingAction !== null;
    const { item: focusedItem, loading: detailLoading } = useContentModerationDetail(focusedId);
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false,
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 1023px)");
        const handleChange = () => setIsMobile(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [searchInput, setSearch]);

    const showMobileDetail = isMobile && Boolean(focusedId);

    const filtered = useMemo(() => filterContentQueue(items, { sort, query: search }), [items, sort, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / CONTENT_QUEUE_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * CONTENT_QUEUE_PAGE_SIZE;
        return filtered.slice(start, start + CONTENT_QUEUE_PAGE_SIZE);
    }, [filtered, safePage]);

    const pageIds = pageItems.map((item) => item.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const somePageSelected = pageIds.some((id) => selectedIds.has(id));
    const selectedCount = selectedIds.size;

    const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * CONTENT_QUEUE_PAGE_SIZE + 1;
    const rangeEnd = Math.min(safePage * CONTENT_QUEUE_PAGE_SIZE, filtered.length);

    useEffect(() => {
        if (filtered.length === 0) {
            setFocusedId(null);
            return;
        }
        if (focusedId && !filtered.some((item) => item.id === focusedId)) {
            setFocusedId(filtered[0]?.id ?? null);
        }
    }, [filtered, focusedId]);

    /**
     * Tạo handler onChange cho `FilterDropdown`: cập nhật state và reset trang về 1.
     *
     * @param {import('react').Dispatch<import('react').SetStateAction<string>>} setter - Hàm setState (ví dụ `setSort`).
     * @returns {(value: string) => void} Callback nhận giá trị mới từ dropdown.
     */
    function handleFilterChange(setter) {
        return (value) => {
            setter(value);
            setPage(1);
        };
    }

    /**
     * Bật/tắt chọn một hàng trong bảng (checkbox); không lan sự kiện click lên `<tr>`.
     *
     * @param {string} id - ID bài viết.
     * @param {import('react').ChangeEvent<HTMLInputElement>} event - Sự kiện checkbox.
     * @returns {void}
     */
    function toggleRow(id, event) {
        event.stopPropagation();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    /**
     * Chọn/bỏ chọn tất cả bài trên trang hiện tại (header checkbox).
     *
     * @param {import('react').ChangeEvent<HTMLInputElement>} event - Sự kiện checkbox header.
     * @returns {void}
     */
    function togglePageRows(event) {
        event.stopPropagation();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                pageIds.forEach((id) => next.delete(id));
            } else {
                pageIds.forEach((id) => next.add(id));
            }
            return next;
        });
    }

    /**
     * Xóa các ID khỏi `selectedIds` sau duyệt/từ chối; đóng panel nếu bài đang focus bị xử lý.
     *
     * @param {string[]} ids - ID bài đã duyệt hoặc từ chối.
     * @returns {void}
     */
    function clearSelection(ids) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
        });
        if (focusedId && ids.includes(focusedId)) {
            setFocusedId(null);
        }
    }

    /**
     * Duyệt một hoặc nhiều bài viết qua `approveItems` từ store.
     *
     * @async
     * @param {string[]} ids - ID bài cần duyệt.
     * @returns {Promise<void>}
     *
     * @throws {Error} Lỗi từ store/API — hiển thị toast.
     */
    async function handleApprove(ids) {
        if (acting || ids.length === 0) return;
        setPendingAction({ type: "approve", ids });
        try {
            await approveItems(ids);
            clearSelection(ids);
            showToast(`Đã duyệt ${ids.length} bài viết. Bài sẽ hiển thị trên feed.`);
        } catch (err) {
            showToast(err.message ?? "Không duyệt được bài viết.");
        } finally {
            setPendingAction(null);
        }
    }

    /**
     * Từ chối một hoặc nhiều bài viết qua `rejectItems` từ store.
     *
     * @async
     * @param {string[]} ids - ID bài cần từ chối.
     * @returns {Promise<void>}
     *
     * @throws {Error} Lỗi từ store/API — hiển thị toast.
     */
    async function handleReject(ids) {
        if (acting || ids.length === 0) return;
        setPendingAction({ type: "reject", ids });
        try {
            await rejectItems(ids);
            clearSelection(ids);
            showToast(`Đã từ chối ${ids.length} bài viết. Sinh viên có thể chỉnh sửa và gửi lại.`);
        } catch (err) {
            showToast(err.message ?? "Không từ chối được bài viết.");
        } finally {
            setPendingAction(null);
        }
    }

    /**
     * Làm mới hàng đợi: xóa selection, đóng panel, reset trang và gọi `refresh`.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function handleRefresh() {
        setSelectedIds(new Set());
        setFocusedId(null);
        setPage(1);
        try {
            await refresh(sort);
            showToast("Đã làm mới hàng đợi duyệt bài viết.");
        } catch (err) {
            showToast(err.message ?? "Không làm mới được dữ liệu.");
        }
    }

    /**
     * Mở panel chi tiết cho bài được chọn trong bảng.
     *
     * @param {string} id - ID bài viết.
     * @returns {void}
     */
    function focusItem(id) {
        setFocusedId(id);
    }

    const workspaceBody = (
            <section className={styles.card}>
                <div className={styles.toolbarBlock}>
                    <ModeratorToolbar
                        searchValue={searchInput}
                        onSearchChange={setSearchInput}
                        searchPlaceholder="Tìm tiêu đề, tác giả..."
                        end={
                            <button type="button" className={styles.refreshBtn} onClick={handleRefresh}>
                                <FontAwesomeIcon icon={faRotateRight} />
                                Làm mới
                            </button>
                        }
                    >
                        <FilterDropdown options={SORT_OPTIONS} value={sort} onChange={handleFilterChange(setSort)} ariaLabel="Sắp xếp" />
                    </ModeratorToolbar>
                </div>

                {selectedCount > 0 ? (
                    <div className={styles.bulkBar}>
                        <p className={styles.bulkText}>
                            Đã chọn <strong>{selectedCount}</strong> bài viết
                        </p>
                        <div className={styles.bulkActions}>
                            <button type="button" className={styles.bulkClear} onClick={() => setSelectedIds(new Set())}>
                                Bỏ chọn
                            </button>
                            <button type="button" className={styles.bulkReject} disabled={acting} onClick={() => handleReject([...selectedIds])}>
                                <FontAwesomeIcon icon={faXmark} />
                                {pendingAction?.type === "reject" ? "Đang từ chối..." : "Từ chối tất cả"}
                            </button>
                            <button type="button" className={styles.bulkApprove} disabled={acting} onClick={() => handleApprove([...selectedIds])}>
                                <FontAwesomeIcon icon={faCheck} />
                                {pendingAction?.type === "approve" ? "Đang duyệt..." : "Duyệt tất cả"}
                            </button>
                        </div>
                    </div>
                ) : null}

                <div
                    className={`${styles.workspace} ${isMobile ? styles.workspaceMobile : ""} ${showMobileDetail ? styles.pageMobileDetail : ""}`}
                >
                    <div
                        className={`${styles.listCol} ${showMobileDetail ? styles.listColMobileHidden : ""}`}
                    >
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.colCheck}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={allPageSelected}
                                                ref={(input) => {
                                                    if (input) input.indeterminate = somePageSelected && !allPageSelected;
                                                }}
                                                onChange={togglePageRows}
                                                aria-label="Chọn tất cả bài viết trên trang"
                                            />
                                        </th>
                                        <th>Tiêu đề / Nội dung</th>
                                        <th>Tác giả</th>
                                        <th>Thời gian</th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <ModeratorContentQueueTableSkeleton />
                                ) : (
                                <tbody>
                                    {error ? (
                                        <tr>
                                            <td colSpan={4} className={styles.empty} role="alert">
                                                {error}
                                            </td>
                                        </tr>
                                    ) : pageItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className={styles.empty}>
                                                Không có bài viết chờ duyệt.
                                            </td>
                                        </tr>
                                    ) : (
                                        pageItems.map((item) => {
                                            const isSelected = selectedIds.has(item.id);
                                            const isFocused = focusedId === item.id;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={[isFocused ? styles.rowFocused : "", isSelected ? styles.rowSelected : ""].filter(Boolean).join(" ")}
                                                    onClick={() => focusItem(item.id)}
                                                >
                                                    <td className={styles.colCheck}>
                                                        <input
                                                            type="checkbox"
                                                            className={styles.checkbox}
                                                            checked={isSelected}
                                                            onChange={(event) => toggleRow(item.id, event)}
                                                            onClick={(event) => event.stopPropagation()}
                                                            aria-label={`Chọn bài viết: ${item.title}`}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className={styles.contentCell}>
                                                            <p className={styles.contentTitle}>{item.title}</p>
                                                            <p className={styles.contentExcerpt}>{item.excerpt}</p>
                                                            <div className={styles.contentHints}>
                                                                {item.resubmission ? <span className={styles.contentHintResubmit}>Gửi lại</span> : null}
                                                                {item.coverImage?.url ? (
                                                                    <span className={styles.contentHint}>
                                                                        <FontAwesomeIcon icon={faImage} />
                                                                        Ảnh bìa
                                                                    </span>
                                                                ) : null}
                                                                {item.inlineImages?.length ? (
                                                                    <span className={styles.contentHint}>
                                                                        <FontAwesomeIcon icon={faImage} />
                                                                        {item.inlineImages.length} ảnh
                                                                    </span>
                                                                ) : null}
                                                                {item.attachments?.length ? (
                                                                    <span className={styles.contentHint}>
                                                                        <FontAwesomeIcon icon={faFilePdf} />
                                                                        {item.attachments.length} file
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.author}>
                                                            <div className={styles.avatar} aria-hidden>
                                                                {item.authorInitial}
                                                            </div>
                                                            <div>
                                                                <p className={styles.authorName}>{item.authorName}</p>
                                                                <p className={styles.authorId}>{item.studentId}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={styles.time}>{item.timeLabel}</span>
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
                                Hiển thị{" "}
                                <strong>
                                    {rangeStart}–{rangeEnd}
                                </strong>{" "}
                                / {filtered.length} bài viết
                            </p>
                            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} ariaLabel="Phân trang hàng đợi duyệt bài viết" alwaysShow flush />
                        </footer>
                    </div>

                    <aside
                        className={`${styles.detailCol} ${isMobile && !focusedId ? styles.detailColMobileHidden : ""}`}
                        aria-label="Chi tiết bài viết"
                    >
                        {showMobileDetail ? (
                            <button
                                type="button"
                                className={styles.mobileBack}
                                onClick={() => setFocusedId(null)}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Danh sách chờ duyệt
                            </button>
                        ) : null}
                        {detailLoading && focusedId ? (
                            <ModeratorDetailSkeleton aria-label="Đang tải chi tiết bài viết" />
                        ) : (
                            <ContentPostDetailPanel
                                item={focusedItem}
                                mode="queue"
                                isApproving={pendingAction?.type === "approve" && focusedItem != null && pendingAction.ids.includes(focusedItem.id)}
                                isRejecting={pendingAction?.type === "reject" && focusedItem != null && pendingAction.ids.includes(focusedItem.id)}
                                onApprove={(id) => handleApprove([id])}
                                onReject={(id) => handleReject([id])}
                            />
                        )}
                    </aside>
                </div>
            </section>
    );

    if (portal === "admin") {
        return (
            <AdminPageLayout
                title="Bài viết chờ duyệt"
                subtitle="Duyệt bài viết sinh viên gửi trước khi hiển thị trên cộng đồng. Bài Rejected có thể được gửi duyệt lại."
                breadcrumbs={[
                    { label: "Dashboard", to: "/admin" },
                    { label: "Kiểm duyệt", to: "/admin/moderation" },
                    { label: "Bài viết chờ duyệt" },
                ]}
            >
                {workspaceBody}
            </AdminPageLayout>
        );
    }

    return (
        <ModeratorPageShell
            title="Hàng đợi duyệt bài viết"
            description="Duyệt bài viết sinh viên gửi trước khi hiển thị trên cộng đồng. Bài Rejected có thể được gửi duyệt lại."
            crumbs={CONTENT_CRUMBS}
        >
            {workspaceBody}
        </ModeratorPageShell>
    );
}

/**
 * Export mặc định trang hàng đợi duyệt bài viết cho router Moderator.
 *
 * @type {typeof ContentModerationPage}
 * @default
 *
 * @example
 * import ContentModerationPage from './ContentModerationPage/ContentModerationPage';
 * <Route path="content" element={<ContentModerationPage />} />
 */
export default ContentModerationPage;
