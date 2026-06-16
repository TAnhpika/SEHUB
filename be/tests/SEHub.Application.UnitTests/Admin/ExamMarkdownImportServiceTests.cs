using SEHub.Application.Admin;

namespace SEHub.Application.UnitTests.Admin;

public sealed class ExamMarkdownImportServiceTests
{
    private readonly ExamMarkdownImportService _service = new();

    private const string SampleMarkdown = """
        ## Câu 1
        Trong lập trình hướng đối tượng, tính đóng gói là gì?

        A. Che giấu dữ liệu và chỉ truy cập qua phương thức
        B. Tạo nhiều phiên bản của một lớp
        C. Kế thừa thuộc tính từ lớp cha
        D. Gọi phương thức của lớp khác

        **Đáp án: A**

        ## Câu 2
        HTTP status code 404 nghĩa là gì?

        A. Thành công
        B. Không tìm thấy tài nguyên
        C. Lỗi máy chủ
        D. Không được phép

        Answer: B
        """;

    [Fact]
    public void Parse_ValidMarkdown_ReturnsQuestionsWithCorrectAnswers()
    {
        var result = _service.Parse(SampleMarkdown);

        Assert.Equal(2, result.QuestionCount);
        Assert.Equal(2, result.Questions.Count);
        Assert.Equal(1, result.Questions[0].OrderIndex);
        Assert.Equal("A", result.Questions[0].Options.First(o => o.Id == result.Questions[0].CorrectOptionId).Label);
        Assert.Equal("B", result.Questions[1].Options.First(o => o.Id == result.Questions[1].CorrectOptionId).Label);
    }

    [Fact]
    public void Parse_EmptyMarkdown_Throws()
    {
        Assert.Throws<Domain.Exceptions.DomainException>(() => _service.Parse("   "));
    }
}
