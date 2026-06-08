import { getAiExplanation } from "@/features/exams/examAiExplainData";

/**
 * Phản hồi mock cho chat AI Premium — sẽ thay bằng API ChatGPT sau.
 */
export function generateAiChatReply(question, userMessage) {
  const text = userMessage.trim().toLowerCase();
  const explanation = getAiExplanation(question);

  if (!text) {
    return "Bạn muốn hỏi thêm phần nào của câu hỏi này?";
  }

  if (text.includes("đáp án") || text.includes("dap an") || text.includes("answer")) {
    if (question?.correctAnswer) {
      return `Đáp án đúng là ${question.correctAnswer}. ${explanation.intro}`;
    }
    return explanation.intro;
  }

  if (text.includes("tại sao") || text.includes("tai sao") || text.includes("why")) {
    const bullet = explanation.bullets[0];
    return bullet
      ? `Vì ${bullet.label}: ${bullet.text}`
      : explanation.intro;
  }

  if (text.includes("gợi ý") || text.includes("goi y") || text.includes("hint")) {
    return `Gợi ý: ${explanation.note || explanation.intro}`;
  }

  if (text.includes("loại trừ") || text.includes("sai")) {
    const wrongOptions = question?.options?.filter(
      (option) => option.key !== question.correctAnswer,
    );
    if (wrongOptions?.length) {
      const sample = wrongOptions.slice(0, 2).map((o) => `${o.key}. ${o.label}`).join("; ");
      return `Có thể loại trừ các lựa chọn như ${sample} vì không khớp định nghĩa/khái niệm trong đề.`;
    }
  }

  return `Về câu hỏi "${question?.text ?? "này"}": ${explanation.intro} Bạn có thể hỏi thêm "tại sao đáp án đúng" hoặc "gợi ý cách làm" để mình giải thích chi tiết hơn.`;
}
