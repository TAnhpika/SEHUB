import { useFinalExamMetadata } from "@/features/exams/finalExam/useFinalExamMetadata";
import styles from "./FinalExamInfoFields.module.css";

function FinalExamInfoFields({
  value,
  onChange,
  isEditMode = false,
  showQuestionCount = true,
  questionCountInput,
  onQuestionCountInputChange,
  examType = "final",
}) {
  const {
    semesterOptions,
    subjectOptions,
    termSeasonOptions,
    academicYearOptions,
    handleSemesterChange,
    handleSubjectChange,
    handleTermSeasonChange,
    handleAcademicYearChange,
  } = useFinalExamMetadata({
    semesterLabel: value.semesterLabel,
    subjectCode: value.subjectCode,
    subjectName: value.subjectName,
    termSeason: value.termSeason,
    academicYear: value.academicYear,
    examCode: value.examCode,
    isEditMode,
    examType,
    onPatch: onChange,
  });

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>
            Học kỳ <span className={styles.required}>*</span>
          </span>
          <select
            className={styles.input}
            value={value.semesterLabel}
            required
            disabled={isEditMode}
            onChange={handleSemesterChange}
          >
            <option value="">Chọn học kỳ</option>
            {semesterOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Mã môn học <span className={styles.required}>*</span>
          </span>
          <select
            className={styles.input}
            value={value.subjectCode}
            required
            disabled={!value.semesterLabel || isEditMode}
            onChange={handleSubjectChange}
          >
            <option value="">
              {value.semesterLabel ? "Chọn môn học" : "Chọn học kỳ trước"}
            </option>
            {subjectOptions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name ? `${item.code} — ${item.name}` : item.code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Tên môn học</span>
        <input
          type="text"
          className={styles.input}
          value={value.subjectName}
          readOnly
          placeholder="Chọn mã môn để tự điền"
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>
            Kỳ học <span className={styles.required}>*</span>
          </span>
          <select
            className={styles.input}
            value={value.termSeason ?? ""}
            required
            disabled={isEditMode}
            onChange={handleTermSeasonChange}
          >
            <option value="">Chọn kỳ</option>
            {termSeasonOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Năm học <span className={styles.required}>*</span>
          </span>
          <select
            className={styles.input}
            value={value.academicYear ?? ""}
            required
            disabled={isEditMode}
            onChange={handleAcademicYearChange}
          >
            <option value="">Chọn năm</option>
            {academicYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>
            Mã đề thi <span className={styles.required}>*</span>
          </span>
          <input
            type="text"
            className={styles.input}
            value={value.examCode}
            readOnly
            placeholder="Tự động sinh khi chọn môn, kỳ và năm học"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Thời gian làm bài (phút)</span>
          <input
            type="number"
            min={15}
            max={180}
            className={styles.input}
            value={value.durationMinutes}
            onChange={(event) =>
              onChange({ durationMinutes: Number(event.target.value) || 60 })
            }
          />
        </label>

        {showQuestionCount ? (
          <label className={styles.field}>
            <span className={styles.label}>Số câu hỏi</span>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              value={questionCountInput}
              onChange={(event) => onQuestionCountInputChange?.(event.target.value)}
              placeholder="VD: 50"
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}

export default FinalExamInfoFields;
