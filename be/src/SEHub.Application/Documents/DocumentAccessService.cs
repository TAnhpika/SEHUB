using SEHub.Application.Abstractions;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Documents;

public sealed class DocumentAccessService : IDocumentAccessService
{
    public const int FreePreviewPageLimit = 3;

    private readonly ICurrentUserService _currentUser;

    public DocumentAccessService(ICurrentUserService currentUser)
    {
        _currentUser = currentUser;
    }

    public void EnsureAuthenticated()
    {
        if (!_currentUser.IsAuthenticated)
        {
            throw new ForbiddenException("Authentication required.");
        }
    }

    public DocumentAccessDecision Evaluate(Document document)
    {
        EnsureAuthenticated();

        if (_currentUser.IsModeratorOrAdmin || _currentUser.IsPremium)
        {
            return new DocumentAccessDecision
            {
                CanViewMetadata = true,
                CanDownload = true,
                PageLimit = document.PageCount
            };
        }

        if (document.AccessTier == AccessTier.PremiumFull)
        {
            return new DocumentAccessDecision
            {
                CanViewMetadata = true,
                CanDownload = false,
                PageLimit = 0
            };
        }

        return new DocumentAccessDecision
        {
            CanViewMetadata = true,
            CanDownload = false,
            PageLimit = Math.Min(FreePreviewPageLimit, document.PageCount)
        };
    }

    public bool CanViewDocument(Document document)
    {
        EnsureAuthenticated();
        return Evaluate(document).CanViewMetadata;
    }

    public bool CanPreviewDocument(Document document, int page)
    {
        if (!CanViewDocument(document))
        {
            return false;
        }

        var decision = Evaluate(document);
        if (decision.PageLimit <= 0)
        {
            return false;
        }

        return page >= 1 && page <= document.PageCount && page <= decision.PageLimit;
    }

    public bool CanDownloadDocument(Document document)
    {
        EnsureAuthenticated();
        return Evaluate(document).CanDownload;
    }

    public void EnsureCanPreview(Document document, int page)
    {
        if (!CanPreviewDocument(document, page))
        {
            if (document.AccessTier == AccessTier.PremiumFull && !_currentUser.IsPremium && !_currentUser.IsModeratorOrAdmin)
            {
                throw new ForbiddenException("Premium subscription required to access this document.");
            }

            throw new ForbiddenException("Premium subscription required to preview beyond the free page limit.");
        }
    }

    public void EnsureCanDownload(Document document)
    {
        if (!CanDownloadDocument(document))
        {
            throw new ForbiddenException("Premium subscription required to download documents.");
        }
    }
}
