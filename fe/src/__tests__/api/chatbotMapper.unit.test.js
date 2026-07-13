import { describe, expect, it } from "vitest";
import {
  mapAdminChatbotConversationDto,
  mapChatbotConversationDto,
  mapChatbotKnowledgeEntryDto,
  mapChatbotMessageDto,
  mapChatbotReplyResponse,
  mapChatbotSettingsDto,
} from "@/api/chatbotMapper";
import {
  mockChatbotConversationDto,
  mockChatbotMessageDto,
  mockChatbotReplyDto,
  mockChatbotSettingsDto,
} from "../fixtures/mockExtendedDtos";

describe("chatbotMapper", () => {
  describe("mapChatbotSettingsDto", () => {
    it("maps enabled chatbot settings", () => {
      const settings = mapChatbotSettingsDto(mockChatbotSettingsDto);
      expect(settings?.isEnabled).toBe(true);
      expect(settings?.welcomeMessage).toContain("Xin chào");
    });

    it("returns null for null dto", () => {
      expect(mapChatbotSettingsDto(null)).toBe(null);
    });
  });

  describe("mapChatbotConversationDto", () => {
    it("maps conversation metadata", () => {
      const conv = mapChatbotConversationDto(mockChatbotConversationDto);
      expect(conv?.id).toBe("conv-bot-001");
      expect(conv?.title).toBe("Hỏi về PRF192");
    });
  });

  describe("mapChatbotMessageDto", () => {
    it("maps message role and text", () => {
      const msg = mapChatbotMessageDto(mockChatbotMessageDto);
      expect(msg?.role).toBe("assistant");
      expect(msg?.text).toContain("OOP");
    });

    it("defaults role to user when missing", () => {
      expect(mapChatbotMessageDto({ id: "m1", text: "Hi" })?.role).toBe("user");
    });
  });

  describe("mapChatbotReplyResponse", () => {
    it("maps reply with nested messages", () => {
      const reply = mapChatbotReplyResponse(mockChatbotReplyDto);
      expect(reply?.conversationId).toBe("conv-bot-001");
      expect(reply?.tokensUsed).toBe(15);
      expect(reply?.messages).toHaveLength(1);
    });

    it("returns empty messages array when not provided", () => {
      const reply = mapChatbotReplyResponse({ reply: "OK" });
      expect(reply?.messages).toEqual([]);
    });
  });

  describe("mapChatbotKnowledgeEntryDto", () => {
    it("maps knowledge base entry fields", () => {
      const entry = mapChatbotKnowledgeEntryDto({
        id: "kb-1",
        title: "Premium FAQ",
        content: "Gói Premium bao gồm...",
        tags: "premium,faq",
        isActive: true,
        sortOrder: 2,
      });
      expect(entry?.isActive).toBe(true);
      expect(entry?.sortOrder).toBe(2);
    });
  });

  describe("mapAdminChatbotConversationDto", () => {
    it("maps admin conversation list item", () => {
      const item = mapAdminChatbotConversationDto({
        id: "conv-1",
        userId: "user-1",
        title: "Support",
        createdAt: "2026-07-01T00:00:00Z",
        messageCount: 12,
      });
      expect(item?.messageCount).toBe(12);
      expect(item?.userId).toBe("user-1");
    });
  });
});
