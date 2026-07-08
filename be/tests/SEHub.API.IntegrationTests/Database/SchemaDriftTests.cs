using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;
using Xunit;

namespace SEHub.API.IntegrationTests.Database;

public sealed class SchemaDriftTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public SchemaDriftTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public void Exams_Entity_Matches_CleanupModel_NoLegacyProperties()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var properties = GetMappedPropertyNames(context, nameof(Exam));
        Assert.Contains("SubjectCode", properties);
        Assert.Contains("PaperCode", properties);
        Assert.DoesNotContain("Code", properties);
        Assert.DoesNotContain("Title", properties);
        Assert.DoesNotContain("Major", properties);
        Assert.DoesNotContain("Semester", properties);
        Assert.DoesNotContain("QuestionCount", properties);
        Assert.DoesNotContain("AssetUrl", properties);
    }

    [Fact]
    public void Documents_Entity_Matches_CleanupModel_NoFilePath()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var properties = GetMappedPropertyNames(context, nameof(Document));
        Assert.Contains("DriveFileId", properties);
        Assert.DoesNotContain("FilePath", properties);
    }

    [Fact]
    public void Posts_Entity_Matches_CleanupModel_NoCoverImageUrl()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var properties = GetMappedPropertyNames(context, nameof(Post));
        Assert.DoesNotContain("CoverImageUrl", properties);
        Assert.DoesNotContain("Tags", properties);
    }

    [Fact]
    public void DocumentCategories_Entity_Uses_SubjectCodeOnly()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var properties = GetMappedPropertyNames(context, nameof(DocumentCategory));
        Assert.Contains("SubjectCode", properties);
        Assert.DoesNotContain("Major", properties);
        Assert.DoesNotContain("Semester", properties);
    }

    private static HashSet<string> GetMappedPropertyNames(SEHubDbContext context, string clrTypeName)
    {
        var entityType = context.Model.GetEntityTypes()
            .FirstOrDefault(type => type.ClrType.Name == clrTypeName)
            ?? throw new InvalidOperationException($"Entity type '{clrTypeName}' was not found.");

        return entityType.GetProperties()
            .Select(property => property.Name)
            .ToHashSet(StringComparer.Ordinal);
    }
}
