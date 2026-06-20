using SEHub.Application.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Exams;

public sealed class ExamGradingServiceTests
{
    private readonly ExamGradingService _sut = new();

    [Fact]
    public void Grade_WithMixedAnswers_CalculatesScoreAndDetails()
    {
        var optionA = Guid.NewGuid();
        var optionB = Guid.NewGuid();
        var optionC = Guid.NewGuid();
        var question1Id = Guid.NewGuid();
        var question2Id = Guid.NewGuid();

        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Code = "EX-001",
            Title = "Sample Exam",
            ExamType = ExamType.Final,
            Semester = 1,
            Major = "SE",
            QuestionCount = 2,
            Status = ExamStatus.Published,
            Questions =
            [
                new Question
                {
                    Id = question1Id,
                    OrderIndex = 1,
                    Content = "Q1",
                    CorrectOptionId = optionA,
                    Options =
                    [
                        new QuestionOption { Id = optionA, Label = "A", Text = "Answer A" },
                        new QuestionOption { Id = optionB, Label = "B", Text = "Answer B" }
                    ]
                },
                new Question
                {
                    Id = question2Id,
                    OrderIndex = 2,
                    Content = "Q2",
                    CorrectOptionId = optionC,
                    Options =
                    [
                        new QuestionOption { Id = optionB, Label = "B", Text = "Answer B" },
                        new QuestionOption { Id = optionC, Label = "C", Text = "Answer C" }
                    ]
                }
            ]
        };

        var answers = new Dictionary<Guid, List<Guid>>
        {
            [question1Id] = [optionA],
            [question2Id] = [optionB],
        };

        var result = _sut.Grade(exam, answers);

        result.TotalQuestions.Should().Be(2);
        result.CorrectCount.Should().Be(1);
        result.Score.Should().Be(50m);
        result.Answers.Should().ContainSingle(a => a.IsCorrect);
        result.Answers.Should().ContainSingle(a => !a.IsCorrect);
    }

    [Fact]
    public void Grade_MultiSelect_RequiresExactMatch()
    {
        var optionA = Guid.NewGuid();
        var optionB = Guid.NewGuid();
        var optionC = Guid.NewGuid();
        var optionD = Guid.NewGuid();
        var questionId = Guid.NewGuid();

        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Code = "EX-MULTI",
            Title = "Multi Exam",
            ExamType = ExamType.Final,
            Status = ExamStatus.Published,
            Questions =
            [
                new Question
                {
                    Id = questionId,
                    OrderIndex = 1,
                    Content = "Pick 2",
                    QuestionType = QuestionType.MultiSelect,
                    RequiredSelectCount = 2,
                    CorrectOptionIdsJson = QuestionCorrectAnswers.SerializeCorrectOptionIds([optionA, optionC]),
                    Options =
                    [
                        new QuestionOption { Id = optionA, Label = "A", Text = "A" },
                        new QuestionOption { Id = optionB, Label = "B", Text = "B" },
                        new QuestionOption { Id = optionC, Label = "C", Text = "C" },
                        new QuestionOption { Id = optionD, Label = "D", Text = "D" },
                    ]
                }
            ]
        };

        var partial = _sut.Grade(exam, new Dictionary<Guid, List<Guid>> { [questionId] = [optionA] });
        partial.CorrectCount.Should().Be(0);

        var exact = _sut.Grade(exam, new Dictionary<Guid, List<Guid>> { [questionId] = [optionA, optionC] });
        exact.CorrectCount.Should().Be(1);
    }

    [Fact]
    public void Grade_WithNoQuestions_ReturnsZeroScore()
    {
        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Code = "EX-EMPTY",
            Title = "Empty Exam",
            ExamType = ExamType.Final,
            Status = ExamStatus.Published
        };

        var result = _sut.Grade(exam, new Dictionary<Guid, List<Guid>>());

        result.Score.Should().Be(0);
        result.TotalQuestions.Should().Be(0);
        result.CorrectCount.Should().Be(0);
    }
}
