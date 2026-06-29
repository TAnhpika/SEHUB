using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class ExamListFilterIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly Guid PaperExamId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ExamListFilterIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetExams_BySubjectCode_MatchesPaperCodeFormat()
    {
        await SeedPaperCodeExamAsync();

        var response = await _client.GetAsync("/api/v1/exams?code=JPD113&type=Final&pageSize=20");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamListItemDto>>>();
        body!.Data!.Items.Should().Contain(exam => exam.Id == PaperExamId && exam.Code == "FE-JPD113-SU2026-3");
    }

    private async Task SeedPaperCodeExamAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        if (await context.Exams.AnyAsync(e => e.Id == PaperExamId))
        {
            return;
        }

        context.Exams.Add(new Exam
        {
            Id = PaperExamId,
            Code = "FE-JPD113-SU2026-3",
            Title = "FE-JPD113-SU2026-3",
            ExamType = ExamType.Final,
            Semester = 3,
            Major = "SE",
            QuestionCount = 10,
            Status = ExamStatus.Published,
            ContentHash = "integration-jpd113-paper-exam",
            Description = "Published final exam for subject filter test",
            CreatedAt = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
    }
}
