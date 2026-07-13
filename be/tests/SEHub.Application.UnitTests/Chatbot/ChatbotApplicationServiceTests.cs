using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Chatbot;
using SEHub.Application.Exams;
using SEHub.Application.Gamification.Abstractions;
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
    private readonly Mock<IGamificationEventPublisher> _gamificationPublisher = new();
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
            _gamificationPublisher.Object,
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

    [Fact]
    public async Task RenameConversationAsync_UpdatesTitle_WhenOwnedByUser()
    {
        var conversationId = Guid.NewGuid();
        var conversation = new ChatbotConversation
        {
            Id = conversationId,
            UserId = _userId,
            Title = "Old title",
            CreatedAt = DateTime.UtcNow.AddHours(-1),
        };

        _chatbotRepository
            .Setup(x => x.GetConversationAsync(conversationId, _userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(conversation);
        _unitOfWork
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var result = await _sut.RenameConversationAsync(
            conversationId,
            new RenameChatbotConversationRequest { Title = "  New title  " });

        result.Id.Should().Be(conversationId);
        result.Title.Should().Be("New title");
        conversation.Title.Should().Be("New title");
        _chatbotRepository.Verify(
            x => x.UpdateConversationAsync(conversation, It.IsAny<CancellationToken>()),
            Times.Once);
        _unitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RenameConversationAsync_ThrowsNotFound_WhenConversationMissing()
    {
        var conversationId = Guid.NewGuid();
        _chatbotRepository
            .Setup(x => x.GetConversationAsync(conversationId, _userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatbotConversation?)null);

        var act = () => _sut.RenameConversationAsync(
            conversationId,
            new RenameChatbotConversationRequest { Title = "New title" });

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteConversationAsync_RemovesConversation_WhenOwnedByUser()
    {
        var conversationId = Guid.NewGuid();
        var conversation = new ChatbotConversation
        {
            Id = conversationId,
            UserId = _userId,
            Title = "To delete",
            CreatedAt = DateTime.UtcNow,
        };

        _chatbotRepository
            .Setup(x => x.GetConversationAsync(conversationId, _userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(conversation);
        _unitOfWork
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        await _sut.DeleteConversationAsync(conversationId);

        _chatbotRepository.Verify(
            x => x.DeleteConversationAsync(conversation, It.IsAny<CancellationToken>()),
            Times.Once);
        _unitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteConversationAsync_ThrowsNotFound_WhenConversationMissing()
    {
        var conversationId = Guid.NewGuid();
        _chatbotRepository
            .Setup(x => x.GetConversationAsync(conversationId, _userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatbotConversation?)null);

        var act = () => _sut.DeleteConversationAsync(conversationId);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteConversationAsync_ThrowsForbidden_WhenUserIsNotPremium()
    {
        _currentUser.Setup(x => x.IsPremium).Returns(false);

        var act = () => _sut.DeleteConversationAsync(Guid.NewGuid());

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*PREMIUM_REQUIRED*");
    }
}
