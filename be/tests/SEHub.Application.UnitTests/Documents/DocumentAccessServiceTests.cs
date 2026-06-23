using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Documents;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Documents;

public sealed class DocumentAccessServiceTests
{
    private readonly Mock<ICurrentUserService> _currentUser = new();

    [Fact]
    public void Evaluate_AsFreeUser_OnPremiumDocument_HasZeroPageLimit()
    {
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = new DocumentAccessService(_currentUser.Object);
        var decision = sut.Evaluate(CreateDocument(AccessTier.PremiumFull, pageCount: 12));

        decision.CanViewMetadata.Should().BeTrue();
        decision.CanDownload.Should().BeFalse();
        decision.PageLimit.Should().Be(0);
    }

    [Fact]
    public void EnsureCanPreview_AsFreeUser_OnPremiumDocument_ThrowsForbidden()
    {
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.IsPremium).Returns(false);
        _currentUser.Setup(u => u.IsModeratorOrAdmin).Returns(false);

        var sut = new DocumentAccessService(_currentUser.Object);
        var act = () => sut.EnsureCanPreview(CreateDocument(AccessTier.PremiumFull, pageCount: 12), page: 1);

        act.Should().Throw<ForbiddenException>()
            .WithMessage("*Premium subscription required to access this document*");
    }

    [Fact]
    public void EnsureCanDownload_AsPremiumUser_AllowsPremiumDocument()
    {
        _currentUser.Setup(u => u.IsAuthenticated).Returns(true);
        _currentUser.Setup(u => u.IsPremium).Returns(true);

        var sut = new DocumentAccessService(_currentUser.Object);
        var act = () => sut.EnsureCanDownload(CreateDocument(AccessTier.PremiumFull, pageCount: 12));

        act.Should().NotThrow();
    }

    private static Document CreateDocument(AccessTier accessTier, int pageCount) => new()
    {
        Id = Guid.NewGuid(),
        Title = "Doc",
        FilePath = "documents/sample.pdf",
        MimeType = "application/pdf",
        PageCount = pageCount,
        AccessTier = accessTier,
        CategoryId = Guid.NewGuid()
    };
}
