import { useCallback, useEffect, useMemo, useState } from "react";
import { loadAdminModerationReports } from "@/features/admin/moderation/adminReportData";
import { getExamQuestionReports } from "@/features/exams/examQuestionReportStore";
import { getConversationReports } from "@/features/moderator/reports/conversationReportStore";

export function useModerationReportsQueue({ onLoadError } = {}) {
  const [communityReports, setCommunityReports] = useState([]);
  const [examReports, setExamReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [communityHasMore, setCommunityHasMore] = useState(false);
  const [communityPage, setCommunityPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const applyLoadResult = useCallback((data) => {
    setCommunityReports(data.communityReports ?? []);
    setExamReports(data.examReports ?? []);
    setUserReports(data.userReports ?? []);
    setCommunityHasMore(data.communityHasMore ?? false);
    setCommunityPage(data.communityPage ?? 1);
    setLoadError(data.errors?.length ? data.errors.join(" · ") : null);
    if (data.errors?.length) {
      onLoadError?.(data.errors.join(" · "));
    }
  }, [onLoadError]);

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
          onLoadError?.(message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyLoadResult, onLoadError]);

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
