namespace SEHub.Shared.Constants;

public static class AiPromptRules
{
    /// <summary>
    /// FE hiển thị phản hồi AI dạng plain text (không parse Markdown).
    /// </summary>
    public const string PlainTextOnly =
        "Chỉ trả lời bằng văn bản thuần (plain text). KHÔNG dùng Markdown: không #, **, `, bảng |, link [text](url), code block. " +
        "Liệt kê bằng dấu \"- \" hoặc \"1. 2. 3.\" trên từng dòng; xuống dòng khi cần.";
}
