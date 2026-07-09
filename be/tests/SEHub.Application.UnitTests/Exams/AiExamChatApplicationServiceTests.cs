using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Exams;

public class AiExamChatApplicationServiceTests
{
    private readonly Mock<IExamRepository> _examRepository = new();
    private readonly Mock<IAiExamChatRepository> _chatRepository = new();
    private readonly Mock<IAiProvider> _aiProvider = new();
    private readonly Mock<IAiTokenService> _aiTokenService = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly AiExamChatApplicationService _sut;

    private readonly Guid _userId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _examId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private readonly Guid _questionId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    public AiExamChatApplicationServiceTests()
    {
        _currentUser.Setup(x => x.UserId).Returns(_userId);
        _currentUser.Setup(x => x.IsPremium).Returns(true);
        _currentUser.Setup(x => x.IsModeratorOrAdmin).Returns(false);

        _sut = new AiExamChatApplicationService(
            _examRepository.Object,
            _chatRepository.Object,
            _aiProvider.Object,
            _aiTokenService.Object,
            _currentUser.Object,
            _unitOfWork.Object,
            Options.Create(new AiTokenLimitSettings { TokenCostChat = 10 }));
    }

    [Fact]
    public async Task SendMessageAsync_ThrowsForbidden_WhenUserIsNotPremium()
    {
        _currentUser.Setup(x => x.IsPremium).Returns(false);

        var act = () => _sut.SendMessageAsync(
            _examId,
            _questionId,
            new ExamAiChatRequest { Message = "Hello" });

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task SendMessageAsync_ReturnsAssistantReply_WhenQuestionExists()
    {
        var optionId = Guid.NewGuid();
        var exam = new Exam
        {
            Id = _examId,
            PaperCode = "Sample",
            ExamType = ExamType.Final,
            Questions =
            [
                new Question
                {
                    Id = _questionId,
                    ExamId = _examId,
                    Content = "2 + 2 = ?",
                    CorrectOptionId = optionId,
                    Options =
                    [
                        new QuestionOption { Id = optionId, Label = "B", Text = "4" },
                    ],
                },
            ],
        };

        _examRepository
            .Setup(x => x.GetByIdAsync(_examId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(exam);

        _chatRepository
            .Setup(x => x.GetOrCreateThreadAsync(_userId, _examId, _questionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AiExamChatThread
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                ExamId = _examId,
                QuestionId = _questionId,
                CreatedAt = DateTime.UtcNow,
            });

        _chatRepository
            .Setup(x => x.GetMessagesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AiExamChatMessage>());

        _aiProvider
            .Setup(x => x.CompleteAsync(It.IsAny<AiProviderRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AiProviderResult { Text = "Đáp án B đúng vì 2 + 2 = 4.", EstimatedTokensUsed = 10 });

        _aiTokenService
            .Setup(x => x.RecordConsumptionAsync(_userId, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(990);

        var result = await _sut.SendMessageAsync(
            _examId,
            _questionId,
            new ExamAiChatRequest { Message = "Tại sao B đúng?" });

        result.Reply.Should().Contain("Đáp án B đúng");
        result.RemainingTokens.Should().Be(990);
        result.Messages.Should().HaveCount(2);
    }
}
