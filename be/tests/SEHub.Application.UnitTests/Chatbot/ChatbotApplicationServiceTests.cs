using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Chatbot;
using SEHub.Application.Exams;
using SEHub.Contracts.Chatbot;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Chatbot;

public class ChatbotApplicationServiceTests
{
    private readonly Mock<IChatbotRepository> _chatbotRepository = new();
    private readonly Mock<IAiProvider> _aiProvider = new();
    private readonly Mock<IAiTokenService> _aiTokenService = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly ChatbotApplicationService _sut;

    private readonly Guid _userId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public ChatbotApplicationServiceTests()
    {
        _currentUser.Setup(x => x.UserId).Returns(_userId);
        _currentUser.Setup(x => x.IsPremium).Returns(true);
        _currentUser.Setup(x => x.IsModeratorOrAdmin).Returns(false);

        _chatbotRepository
            .Setup(x => x.GetSettingsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChatbotSettings
            {
                Id = Guid.NewGuid(),
                SystemPrompt = "Test prompt",
                WelcomeMessage = "Xin chào",
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
            });

        _sut = new ChatbotApplicationService(
            _chatbotRepository.Object,
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

        var act = () => _sut.SendMessageAsync(new ChatbotMessageRequest { Message = "Hello" });

        var exception = await act.Should().ThrowAsync<ForbiddenException>();
        exception.Which.Message.Should().Contain("PREMIUM_REQUIRED");
    }

    [Fact]
    public async Task SendMessageAsync_ReturnsAssistantReply_WhenChatbotEnabled()
    {
        _chatbotRepository
            .Setup(x => x.SearchKnowledgeAsync(It.IsAny<string>(), 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ChatbotKnowledgeEntry>());

        _chatbotRepository
            .Setup(x => x.GetMessagesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ChatbotMessage>());

        _aiProvider
            .Setup(x => x.CompleteAsync(It.IsAny<AiProviderRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AiProviderResult { Text = "Premium kích hoạt trong 24h.", EstimatedTokensUsed = 10 });

        _aiTokenService
            .Setup(x => x.RecordConsumptionAsync(_userId, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(990);

        var result = await _sut.SendMessageAsync(new ChatbotMessageRequest { Message = "Premium kích hoạt khi nào?" });

        result.Reply.Should().Contain("Premium");
        result.RemainingTokens.Should().Be(990);
        result.Messages.Should().HaveCount(2);
        result.ConversationId.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SendMessageAsync_ThrowsForbidden_WhenChatbotDisabled()
    {
        _chatbotRepository
            .Setup(x => x.GetSettingsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChatbotSettings
            {
                Id = Guid.NewGuid(),
                SystemPrompt = "Test",
                WelcomeMessage = "Hi",
                IsEnabled = false,
                CreatedAt = DateTime.UtcNow,
            });

        var act = () => _sut.SendMessageAsync(new ChatbotMessageRequest { Message = "Hello" });

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*disabled*");
    }
}
