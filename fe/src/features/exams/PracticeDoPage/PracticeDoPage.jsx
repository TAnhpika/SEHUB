import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faCloudArrowUp,
  faFile,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { buildExamQuestions } from "@/features/exams/examDetailData";
import {
  formatFileSize,
  getOrCreatePracticeSession,
  getPracticeSession,
  getPracticeTimeRemaining,
  isValidGithubUrl,
  PRACTICE_DURATION_MS,
  savePracticeSubmission,
  submitPracticeSession,
} from "@/features/exams/practiceSession";
import { formatDuration } from "@/features/exams/examSession";
import {
  getExamById,
  SUBJECT_DETAIL_CONFIG,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import styles from "./PracticeDoPage.module.css";

const ACCEPTED_TYPES = ".zip,.rar,.pdf,.doc,.docx,.c,.cpp,.java,.py,.js,.ts";
const MAX_FILE_MB = 25;

function PracticeDoPage() {
  const { courseCode, examId, questionIndex } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const config = SUBJECT_DETAIL_CONFIG.practice;
  const decodedExamId = decodeURIComponent(examId ?? "");
  const questionNumber = Math.max(1, Number(questionIndex) || 1);

  const exam = useMemo(
    () => getExamById(courseCode, decodedExamId, "practice"),
    [courseCode, decodedExamId],
  );

  const questions = useMemo(
    () => (exam ? buildExamQuestions(exam.questionCount, "practice") : []),
    [exam],
  );

  const question = questions[questionNumber - 1];

  const [submitMode, setSubmitMode] = useState("file");
  const [githubUrl, setGithubUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(PRACTICE_DURATION_MS);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    if (!exam || !question) return;

    const existing = getPracticeSession(exam.id, question.id);
    if (existing?.submitted) {
      navigate(
        `${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}/result/${questionNumber}`,
        { replace: true },
      );
      return;
    }

    const session = existing ?? getOrCreatePracticeSession(exam.id, question.id);
    setStartedAt(session.startedAt ?? Date.now());

    if (session.submission?.type === "github") {
      setSubmitMode("github");
      setGithubUrl(session.submission.value ?? "");
    } else if (session.submission?.type === "file") {
      setSubmitMode("file");
      setUploadedFile({
        name: session.submission.fileName,
        sizeLabel: session.submission.fileSizeLabel,
      });
    }
  }, [exam, question, questionNumber, config.detailBase, navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeRemainingMs(Math.max(0, PRACTICE_DURATION_MS - (Date.now() - startedAt)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!question) {
    return (
      <Navigate
        to={`${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}`}
        replace
      />
    );
  }

  const detailPath = `${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}`;
  const resultPath = `${detailPath}/result/${questionNumber}`;
  const isExpired = timeRemainingMs <= 0;
  const hasValidFile = Boolean(uploadedFile?.name);
  const hasValidGithub = isValidGithubUrl(githubUrl);
  const canSubmit =
    !isExpired && (submitMode === "file" ? hasValidFile : hasValidGithub);

  function persistSubmission(nextSubmission) {
    savePracticeSubmission(exam.id, question.id, nextSubmission);
  }

  function handleFileSelect(fileList) {
    const file = fileList?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showToast(`File không được vượt quá ${MAX_FILE_MB}MB.`);
      return;
    }

    const nextFile = {
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    };
    setUploadedFile(nextFile);
    persistSubmission({
      type: "file",
      fileName: file.name,
      fileSizeLabel: nextFile.sizeLabel,
    });
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files);
  }

  function handleGithubChange(value) {
    setGithubUrl(value);
    if (isValidGithubUrl(value)) {
      persistSubmission({ type: "github", value: value.trim() });
    }
  }

  function handleSubmit() {
    if (isExpired) {
      showToast("Đã hết thời gian làm bài (30 phút).");
      return;
    }

    const submission =
      submitMode === "file"
        ? {
            type: "file",
            fileName: uploadedFile.name,
            fileSizeLabel: uploadedFile.sizeLabel,
          }
        : {
            type: "github",
            value: githubUrl.trim(),
          };

    if (submitMode === "file" && !hasValidFile) {
      showToast("Vui lòng chọn file để nộp bài.");
      return;
    }

    if (submitMode === "github" && !hasValidGithub) {
      showToast("Vui lòng nhập link GitHub hợp lệ.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn nộp bài thực hành này?")) {
      return;
    }

    submitPracticeSession(exam.id, question.id, question, submission);
    showToast("Đã nộp bài thành công.");
    navigate(resultPath);
  }

  return (
    <div className={styles.page}>
      <Link to={detailPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại đề thi
      </Link>

      <section className={styles.panel} aria-label="Làm bài thực hành">
        <header className={styles.header}>
          <div className={styles["header-main"]}>
            <h1 className={styles["exam-code"]}>{exam.id}</h1>
            <p className={styles.meta}>
              Bài thực hành {questionNumber} / {exam.questionCount} · Thời gian mỗi bài: 30 phút
            </p>
          </div>

          <div className={styles["header-actions"]}>
            <span
              className={`${styles.timer} ${isExpired ? styles["timer-expired"] : ""}`}
              aria-live="polite"
            >
              <FontAwesomeIcon icon={faClock} />
              {isExpired ? "Hết giờ" : formatDuration(getPracticeTimeRemaining({ startedAt }))}
            </span>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
              <FontAwesomeIcon icon={faPaperPlane} />
              Nộp bài
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          <article className={styles.question}>
            <p className={styles["question-label"]}>Bài thực hành {questionNumber}</p>
            <p className={styles["question-text"]}>{question.text}</p>
            <p className={styles.hint}>
              Hoàn thành bài và nộp bằng file hoặc link GitHub public repo trong vòng 30 phút.
            </p>
          </article>

          <section className={styles.submit} aria-label="Nộp bài thực hành">
            <div className={styles["submit-tabs"]}>
              <button
                type="button"
                className={`${styles.tab} ${submitMode === "file" ? styles["tab-active"] : ""}`}
                onClick={() => setSubmitMode("file")}
              >
                <FontAwesomeIcon icon={faCloudArrowUp} />
                Nộp file
              </button>
              <button
                type="button"
                className={`${styles.tab} ${submitMode === "github" ? styles["tab-active"] : ""}`}
                onClick={() => setSubmitMode("github")}
              >
                <FontAwesomeIcon icon={faGithub} />
                Nộp GitHub
              </button>
            </div>

            {submitMode === "file" ? (
              <div className={styles["file-panel"]}>
                <div
                  className={`${styles.dropzone} ${isDragging ? styles["dropzone-active"] : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <FontAwesomeIcon icon={faCloudArrowUp} className={styles["drop-icon"]} />
                  <p className={styles["drop-text"]}>
                    Kéo thả file vào đây hoặc{" "}
                    <button
                      type="button"
                      className={styles.browse}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      duyệt file từ máy tính
                    </button>
                  </p>
                  <p className={styles.formats}>ZIP, RAR, PDF, DOCX, source code · Tối đa {MAX_FILE_MB}MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={styles["file-input"]}
                    accept={ACCEPTED_TYPES}
                    onChange={(event) => handleFileSelect(event.target.files)}
                  />
                </div>

                {uploadedFile && (
                  <div className={styles["file-preview"]}>
                    <FontAwesomeIcon icon={faFile} className={styles["file-preview-icon"]} />
                    <div className={styles["file-preview-meta"]}>
                      <p className={styles["file-preview-name"]}>{uploadedFile.name}</p>
                      <p className={styles["file-preview-size"]}>{uploadedFile.sizeLabel}</p>
                    </div>
                    <button
                      type="button"
                      className={styles["file-remove"]}
                      onClick={() => {
                        setUploadedFile(null);
                        persistSubmission(null);
                      }}
                      aria-label="Xóa file"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles["github-panel"]}>
                <label className={styles["github-label"]} htmlFor="practice-github-url">
                  Link GitHub public repo
                </label>
                <div className={styles["github-input-wrap"]}>
                  <FontAwesomeIcon icon={faGithub} className={styles["github-icon"]} />
                  <input
                    id="practice-github-url"
                    type="url"
                    className={styles["github-input"]}
                    placeholder="https://github.com/username/repository"
                    value={githubUrl}
                    onChange={(event) => handleGithubChange(event.target.value)}
                  />
                </div>
                <p className={styles["github-hint"]}>
                  Repo phải public và có README mô tả cách chạy dự án.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default PracticeDoPage;
