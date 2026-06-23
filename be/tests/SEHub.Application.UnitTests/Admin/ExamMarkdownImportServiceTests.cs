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

    [Fact]
    public void Parse_IndentedMarkdownWithExamTitle_ReturnsAllQuestions()
    {
        const string markdown = """
            # Đề thi 50 câu

            ## Câu 1

            Thủ đô của Việt Nam là gì?

            A. Hà Nội
            B. TP. Hồ Chí Minh
            C. Đà Nẵng
            D. Huế

            **Đáp án: A**

            ---

            ## Câu 2

            1 + 1 bằng mấy?

            A. 1
            B. 2
            C. 3
            D. 4

            **Đáp án: B**
            """;

        var result = _service.Parse(markdown);

        Assert.Equal(2, result.QuestionCount);
        Assert.Equal("Thủ đô của Việt Nam là gì?", result.Questions[0].Content);
        Assert.Equal("Hà Nội", result.Questions[0].Options.First(o => o.Label == "A").Text);
        Assert.Equal("A", result.Questions[0].Options.First(o => o.Id == result.Questions[0].CorrectOptionId).Label);
        Assert.Equal("1 + 1 bằng mấy?", result.Questions[1].Content);
        Assert.Equal("B", result.Questions[1].Options.First(o => o.Id == result.Questions[1].CorrectOptionId).Label);
    }

    [Fact]
    public void Parse_MultiSelectMarkdown_ReturnsMultiQuestion()
    {
        const string markdown = """
            ## Câu 1 [MULTI:3]
            Chọn 3 ngôn ngữ OOP:

            A. Java
            B. HTML
            C. C++
            D. Python
            E. CSS
            F. Assembly

            **Đáp án: A, C, D**
            """;

        var result = _service.Parse(markdown);

        Assert.Equal(1, result.QuestionCount);
        var question = result.Questions[0];
        Assert.Equal("MultiSelect", question.QuestionType);
        Assert.Equal(3, question.RequiredSelectCount);
        Assert.Equal(6, question.Options.Count);
        Assert.Equal(3, question.CorrectOptionIds.Count);
    }
}
