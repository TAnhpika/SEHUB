using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PdfSharp.Pdf;
using SEHub.API.IntegrationTests.Storage;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Documents;

public sealed class DocumentPageFlipIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly Guid DocumentCategoryId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddd0001");
    private static readonly Guid DocumentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddd0002");

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public DocumentPageFlipIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetContent_FlippingPages_UsesCachedPdf_OnlyOneDriveRead()
    {
        var driveFileId = await SeedDocumentWithPdfAsync(pageCount: 3);
        var fakeStorage = _factory.Services.GetRequiredService<FakeCloudFileStorageService>();
        fakeStorage.ResetOpenReadCallCount();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var page1 = await _client.GetAsync($"/api/v1/documents/{DocumentId}/content?page=1");
        page1.EnsureSuccessStatusCode();

        var page2 = await _client.GetAsync($"/api/v1/documents/{DocumentId}/content?page=2");
        page2.EnsureSuccessStatusCode();

        fakeStorage.OpenReadCallCount.Should().Be(1);
        driveFileId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GetContent_AsFreeUser_PageBeyondLimit_ReturnsForbidden()
    {
        await SeedDocumentWithPdfAsync(pageCount: 5);

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync($"/api/v1/documents/{DocumentId}/content?page=4");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetPreview_DoesNotHitDrive_WhenPageCountStored()
    {
        await SeedDocumentWithPdfAsync(pageCount: 3);
        var fakeStorage = _factory.Services.GetRequiredService<FakeCloudFileStorageService>();
        fakeStorage.ResetOpenReadCallCount();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync($"/api/v1/documents/{DocumentId}/preview?page=2");
        response.EnsureSuccessStatusCode();

        fakeStorage.OpenReadCallCount.Should().Be(0);
    }

    private async Task<string> SeedDocumentWithPdfAsync(int pageCount)
    {
        var fakeStorage = _factory.Services.GetRequiredService<FakeCloudFileStorageService>();

        await using var pdfStream = CreatePdf(pageCount);
        var upload = await fakeStorage.UploadAsync(pdfStream, "pagination-test.pdf", "application/pdf");
        var driveFileId = upload.DriveFileId;

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        if (!context.DocumentCategories.Any(c => c.Id == DocumentCategoryId))
        {
            context.DocumentCategories.Add(new DocumentCategory
            {
                Id = DocumentCategoryId,
                Name = "CSD201 Materials",
                Semester = 1,
                Major = "SE",
                SubjectCode = "CSD201",
                CreatedAt = DateTime.UtcNow
            });
        }

        var existing = await context.Documents.FindAsync(DocumentId);
        if (existing is null)
        {
            context.Documents.Add(new Document
            {
                Id = DocumentId,
                CategoryId = DocumentCategoryId,
                Title = "Pagination Test.pdf",
                FilePath = string.Empty,
                DriveFileId = driveFileId,
                OriginalFileName = "pagination-test.pdf",
                MimeType = "application/pdf",
                PageCount = pageCount,
                AccessTier = AccessTier.FreePreview,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.DriveFileId = driveFileId;
            existing.PageCount = pageCount;
            existing.MimeType = "application/pdf";
            existing.AccessTier = AccessTier.FreePreview;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();
        return driveFileId;
    }

    private static MemoryStream CreatePdf(int pageCount)
    {
        var document = new PdfDocument();
        for (var i = 0; i < pageCount; i++)
        {
            document.AddPage();
        }

        var stream = new MemoryStream();
        document.Save(stream, closeStream: false);
        document.Close();
        stream.Position = 0;
        return stream;
    }
}
