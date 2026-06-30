import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSubjectOptionsForSemester,
  PRACTICE_SEMESTER_OPTIONS,
} from "@/features/moderator/practiceExams/practiceExamData";
import { loadReviewCourses, REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import * as subjectsApi from "@/api/subjectsApi";
import { findCourseMajor } from "@/utils/examDisplay";
import {
  generateExamPaperCode,
  loadExistingExamPaperIdentifiers,
} from "@/utils/examPaperCode";
import { parseSemesterNumberFromLabel } from "@/features/moderator/practiceExams/practiceExamData";

/**
 * Shared semester / subject catalog + auto exam paper code for final-exam wizards.
 */
export function useFinalExamMetadata({
  semesterLabel,
  subjectCode,
  subjectName = "",
  examCode,
  isEditMode = false,
  examType = "final",
  onPatch,
}) {
  const [reviewCourses, setReviewCourses] = useState(REVIEW_COURSES);
  const [existingPaperCodes, setExistingPaperCodes] = useState([]);
  const [examCodeManuallyEdited, setExamCodeManuallyEdited] = useState(false);
  const onPatchRef = useRef(onPatch);
  onPatchRef.current = onPatch;

  const subjectOptions = useMemo(
    () => getSubjectOptionsForSemester(semesterLabel, reviewCourses),
    [semesterLabel, reviewCourses],
  );

  useEffect(() => {
    let cancelled = false;
    loadReviewCourses()
      .then((courses) => {
        if (!cancelled) setReviewCourses(courses);
      })
      .catch(() => {
        if (!cancelled) setReviewCourses(REVIEW_COURSES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadExistingExamPaperIdentifiers()
      .then((codes) => {
        if (!cancelled) setExistingPaperCodes(codes);
      })
      .catch(() => {
        if (!cancelled) setExistingPaperCodes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditMode || examCodeManuallyEdited) return;
    if (!subjectCode?.trim()) {
      if (examCode) {
        onPatchRef.current({ examCode: "" });
      }
      return;
    }

    const nextCode = generateExamPaperCode(examType, subjectCode, existingPaperCodes);
    if (nextCode && nextCode !== examCode) {
      onPatchRef.current({ examCode: nextCode });
    }
  }, [
    subjectCode,
    existingPaperCodes,
    isEditMode,
    examCodeManuallyEdited,
    examType,
    examCode,
  ]);

  useEffect(() => {
    if (!subjectCode?.trim() || subjectName?.trim()) {
      return undefined;
    }

    const selected = subjectOptions.find((item) => item.code === subjectCode);
    if (selected?.name?.trim()) {
      onPatchRef.current({ subjectName: selected.name.trim() });
      return undefined;
    }

    let cancelled = false;
    subjectsApi
      .getSubject(subjectCode)
      .then((dto) => {
        if (cancelled) return;
        const name = String(dto?.name ?? dto?.Name ?? "").trim();
        if (name) {
          onPatchRef.current({ subjectName: name });
        }
      })
      .catch(() => {
        /* optional API lookup */
      });

    return () => {
      cancelled = true;
    };
  }, [subjectCode, subjectName, subjectOptions]);

  function handleSemesterChange(event) {
    const nextLabel = event.target.value;
    setExamCodeManuallyEdited(false);
    onPatchRef.current({
      semesterLabel: nextLabel,
      subjectCode: "",
      subjectName: "",
      major: "",
      examCode: "",
    });
  }

  function handleSubjectChange(event) {
    const code = event.target.value;
    setExamCodeManuallyEdited(false);
    const semesterNumber = parseSemesterNumberFromLabel(semesterLabel);
    const selected = subjectOptions.find((item) => item.code === code);
    const major =
      selected?.major ??
      (code ? findCourseMajor(code, semesterNumber, reviewCourses) ?? "SE" : "");
    const resolvedName = String(selected?.name ?? "").trim();

    onPatchRef.current({
      subjectCode: code,
      subjectName: resolvedName,
      major,
    });

    if (!resolvedName && code) {
      subjectsApi
        .getSubject(code)
        .then((dto) => {
          const name = String(dto?.name ?? dto?.Name ?? "").trim();
          if (name) {
            onPatchRef.current({ subjectName: name });
          }
        })
        .catch(() => {
          /* ignore missing subject */
        });
    }
  }

  function handleExamCodeChange(event) {
    setExamCodeManuallyEdited(true);
    onPatchRef.current({ examCode: event.target.value });
  }

  return {
    semesterOptions: PRACTICE_SEMESTER_OPTIONS,
    subjectOptions,
    examCodeManuallyEdited,
    setExamCodeManuallyEdited,
    handleSemesterChange,
    handleSubjectChange,
    handleExamCodeChange,
  };
}
