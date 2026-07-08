using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Abstractions;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class QuestionCommentEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    public static readonly Guid QuestionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public QuestionCommentEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetQuestionComments_WithoutToken_ReturnsUnauthorized()
    {
        await SeedQuestionAsync();

        var response = await _client.GetAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/questions/{QuestionId}/comments");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetQuestionComments_AsFreeUser_ReturnsForbidden()
    {
        await SeedQuestionAsync();
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/questions/{QuestionId}/comments");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateQuestionComment_AsPremiumUser_ReturnsOk()
    {
        await SeedQuestionAsync();
        await SeedPremiumSubscriptionAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = JsonSerializer.Serialize(new CreateQuestionCommentRequest
        {
            Content = "Integration test comment"
        });

        var response = await _client.PostAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/questions/{QuestionId}/comments",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var commentsResponse = await _client.GetAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/questions/{QuestionId}/comments");
        commentsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var commentsBody = await commentsResponse.Content.ReadFromJsonAsync<ApiResponse<List<QuestionCommentDto>>>();
        commentsBody!.Success.Should().BeTrue();
        commentsBody.Data.Should().ContainSingle(c => c.Content == "Integration test comment");
    }

    private async Task SeedQuestionAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        if (await context.Questions.AnyAsync(q => q.Id == QuestionId))
        {
            return;
        }

        var optionId = Guid.NewGuid();
        context.Questions.Add(new Question
        {
            Id = QuestionId,
            ExamId = CustomWebApplicationFactory.PublishedExamId,
            OrderIndex = 1,
            Content = "What is 2 + 2?",
            QuestionType = QuestionType.SingleChoice,
            CorrectOptionId = optionId,
            CreatedAt = DateTime.UtcNow,
            Options =
            [
                new QuestionOption
                {
                    Id = optionId,
                    QuestionId = QuestionId,
                    Label = "A",
                    Text = "4",
                }
            ]
        });

        await context.SaveChangesAsync();
    }

    private async Task SeedPremiumSubscriptionAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var existing = await context.Subscriptions
            .AnyAsync(s => s.UserId == CustomWebApplicationFactory.FreeUserId && s.IsActive);

        if (existing)
        {
            return;
        }

        context.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = CustomWebApplicationFactory.FreeUserId,
            PlanId = CustomWebApplicationFactory.SubscriptionPlanId,
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(30),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        var premiumStatus = scope.ServiceProvider.GetRequiredService<IPremiumStatusService>();
        premiumStatus.InvalidateCache(CustomWebApplicationFactory.FreeUserId);
    }
}
