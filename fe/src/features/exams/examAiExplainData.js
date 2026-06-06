export const DEFAULT_AI_EXPLANATION = {
  intro:
    "Trong danh sách các lựa chọn trên, không có lựa chọn nào thực sự là một hàm (function) tích hợp sẵn của ngôn ngữ C theo nghĩa chuẩn mực nhất. Tuy nhiên, nếu xét kỹ:",
  bullets: [
    {
      label: "#include",
      text: "Là một chỉ thị tiền xử lý (preprocessor directive), không phải hàm.",
    },
    {
      label: "int, if, return",
      text: "Đều là các từ khóa (keywords) dành riêng trong C.",
    },
    {
      label: "is_prime()",
      text: "Đây là một tên hàm hợp lệ nhưng phải được lập trình viên định nghĩa trước khi sử dụng.",
    },
    {
      label: "2ndElement()",
      text: "Tên hàm không hợp lệ vì bắt đầu bằng chữ số.",
    },
  ],
  note:
    "Lưu ý đề thi: Đôi khi trong các bộ đề trắc nghiệm cơ bản (như PRF192), câu hỏi có thể mang tính đánh đố hoặc sai sót về thuật ngữ. Đáp án #include() thường được chọn nếu đề bài nhầm lẫn cú pháp có dấu ngoặc () là hàm, mặc dù về mặt kỹ thuật nó hoàn toàn sai. Hãy ưu tiên kiểm tra lại ngữ cảnh giáo trình của bạn.",
};

const EXPLANATIONS_BY_TEXT = {
  "Which is a function in C language?": DEFAULT_AI_EXPLANATION,
  'What is the output of printf("%d", 5 + 3 * 2);?': {
    intro: "Toán tử * có độ ưu tiên cao hơn +, nên biểu thức được tính là 5 + (3 * 2) = 5 + 6 = 11.",
    bullets: [
      { label: "Thứ tự ưu tiên", text: "Nhân/chia trước, cộng/trừ sau." },
      { label: "printf", text: 'In ra giá trị số nguyên với định dạng "%d".' },
    ],
    note: "Đáp án đúng là B (11).",
  },
};

export function getAiExplanation(question) {
  if (!question) return DEFAULT_AI_EXPLANATION;
  return EXPLANATIONS_BY_TEXT[question.text] ?? {
    intro: `Đáp án đúng là ${question.correctAnswer}. Hãy đọc kỹ đề và loại trừ các lựa chọn sai về mặt cú pháp hoặc ngữ nghĩa.`,
    bullets: question.options.map((option) => ({
      label: `${option.key}. ${option.label}`,
      text:
        option.key === question.correctAnswer
          ? "Đây là đáp án đúng."
          : "Không phải đáp án đúng cho câu hỏi này.",
    })),
    note: "Giải thích được tạo tự động cho mục đích demo.",
  };
}
