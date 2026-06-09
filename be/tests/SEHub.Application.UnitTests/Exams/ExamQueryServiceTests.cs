using AutoMapper;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Application.Mapping;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Exams;

public sealed class ExamQueryServiceTests
{
    private readonly Mock<IExamRepository> _examRepository = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly IMapper _mapper;

    private static readonly Guid ExamId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid QuestionId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid CorrectOptionId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    public ExamQueryServiceTests()
    {
        _mapper = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>()).CreateMapper();
    }

    private ExamQueryService CreateSut() => new(_examRepository.Object, _currentUser.Object, _mapper);

    [Fact]
    public async Task GetQuestionWithAnswerAsync_ForFreeUser_ThrowsForbiddenException()
    {
        SetupExam();
        _currentUser.SetupGet(u => u.IsPremium).Returns(false);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = CreateSut();
        var act = () => sut.GetQuestionWithAnswerAsync(ExamId, QuestionId);

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("Premium subscription required to view answers.");
    }

    [Fact]
    public async Task GetQuestionWithAnswerAsync_ForPremiumUser_ReturnsCorrectOptionId()
    {
        SetupExam();
        _currentUser.SetupGet(u => u.IsPremium).Returns(true);

        var sut = CreateSut();
        var result = await sut.GetQuestionWithAnswerAsync(ExamId, QuestionId);

        result.Id.Should().Be(QuestionId);
        result.CorrectOptionId.Should().Be(CorrectOptionId);
    }

    [Fact]
    public async Task GetQuestionsAsync_ForUnpublishedExam_ThrowsNotFoundException()
    {
        var exam = new Exam
        {
            Id = ExamId,
            Code = "EX-DRAFT",
            Title = "Draft",
            ExamType = ExamType.Final,
            Semester = 1,
            Major = "SE",
            QuestionCount = 0,
            Status = ExamStatus.PendingApproval,
            Questions = []
        };

        _examRepository
            .Setup(r => r.GetByIdAsync(ExamId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(exam);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = CreateSut();
        var act = () => sut.GetQuestionsAsync(ExamId);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetQuestionsAsync_ForFreeUser_DoesNotExposeCorrectAnswers()
    {
        SetupExam(includeQuestions: true);
        _currentUser.SetupGet(u => u.IsAuthenticated).Returns(true);
        _currentUser.SetupGet(u => u.IsPremium).Returns(false);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = CreateSut();
        var result = await sut.GetQuestionsAsync(ExamId);

        result.Should().HaveCount(1);
        result[0].Options.Should().NotBeEmpty();
        result[0].Should().NotBeNull();
    }

    private void SetupExam(bool includeQuestions = true)
    {
        var exam = new Exam
        {
            Id = ExamId,
            Code = "EX-001",
            Title = "Sample",
            ExamType = ExamType.Final,
            Semester = 1,
            Major = "SE",
            QuestionCount = 1,
            Status = ExamStatus.Published,
            Questions =
            [
                new Question
                {
                    Id = QuestionId,
                    ExamId = ExamId,
                    OrderIndex = 1,
                    Content = "Question 1",
                    CorrectOptionId = CorrectOptionId,
                    Options =
                    [
                        new QuestionOption
                        {
                            Id = CorrectOptionId,
                            Label = "A",
                            Text = "Correct"
                        }
                    ]
                }
            ]
        };

        _examRepository
            .Setup(r => r.GetByIdAsync(ExamId, includeQuestions, It.IsAny<CancellationToken>()))
            .ReturnsAsync(exam);
    }
}
