using AutoMapper;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Documents;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Documents;

public sealed class PreviewPageLimitTests
{
    private static readonly Guid DocumentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private readonly Mock<IDocumentRepository> _documentRepository = new();
    private readonly Mock<IDocumentAccessLogRepository> _accessLogRepository = new();
    private readonly Mock<IFileStorageService> _fileStorage = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IClientContext> _clientContext = new();
    private readonly Mock<IMapper> _mapper = new();

    private DocumentService CreateSut()
    {
        var accessService = new DocumentAccessService(_currentUser.Object);
        return new DocumentService(
            _documentRepository.Object,
            _accessLogRepository.Object,
            _fileStorage.Object,
            accessService,
            _currentUser.Object,
            _unitOfWork.Object,
            _clientContext.Object,
            _mapper.Object);
    }

    [Fact]
    public async Task GetPreviewAsync_AsFreeUser_OnPageWithinLimit_ReturnsPreview()
    {
        SetupDocument(pageCount: 10, accessTier: AccessTier.FreePreview);
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);
        _fileStorage
            .Setup(s => s.GetSignedUrlAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://storage.example/doc#page=3");

        var sut = CreateSut();
        var preview = await sut.GetPreviewAsync(DocumentId, page: 3);

        preview.Page.Should().Be(3);
        preview.PageLimit.Should().Be(DocumentService.FreePreviewPageLimit);
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
        _fileStorage
            .Setup(s => s.GetSignedUrlAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://storage.example/doc#page=8");

        var sut = CreateSut();
        var preview = await sut.GetPreviewAsync(DocumentId, page: 8);

        preview.Page.Should().Be(8);
        preview.PageLimit.Should().Be(10);
    }

    private void SetupDocument(int pageCount, AccessTier accessTier)
    {
        _documentRepository
            .Setup(r => r.GetByIdAsync(DocumentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Document
            {
                Id = DocumentId,
                Title = "Sample Document",
                FilePath = "documents/sample.pdf",
                MimeType = "application/pdf",
                PageCount = pageCount,
                AccessTier = accessTier,
                CategoryId = Guid.NewGuid()
            });
    }
}
