import { useCallback, useEffect, useState } from "react";

import Button from "@/common/Button/Button";

import LearningActivityTabs from "./LearningActivityTabs";

import LearningActivitySummary from "./LearningActivitySummary";

import ExamAttemptHistoryList from "./ExamAttemptHistoryList";

import PracticeSubmissionHistoryList from "./PracticeSubmissionHistoryList";

import {

  loadExamAttemptHistory,

  loadPracticeSubmissionHistory,

} from "./learningActivityData";

import styles from "./LearningActivitySection.module.css";



/**

 * @param {{

 *   activeTab?: "exams" | "practice";

 *   onTabChange?: (tab: "exams" | "practice") => void;

 *   showPageHeader?: boolean;

 * }} props

 */

function LearningActivitySection({

  activeTab = "exams",

  onTabChange,

  showPageHeader = true,

}) {

  const [examAttempts, setExamAttempts] = useState([]);

  const [practiceSubmissions, setPracticeSubmissions] = useState([]);

  const [examTotalCount, setExamTotalCount] = useState(0);

  const [practiceTotalCount, setPracticeTotalCount] = useState(0);

  const [examHasNext, setExamHasNext] = useState(false);

  const [practiceHasNext, setPracticeHasNext] = useState(false);

  const [examPage, setExamPage] = useState(1);

  const [practicePage, setPracticePage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState(null);

  const [practiceSource, setPracticeSource] = useState("api");



  const fetchInitial = useCallback(async () => {

    setLoading(true);

    setError(null);



    try {

      const [exams, practice] = await Promise.all([

        loadExamAttemptHistory({ page: 1 }),

        loadPracticeSubmissionHistory({ page: 1 }),

      ]);



      setExamAttempts(exams.items);

      setPracticeSubmissions(practice.items);

      setExamTotalCount(exams.totalCount);

      setPracticeTotalCount(practice.totalCount);

      setExamHasNext(exams.hasNextPage);

      setPracticeHasNext(practice.hasNextPage);

      setExamPage(1);

      setPracticePage(1);

      setPracticeSource(practice.source);

    } catch (err) {

      setError(err?.message ?? "Không tải được lịch sử học tập.");

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    fetchInitial();

  }, [fetchInitial]);



  useEffect(() => {

    function handleVisibilityChange() {

      if (document.visibilityState === "visible") {

        fetchInitial();

      }

    }



    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);

  }, [fetchInitial]);



  async function handleLoadMoreExams() {

    if (!examHasNext || loadingMore) return;

    setLoadingMore(true);

    try {

      const nextPage = examPage + 1;

      const page = await loadExamAttemptHistory({ page: nextPage });

      setExamAttempts((current) => [...current, ...page.items]);

      setExamPage(nextPage);

      setExamHasNext(page.hasNextPage);

      setExamTotalCount(page.totalCount);

    } catch (err) {

      setError(err?.message ?? "Không tải thêm đề cuối kỳ.");

    } finally {

      setLoadingMore(false);

    }

  }



  async function handleLoadMorePractice() {

    if (!practiceHasNext || loadingMore) return;

    setLoadingMore(true);

    try {

      const nextPage = practicePage + 1;

      const page = await loadPracticeSubmissionHistory({ page: nextPage });

      setPracticeSubmissions((current) => [...current, ...page.items]);

      setPracticePage(nextPage);

      setPracticeHasNext(page.hasNextPage);

      setPracticeTotalCount(page.totalCount);

    } catch (err) {

      setError(err?.message ?? "Không tải thêm bài thực hành.");

    } finally {

      setLoadingMore(false);

    }

  }



  function handleTabChange(tab) {

    onTabChange?.(tab);

  }



  const showMockBanner = practiceSource === "mock";

  const showPracticeApiUnavailableBanner =

    !showMockBanner && practiceSource === "api-unavailable";



  return (

    <section className={styles.panel} id="learning-activity" aria-label="Lịch sử học tập">

      {showPageHeader ? (

        <header className={styles.header}>

          <div className={styles.headerText}>

            <h2 className={styles.title}>Lịch sử học tập</h2>

            <p className={styles.subtitle}>

              Đề cuối kỳ đã làm và bài thực hành đã nộp.

            </p>

          </div>

        </header>

      ) : null}



      {showMockBanner ? (

        <p className={styles.mockBanner} role="note">

          Tab thực hành đang hiển thị dữ liệu mẫu (VITE_USE_MOCK=true).

        </p>

      ) : null}



      {showPracticeApiUnavailableBanner ? (

        <p className={styles.infoBanner} role="note">

          API lịch sử thực hành chưa sẵn sàng — tab đề cuối kỳ vẫn lấy dữ liệu thật từ server.

        </p>

      ) : null}



      {error ? (

        <p className={styles.errorBanner} role="alert">

          {error}

        </p>

      ) : null}



      <LearningActivitySummary

        examCount={examTotalCount || examAttempts.length}

        practiceCount={practiceTotalCount || practiceSubmissions.length}

      />



      <LearningActivityTabs

        activeTab={activeTab}

        examCount={examTotalCount || examAttempts.length}

        practiceCount={practiceTotalCount || practiceSubmissions.length}

        onChange={handleTabChange}

      />



      {loading ? (

        <div className={styles.skeletonList} aria-busy="true" aria-label="Đang tải lịch sử học tập">

          <div className={styles.skeletonCard} />

          <div className={styles.skeletonCard} />

          <div className={styles.skeletonCard} />

        </div>

      ) : activeTab === "exams" ? (

        <>

          <ExamAttemptHistoryList items={examAttempts} />

          {examHasNext ? (

            <div className={styles.loadMoreWrap}>

              <Button

                type="button"

                look="outline"

                size="sm"

                disabled={loadingMore}

                onClick={handleLoadMoreExams}

              >

                {loadingMore ? "Đang tải..." : "Xem thêm"}

              </Button>

            </div>

          ) : null}

        </>

      ) : (

        <>

          <PracticeSubmissionHistoryList items={practiceSubmissions} />

          {practiceHasNext ? (

            <div className={styles.loadMoreWrap}>

              <Button

                type="button"

                look="outline"

                size="sm"

                disabled={loadingMore}

                onClick={handleLoadMorePractice}

              >

                {loadingMore ? "Đang tải..." : "Xem thêm"}

              </Button>

            </div>

          ) : null}

        </>

      )}

    </section>

  );

}



export default LearningActivitySection;


