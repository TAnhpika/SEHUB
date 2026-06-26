using AutoMapper;
using Microsoft.Extensions.Configuration;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Documents;
using SEHub.Application.Models;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Documents;

public sealed class PreviewPageLimitTests
{
    private static readonly Guid DocumentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private readonly Mock<IDocumentRepository> _documentRepository = new();
    private readonly Mock<IDocumentAccessLogRepository> _accessLogRepository = new();
    private readonly Mock<ICloudFileStorageService> _cloudStorage = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IClientContext> _clientContext = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly IConfiguration _configuration = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["FileStorage:ApiBaseUrl"] = "http://localhost:5006"
        })
        .Build();

    private DocumentService CreateSut()
    {
        var accessService = new DocumentAccessService(_currentUser.Object);
        return new DocumentService(
            _documentRepository.Object,
            _accessLogRepository.Object,
            _cloudStorage.Object,
            accessService,
            _currentUser.Object,
            _unitOfWork.Object,
            _clientContext.Object,
            _mapper.Object,
            _configuration);
    }

    [Fact]
    public async Task GetPreviewAsync_AsFreeUser_OnPageWithinLimit_ReturnsPreview()
    {
        SetupDocument(pageCount: 10, accessTier: AccessTier.FreePreview);
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = CreateSut();
        var preview = await sut.GetPreviewAsync(DocumentId, page: 3);

        preview.Page.Should().Be(3);
        preview.PageLimit.Should().Be(DocumentService.FreePreviewPageLimit);
        preview.ContentUrl.Should().Be($"http://localhost:5006/api/v1/documents/{DocumentId}/content?page=3");
    }

    [Fact]
    public async Task GetPreviewAsync_AsFreeUser_BeyondLimit_ThrowsForbidden()
    {
        SetupDocument(pageCount: 10, accessTier: AccessTier.FreePreview);
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = CreateSut();
        var act = () => sut.GetPreviewAsync(DocumentId, page: 4);

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*Premium subscription required*");
    }

    [Fact]
    public async Task GetPreviewAsync_AsFreeUser_OnPremiumDocument_ThrowsForbidden()
    {
        SetupDocument(pageCount: 10, accessTier: AccessTier.PremiumFull);
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = CreateSut();
        var act = () => sut.GetPreviewAsync(DocumentId, page: 1);

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*Premium subscription required to access this document*");
    }

    [Fact]
    public async Task GetPreviewAsync_AsPremiumUser_BeyondFreeLimit_ReturnsPreview()
    {
        SetupDocument(pageCount: 10, accessTier: AccessTier.PremiumFull);
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.IsPremium).Returns(true);

        var sut = CreateSut();
        var preview = await sut.GetPreviewAsync(DocumentId, page: 8);

        preview.Page.Should().Be(8);
        preview.PageLimit.Should().Be(10);
        preview.ContentUrl.Should().Be($"http://localhost:5006/api/v1/documents/{DocumentId}/content?page=8");
    }

    [Fact]
    public async Task GetPreviewAsync_ForDriveDocument_ReturnsAuthenticatedContentUrl()
    {
        SetupDocument(pageCount: 5, accessTier: AccessTier.FreePreview, driveFileId: "drive-file-1");
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = CreateSut();
        var preview = await sut.GetPreviewAsync(DocumentId, page: 2);

        preview.ContentUrl.Should().Be($"http://localhost:5006/api/v1/documents/{DocumentId}/content?page=2");
    }

    [Fact]
    public async Task GetContentAsync_ForDriveDocument_OpensFromCloudStorage()
    {
        SetupDocument(pageCount: 5, accessTier: AccessTier.FreePreview, driveFileId: "drive-file-1");
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);
        _cloudStorage
            .Setup(s => s.OpenReadAsync("drive-file-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudFileReadResult
            {
                Stream = new MemoryStream([1, 2, 3]),
                ContentType = "application/pdf",
                FileName = "sample.pdf"
            });

        var sut = CreateSut();
        var content = await sut.GetContentAsync(DocumentId, page: 1);

        content.ContentType.Should().Be("application/pdf");
        _cloudStorage.Verify(s => s.OpenReadAsync("drive-file-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    private void SetupDocument(int pageCount, AccessTier accessTier, string driveFileId = "drive-file-default")
    {
        _documentRepository
            .Setup(r => r.GetByIdAsync(DocumentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Document
            {
                Id = DocumentId,
                Title = "Sample Document",
                FilePath = string.Empty,
                DriveFileId = driveFileId,
                OriginalFileName = "sample.pdf",
                MimeType = "application/pdf",
                PageCount = pageCount,
                AccessTier = accessTier,
                CategoryId = Guid.NewGuid()
            });
    }
}
