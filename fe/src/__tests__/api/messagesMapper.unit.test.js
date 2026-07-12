import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendMessageIfNew,
  buildInitials,
  getMessagePreview,
  mapConversationListItem,
  mapMessageItem,
  mapMessages,
} from "@/api/messagesMapper";
import {
  mockConversationDto,
  mockImageMessageDto,
  mockMessageDto,
} from "../fixtures/mockApiDtos";
import { mockPremiumStudent } from "../fixtures/mockUsers";

describe("messagesMapper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("buildInitials", () => {
    it("uses first and last word initials for multi-word names", () => {
      expect(buildInitials("Nguyễn Văn An")).toBe("NA");
    });

    it("uses first character for single-word names", () => {
      expect(buildInitials("Demo")).toBe("D");
    });

    it('returns "?" only for completely empty trimmed names', () => {
      expect(buildInitials("")).toBe("?");
      expect(buildInitials("   ").charAt(0)).toBe(" ");
    });
  });

  describe("mapConversationListItem", () => {
    it("maps conversation with presence and preview", () => {
      const conv = mapConversationListItem(mockConversationDto);
      expect(conv.name).toBe("Nguyễn Văn A");
      expect(conv.initials).toBe("NA");
      expect(conv.unread).toBe(2);
      expect(conv.online).toBe(true);
      expect(conv.presenceTier).toBe("online");
    });

    it("falls back to username when full name is missing", () => {
      const conv = mapConversationListItem({
        ...mockConversationDto,
        otherFullName: "",
      });
      expect(conv.name).toBe("peer_student");
    });
  });

  describe("mapMessageItem", () => {
    it("marks received messages from other users", () => {
      const message = mapMessageItem(mockMessageDto, {
        currentUserId: mockPremiumStudent.id,
      });
      expect(message.type).toBe("received");
      expect(message.text).toBe("Chào bạn!");
      expect(message.previewText).toBe("Chào bạn!");
    });

    it("marks sent messages for current user", () => {
      const message = mapMessageItem(
        { ...mockMessageDto, senderId: mockPremiumStudent.id },
        { currentUserId: mockPremiumStudent.id },
      );
      expect(message.type).toBe("sent");
    });

    it("maps image attachment preview", () => {
      const message = mapMessageItem(mockImageMessageDto, {
        currentUserId: mockPremiumStudent.id,
      });
      expect(message.messageType).toBe("image");
      expect(message.previewText).toBe("[Ảnh]");
      expect(message.attachmentUrl).toContain("photo.jpg");
    });

    it("supports PascalCase API fields", () => {
      const message = mapMessageItem(
        {
          Id: "msg-pascal",
          SenderId: "user-1",
          Content: "Hello",
          SentAt: "2026-07-10T11:00:00Z",
          MessageType: "Text",
        },
        { currentUserId: "user-2" },
      );
      expect(message.id).toBe("msg-pascal");
      expect(message.type).toBe("received");
    });
  });

  describe("getMessagePreview", () => {
    it("formats file attachment preview with filename", () => {
      const preview = getMessagePreview({
        messageType: "file",
        text: "",
        attachmentFileName: "report.pdf",
      });
      expect(preview).toBe("[Tệp] report.pdf");
    });
  });

  describe("appendMessageIfNew", () => {
    it("appends only when message id is new", () => {
      const existing = [{ id: "m1", text: "a" }];
      const appended = appendMessageIfNew(existing, { id: "m2", text: "b" });
      expect(appended).toHaveLength(2);
      expect(appendMessageIfNew(existing, { id: "m1", text: "dup" })).toBe(existing);
    });

    it("returns original array when message has no id", () => {
      const existing = [{ id: "m1" }];
      expect(appendMessageIfNew(existing, { text: "no id" })).toBe(existing);
    });
  });

  describe("mapMessages", () => {
    it("maps batch of message DTOs", () => {
      const messages = mapMessages([mockMessageDto, mockImageMessageDto], {
        currentUserId: mockPremiumStudent.id,
      });
      expect(messages).toHaveLength(2);
    });
  });
});
