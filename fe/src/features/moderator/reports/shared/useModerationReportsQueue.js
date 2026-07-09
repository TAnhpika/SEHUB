/**
 * @fileoverview Hook React quản lý hàng chờ báo cáo moderation cho Admin/Moderator dashboard.
 *
 * Gộp ba nguồn báo cáo (cộng đồng, câu hỏi đề thi, người dùng/tin nhắn) vào một queue thống nhất,
 * tự động tải khi mount và lắng nghe sự kiện `sehubs-exam-reports-changed` /
 * `sehubs-conversation-reports-changed` để cập nhật realtime.
 *
 * @module features/moderator/reports/shared/useModerationReportsQueue
 * @see {@link module:features/admin/moderation/adminReportData}
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadAdminModerationReports } from "@/features/admin/moderation/adminReportData";
import { getExamQuestionReports } from "@/features/exams/examQuestionReportStore";
import { getConversationReports } from "@/features/moderator/reports/conversationReportStore";

/**
 * @typedef {Object} UseModerationReportsQueueOptions
 * @property {(message: string) => void} [onLoadError] - Callback khi tải báo cáo thất bại; nhận thông báo lỗi gộp.
 */

/**
 * @typedef {Object} UseModerationReportsQueueResult
 * @property {Array} communityReports - Danh sách báo cáo cộng đồng (bài viết/bình luận).
 * @property {import('react').Dispatch<import('react').SetStateAction<Array>>} setCommunityReports
 * @property {Array} examReports - Danh sách báo cáo câu hỏi đề thi.
 * @property {Array} userReports - Danh sách báo cáo người dùng (tin nhắn/tài khoản).
 * @property {boolean} communityHasMore - Còn trang báo cáo cộng đồng để tải thêm.
 * @property {number} communityPage - Trang API hiện tại của báo cáo cộng đồng.
 * @property {import('react').Dispatch<import('react').SetStateAction<boolean>>} setCommunityHasMore
 * @property {import('react').Dispatch<import('react').SetStateAction<number>>} setCommunityPage
 * @property {boolean} isLoading - `true` trong lần tải ban đầu.
 * @property {string|null} loadError - Thông báo lỗi gộp từ các nguồn, hoặc `null`.
 * @property {Array} reports - Mảng gộp `[...examReports, ...communityReports, ...userReports]`.
 * @property {() => Promise<Array>} refreshAllReports - Tải lại toàn bộ queue từ API.
 */

/**
 * Hook quản lý state hàng chờ báo cáo moderation — dùng cho dashboard Admin tổng hợp.
 *
 * **Luồng dữ liệu:**
 * - Mount → `loadAdminModerationReports()` → `applyLoadResult`.
 * - Sự kiện window → refresh riêng `examReports` / `userReports`.
 * - `refreshAllReports()` → gọi lại API và trả về mảng gộp.
 *
 * @param {UseModerationReportsQueueOptions} [options] - Tùy chọn hook.
 * @returns {UseModerationReportsQueueResult} State và hàm thao tác hàng chờ báo cáo.
 *
 * @example
 * const { reports, isLoading, refreshAllReports } = useModerationReportsQueue({
 *   onLoadError: (msg) => showToast(msg),
 * });
 */
export function useModerationReportsQueue({ onLoadError } = {}) {
  const [communityReports, setCommunityReports] = useState([]);
  const [examReports, setExamReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [communityHasMore, setCommunityHasMore] = useState(false);
  const [communityPage, setCommunityPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const onLoadErrorRef = useRef(onLoadError);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  const applyLoadResult = useCallback((data) => {
    setCommunityReports(data.communityReports ?? []);
    setExamReports(data.examReports ?? []);
    setUserReports(data.userReports ?? []);
    setCommunityHasMore(data.communityHasMore ?? false);
    setCommunityPage(data.communityPage ?? 1);
    setLoadError(data.errors?.length ? data.errors.join(" · ") : null);
    if (data.errors?.length) {
      onLoadErrorRef.current?.(data.errors.join(" · "));
    }
  }, []);

  const refreshAllReports = useCallback(async () => {
    const data = await loadAdminModerationReports();
    applyLoadResult(data);
    return [...(data.examReports ?? []), ...(data.communityReports ?? []), ...(data.userReports ?? [])];
  }, [applyLoadResult]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    loadAdminModerationReports()
      .then((data) => {
        if (!cancelled) applyLoadResult(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err.message ?? "Không tải được báo cáo.";
          setLoadError(message);
          onLoadErrorRef.current?.(message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyLoadResult]);

  useEffect(() => {
    let cancelled = false;

    function refreshExamReports() {
      getExamQuestionReports()
        .then((items) => {
          if (!cancelled) setExamReports(items);
        })
        .catch(() => {
          if (!cancelled) setExamReports([]);
        });
    }

    function refreshUserReports() {
      getConversationReports()
        .then((items) => {
          if (!cancelled) setUserReports(items);
        })
        .catch(() => {
          if (!cancelled) setUserReports([]);
        });
    }

    window.addEventListener("sehubs-exam-reports-changed", refreshExamReports);
    window.addEventListener("sehubs-conversation-reports-changed", refreshUserReports);
    return () => {
      cancelled = true;
      window.removeEventListener("sehubs-exam-reports-changed", refreshExamReports);
      window.removeEventListener("sehubs-conversation-reports-changed", refreshUserReports);
    };
  }, []);

  const reports = useMemo(
    () => [...examReports, ...communityReports, ...userReports],
    [examReports, communityReports, userReports],
  );

  return {
    communityReports,
    setCommunityReports,
    examReports,
    userReports,
    communityHasMore,
    communityPage,
    setCommunityHasMore,
    setCommunityPage,
    isLoading,
    loadError,
    reports,
    refreshAllReports,
  };
}
