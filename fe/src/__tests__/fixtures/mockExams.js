export const mockFinalExamDto = {
  id: "exam-fe-prf192-001",
  apiId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  paperCode: "FE-PRF192-SU2026-1",
  title: "FE-PRF192-SU2026-1",
  subjectCode: "PRF192",
  subjectName: "Programming Fundamentals",
  typeKey: "final",
  major: "SE",
  description: "Đề ôn tập cuối kỳ PRF192",
};

export const mockPracticeExamDto = {
  id: "exam-pe-swe201-002",
  paperCode: "PE-SWE201c-SU2026-2",
  title: "PE-SWE201c-SU2026-2",
  subjectCode: "SWE201c",
  subjectName: "Software Engineering",
  typeKey: "practice",
  major: "SE",
};

export const mockRevisionExamDto = {
  id: "exam-rev-003",
  revisionOfExamId: "exam-fe-prf192-001",
  paperCode: "FE-PRF192-SU2026-1-REV-a1b2c3",
  title: "FE-PRF192-SU2026-1-REV-a1b2c3",
  revisionSourcePaperCode: "FE-PRF192-SU2026-1",
  revisionSourceSubjectCode: "PRF192",
  subjectCode: "PRF192",
  typeKey: "final",
};

export const mockLegacyTitleExam = {
  id: "exam-legacy-004",
  title: "Môn CSD203 - Cấu trúc dữ liệu",
  subjectCode: "CSD203",
  typeKey: "final",
};

export const mockBareSubjectExam = {
  id: "exam-bare-005",
  code: "AIG301",
  title: "AIG301",
  typeKey: "final",
};

export const mockExistingPaperIdentifiers = [
  "FE-PRF192-SU2026-1",
  "FE-PRF192-SU2026-2",
  "PE-SWE201c-SU2026-1",
  "PRF192_SU26",
  "FE-LEGACY-SU2026",
];
