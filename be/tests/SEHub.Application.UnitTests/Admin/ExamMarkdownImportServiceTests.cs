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

    [Fact]
    public void Parse_MultiSelectWithCommaAnswers_Q31Style_ParsesAsMultiSelect()
    {
        const string markdown = """
            ## Câu 31 [MULTI:2]
            In any Boolean algebra, what values are used for all variables and operations? (Choose two correct answers)

            A. Values are 1, 0
            B. Values are true, false
            C. Values are decimal numbers
            D. Values are 1, 0, true, false, and others

            **Đáp án: A, B**

            ---

            ## Câu 43 [MULTI:2]
            What are two roles of the instruction register (IR) during the instruction cycle?

            A. To store the next instruction to be executed.
            B. To hold the fetched instruction from memory.
            C. To interpret the fetched instruction.
            D. To calculate the address of the next instruction.
            E. To transfer instructions to the program counter (PC).

            **Đáp án: B, C**
            """;

        var result = _service.Parse(markdown);

        var q31 = result.Questions.First(q => q.OrderIndex == 31);
        var q43 = result.Questions.First(q => q.OrderIndex == 43);

        Assert.Equal("MultiSelect", q31.QuestionType);
        Assert.Equal(2, q31.RequiredSelectCount);
        Assert.Equal(2, q31.CorrectOptionIds.Count);

        Assert.Equal("MultiSelect", q43.QuestionType);
        Assert.Equal(2, q43.RequiredSelectCount);
        Assert.Equal(2, q43.CorrectOptionIds.Count);
    }

    [Fact]
    public void Parse_IncompleteSecondQuestion_ReturnsFirstAndWarning()
    {
        const string markdown = """
            ## Câu 1
            Nội dung câu hỏi?

            A. Phương án A
            B. Phương án B
            C. Phương án C
            D. Phương án D

            **Đáp án: A**

            ---

            ## Câu 2 [MULTI:3]
            Chọn đúng 3 đáp án:
            """;

        var result = _service.Parse(markdown);

        Assert.Equal(1, result.QuestionCount);
        Assert.Single(result.Warnings);
        Assert.Contains("Câu 2:", result.Warnings[0]);
    }

    [Fact]
    public void Parse_PlaceholderStyleMarkdown_ReturnsTwoQuestions()
    {
        const string markdown = """
            ## Câu 1
            Nội dung câu hỏi?

            A. Phương án A
            B. Phương án B
            C. Phương án C
            D. Phương án D

            **Đáp án: B**

            ---

            ## Câu 2 [MULTI:3]
            Chọn đúng 3 đáp án:

            A. Đáp án A
            B. Đáp án B
            C. Đáp án C
            D. Đáp án D
            E. Đáp án E
            F. Đáp án F

            **Đáp án: A, C, E**
            """;

        var result = _service.Parse(markdown);

        Assert.Equal(2, result.QuestionCount);
        Assert.Equal("MultiSelect", result.Questions[1].QuestionType);
        Assert.Equal(3, result.Questions[1].RequiredSelectCount);
    }

    [Fact]
    public void Parse_JapaneseFillInBlankStemWithInlineOptionRefs_ParsesSuccessfully()
    {
        const string markdown = """
            ## Câu 2
            Chọn đáp án thích hợp trong A. B. C. D để điền vào ngoặc cho câu sau:
            あしたも 7時に学校へ(
            ).
            O A

            A. きます
            B. ききます
            C. はたらきます
            D. おきます

            **Đáp án: A**
            """;

        var result = _service.Parse(markdown);

        Assert.Equal(1, result.QuestionCount);
        Assert.Equal("SingleChoice", result.Questions[0].QuestionType);
        Assert.Contains("A. B. C. D", result.Questions[0].Content);
        Assert.DoesNotContain("O A", result.Questions[0].Content);
        Assert.Equal(4, result.Questions[0].Options.Count);
    }

    [Fact]
    public void Parse_AnswerWithTrailingDot_ParsesSuccessfully()
    {
        const string markdown = """
            ## Câu 1
            Câu hỏi?

            A. Đúng
            B. Sai

            Đáp án: A.
            """;

        var result = _service.Parse(markdown);

        Assert.Equal(1, result.QuestionCount);
        Assert.Equal("A", result.Questions[0].Options[0].Label);
    }

    [Fact]
    public void Parse_PlainCauHeaderWithoutHash_SplitsAndParses()
    {
        const string markdown = """
            Câu 29
            Câu hỏi 29?

            A. Một
            B. Hai
            C. Ba
            D. Bốn

            Đáp án: D

            Câu 30
            Chọn trong A, B, C, D đáp án thích hợp để điền vào chỗ trống で しんぶんをかいます。
            A. うち
            B. うみ
            C. コンビニ
            D. じゅぎょう

            Đáp án: C
            """;

        var result = _service.Parse(markdown);

        Assert.Equal(2, result.QuestionCount);
        Assert.Equal(30, result.Questions[1].OrderIndex);
        Assert.Equal("C", result.Questions[1].Options.First(o => o.Id == result.Questions[1].CorrectOptionId).Label);
    }
}
