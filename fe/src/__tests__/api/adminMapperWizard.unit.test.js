import { describe, expect, it } from "vitest";
import {
  mapAdminExamDetail,
  mapAdminExamFormToCreateRequest,
  mapAdminExamFormToUpdateRequest,
  mapApprovedExamFromApi,
  mapExamDetailToWizard,
  mapFinalExamWizardToCreateRequest,
  mapFinalExamWizardToResubmitRequest,
  mapFinalExamWizardToUpdateRequest,
  mapMockOcrQuestionsToCreateItems,
  mapPendingExamFromCreate,
  mapPendingExamListItem,
  mapPracticeExamDetailToForm,
  mapPracticeExamFormToCreateRequest,
  mapPracticeExamFormToResubmitRequest,
  mapRejectedExamFromApi,
  mapWizardQuestionsToCreateItems,
} from "@/api/adminMapper";
import { mockAdminExamDto } from "../fixtures/mockAdminDtos";
import {
  mockApprovedExamDto,
  mockExamDetailForWizard,
  mockOcrQuestions,
  mockPendingExamDto,
  mockPracticeExamDetailDto,
  mockRejectedExamDto,
  mockWizardEmptyQuestion,
  mockWizardExamInfo,
  mockWizardMultiQuestion,
  mockWizardSingleQuestion,
} from "../fixtures/mockWizardData";

describe("adminMapper (wizard & pending exams)", () => {
  describe("mapWizardQuestionsToCreateItems", () => {
    it("maps valid single-choice question with correct option ids", () => {
      const items = mapWizardQuestionsToCreateItems([
        mockWizardSingleQuestion,
        mockWizardEmptyQuestion,
      ]);

      expect(items).toHaveLength(1);
      expect(items[0].questionType).toBe("SingleChoice");
      expect(items[0].content).toBe("Câu hỏi single choice?");
      expect(items[0].options).toHaveLength(4);
      expect(items[0].correctOptionIds).toHaveLength(1);
      expect(items[0].correctOptionId).toBe(items[0].correctOptionIds[0]);
      expect(items[0].requiredSelectCount).toBeNull();
    });

    it("maps multi-select question with requiredSelectCount", () => {
      const items = mapWizardQuestionsToCreateItems([mockWizardMultiQuestion]);

      expect(items[0].questionType).toBe("MultiSelect");
      expect(items[0].correctOptionIds).toHaveLength(2);
      expect(items[0].requiredSelectCount).toBe(2);
    });

    it("filters questions without content or answers", () => {
      expect(mapWizardQuestionsToCreateItems([mockWizardEmptyQuestion])).toEqual([]);
      expect(mapWizardQuestionsToCreateItems([])).toEqual([]);
    });

    it("throws when questions input is null", () => {
      expect(() => mapWizardQuestionsToCreateItems(null)).toThrow();
    });
  });

  describe("mapFinalExamWizardToCreateRequest", () => {
    it("builds final exam create payload with parsed semester and questions", () => {
      const payload = mapFinalExamWizardToCreateRequest(mockWizardExamInfo, [
        mockWizardSingleQuestion,
      ]);

      expect(payload.subjectCode).toBe("PRF192");
      expect(payload.paperCode).toBe("FE-PRF192-SU2026-1");
      expect(payload.examType).toBe("Final");
      expect(payload.description).toContain("90 phút");
      expect(payload.questions).toHaveLength(1);
    });

    it("falls back paperCode when examCode is empty", () => {
      const payload = mapFinalExamWizardToCreateRequest(
        { ...mockWizardExamInfo, examCode: "" },
        [],
      );
      expect(payload.paperCode).toBe("PRF192 — Cuối kỳ");
    });
  });

  describe("mapFinalExamWizardToUpdateRequest", () => {
    it("maps update payload without revision flags", () => {
      const payload = mapFinalExamWizardToUpdateRequest(mockWizardExamInfo, [
        mockWizardSingleQuestion,
      ]);
      expect(payload.examType).toBe("Final");
      expect(payload.questions).toHaveLength(1);
    });
  });

  describe("mapFinalExamWizardToResubmitRequest", () => {
    it("uses exam code for non-revision resubmit", () => {
      const payload = mapFinalExamWizardToResubmitRequest(mockWizardExamInfo, [
        mockWizardSingleQuestion,
      ]);
      expect(payload.paperCode).toBe("FE-PRF192-SU2026-1");
      expect(payload.questions).toHaveLength(1);
    });

    it("resolves revision title when isRevision is true", () => {
      const payload = mapFinalExamWizardToResubmitRequest(
        {
          ...mockWizardExamInfo,
          revisionSourceCode: "PRF192",
          revisionSourceTitle: "FE-PRF192-SU2026-1",
          examCode: "FE-PRF192-SU2026-1-REV-abc",
        },
        [mockWizardSingleQuestion],
        { isRevision: true },
      );
      expect(payload.paperCode).toBeTruthy();
      expect(payload.paperCode).not.toBe("FE-PRF192-SU2026-1");
    });
  });

  describe("mapExamDetailToWizard", () => {
    it("maps exam detail dto to wizard state with duration and questions", () => {
      const wizard = mapExamDetailToWizard(mockExamDetailForWizard);

      expect(wizard.examInfo.subjectCode).toBe("PRF192");
      expect(wizard.examInfo.durationMinutes).toBe(75);
      expect(wizard.examInfo.semesterLabel).toBe("Học kỳ 3");
      expect(wizard.questions).toHaveLength(1);
      expect(wizard.canResubmit).toBe(true);
      expect(wizard.isContentLocked).toBe(false);
    });

    it("parses default duration when description has no minutes", () => {
      const wizard = mapExamDetailToWizard({
        ...mockExamDetailForWizard,
        description: "Không có thời gian",
        questions: [],
      });
      expect(wizard.examInfo.durationMinutes).toBe(60);
      expect(wizard.questions).toBeUndefined();
    });
  });

  describe("mapAdminExamFormToCreateRequest", () => {
    it("maps final exam form", () => {
      const payload = mapAdminExamFormToCreateRequest({
        code: "PRF192",
        title: "FE-PRF192-SU2026-1",
        typeKey: "final",
        description: "Đề cuối kỳ",
      });
      expect(payload.examType).toBe("Final");
      expect(payload.description).toBe("Đề cuối kỳ");
    });

    it("appends default github guide for practice exams", () => {
      const payload = mapAdminExamFormToCreateRequest({
        code: "SWE201c",
        title: "PE-SWE201c-SU2026-1",
        typeKey: "practice",
        description: "Mô tả",
      });
      expect(payload.examType).toBe("Practice");
      expect(payload.description).toContain("GitHub");
      expect(payload.description).toContain("Mô tả");
    });
  });

  describe("mapAdminExamFormToUpdateRequest", () => {
    it("includes questions only when provided as array", () => {
      const withoutQuestions = mapAdminExamFormToUpdateRequest({
        code: "PRF192",
        title: "FE-PRF192-SU2026-1",
        typeKey: "final",
        description: "Cập nhật",
      });
      expect(withoutQuestions.questions).toBeUndefined();

      const withQuestions = mapAdminExamFormToUpdateRequest(
        { code: "PRF192", title: "FE", typeKey: "final", description: "" },
        { questions: [{ orderIndex: 1 }] },
      );
      expect(withQuestions.questions).toHaveLength(1);
    });
  });

  describe("mapPracticeExamFormToCreateRequest", () => {
    it("maps practice form with pin flag and github guide", () => {
      const payload = mapPracticeExamFormToCreateRequest({
        subjectCode: "SWE201c",
        title: "PE-SWE201c-SU2026-1",
        major: "SE",
        semester: "Học kỳ 2",
        description: "Đề thực hành",
        pinExam: true,
      });
      expect(payload.examType).toBe("Practice");
      expect(payload.isPinned).toBe(true);
      expect(payload.questions).toEqual([]);
      expect(payload.description).toContain("GitHub");
    });
  });

  describe("mapPracticeExamFormToResubmitRequest", () => {
    it("trims title for normal resubmit", () => {
      const payload = mapPracticeExamFormToResubmitRequest({
        title: "  PE-SWE201c-SU2026-1  ",
        description: "  Mô tả  ",
      });
      expect(payload.paperCode).toBe("PE-SWE201c-SU2026-1");
      expect(payload.description).toBe("Mô tả");
    });

    it("resolves revision paper code when isRevision", () => {
      const payload = mapPracticeExamFormToResubmitRequest(
        {
          title: "PE-SWE201c-SU2026-1-REV-x",
          revisionSourceCode: "SWE201c",
          revisionSourceTitle: "PE-SWE201c-SU2026-1",
          description: "",
        },
        { isRevision: true },
      );
      expect(payload.paperCode).toBeTruthy();
      expect(payload.paperCode).not.toBe("PE-SWE201c-SU2026-1-REV-x");
    });
  });

  describe("mapPracticeExamDetailToForm", () => {
    it("maps practice detail to editable form with attachments", () => {
      const form = mapPracticeExamDetailToForm(mockPracticeExamDetailDto);

      expect(form.examId).toBe("practice-detail-001");
      expect(form.subjectCode).toBe("SWE201c");
      expect(form.semester).toBe("Học kỳ 2");
      expect(form.description).toBe("Mô tả ngắn");
      expect(form.attachments).toHaveLength(1);
      expect(form.attachments[0].type).toBe("zip");
      expect(form.attachments[0].sizeLabel).toBe("5.0 MB");
    });
  });

  describe("mapPendingExamListItem", () => {
    it("maps pending exam with file name and submitter metadata", () => {
      const item = mapPendingExamListItem(mockPendingExamDto, { urgent: true });

      expect(item.typeKey).toBe("practice");
      expect(item.submittedBy).toBe("demo_student");
      expect(item.fileName).toBe("de-thuc-hanh.zip");
      expect(item.urgent).toBe(true);
      expect(item.githubGuide).toContain("GitHub");
    });

    it("uses meta overrides when provided", () => {
      const item = mapPendingExamListItem(mockPendingExamDto, {
        submittedBy: "override_user",
        fileName: "custom.pdf",
        pinExam: true,
      });
      expect(item.submittedBy).toBe("override_user");
      expect(item.fileName).toBe("custom.pdf");
      expect(item.pinExam).toBe(true);
    });
  });

  describe("mapPendingExamFromCreate", () => {
    it("delegates to mapPendingExamListItem with create payload meta", () => {
      const item = mapPendingExamFromCreate(mockPendingExamDto, {
        submittedBy: "creator",
        fileName: "upload.zip",
        pinExam: false,
      });
      expect(item.submittedBy).toBe("creator");
      expect(item.fileName).toBe("upload.zip");
    });
  });

  describe("mapRejectedExamFromApi", () => {
    it("maps rejection reason label and full detail string", () => {
      const item = mapRejectedExamFromApi(mockRejectedExamDto);

      expect(item.rejectReasonId).toBe("duplicate");
      expect(item.rejectReasonLabel).toContain("Trùng đề");
      expect(item.rejectReasonDetail).toBe("Trùng SHA với đề đã publish");
      expect(item.rejectReasonFull).toContain("—");
      expect(item.rejectedAt).not.toBe("—");
    });

    it("handles unknown reason code", () => {
      const item = mapRejectedExamFromApi({
        ...mockRejectedExamDto,
        rejectionReasonCode: "custom_code",
        rejectionReasonDetail: "",
      });
      expect(item.rejectReasonLabel).toBe("custom_code");
      expect(item.rejectReasonFull).toBe("custom_code");
    });
  });

  describe("mapApprovedExamFromApi", () => {
    it("maps approved exam with published id and date", () => {
      const item = mapApprovedExamFromApi(mockApprovedExamDto);
      expect(item.publishedExamId).toBe("approved-001");
      expect(item.approvedAt).not.toBe("—");
    });
  });

  describe("mapAdminExamDetail", () => {
    it("extends list item with mapped review questions", () => {
      const detail = mapAdminExamDetail({
        ...mockAdminExamDto,
        questions: [
          {
            orderIndex: 1,
            content: "Q1",
            questionType: "SingleChoice",
            options: [
              { id: "a", label: "A", text: "A" },
              { id: "b", label: "B", text: "B" },
            ],
            correctOptionIds: ["a"],
          },
        ],
      });
      expect(detail.questions).toHaveLength(1);
      expect(detail.questionsData[0].isMulti).toBe(false);
    });
  });

  describe("mapMockOcrQuestionsToCreateItems", () => {
    it("normalizes OCR questions with string and object options", () => {
      const items = mapMockOcrQuestionsToCreateItems(mockOcrQuestions);

      expect(items).toHaveLength(2);
      expect(items[0].questionType).toBe("SingleChoice");
      expect(items[0].options[0].label).toBe("A");
      expect(items[1].questionType).toBe("MultiSelect");
      expect(items[1].correctOptionIds).toHaveLength(2);
    });

    it("returns empty array for null input", () => {
      expect(mapMockOcrQuestionsToCreateItems(null)).toEqual([]);
    });
  });
});
