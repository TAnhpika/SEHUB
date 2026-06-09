using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Documents;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Documents;

public sealed class DocumentService : IDocumentService
{
    public const int FreePreviewPageLimit = 3;

    private readonly IDocumentRepository _documentRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public DocumentService(
        IDocumentRepository documentRepository,
        IFileStorageService fileStorage,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _documentRepository = documentRepository;
        _fileStorage = fileStorage;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<PagedResult<DocumentListItemDto>> GetDocumentsAsync(DocumentQueryParams query, CancellationToken cancellationToken = default)
    {
        EnsureAuthenticated();
        var (items, total) = await _documentRepository.GetPagedAsync(query, cancellationToken);

        return new PagedResult<DocumentListItemDto>
        {
            Items = _mapper.Map<IReadOnlyList<DocumentListItemDto>>(items),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<DocumentDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureAuthenticated();
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        var dto = _mapper.Map<DocumentDetailDto>(document);
        var canFullAccess = HasFullAccess();

        return new DocumentDetailDto
        {
            Id = dto.Id,
            Title = dto.Title,
            Category = dto.Category,
            PageCount = dto.PageCount,
            AccessTier = dto.AccessTier,
            MimeType = dto.MimeType,
            CreatedAt = dto.CreatedAt,
            CanDownload = canFullAccess,
            PageLimit = canFullAccess ? document.PageCount : FreePreviewPageLimit
        };
    }

    public async Task<DocumentPreviewDto> GetPreviewAsync(Guid id, int page, CancellationToken cancellationToken = default)
    {
        EnsureAuthenticated();
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        var pageLimit = HasFullAccess() ? document.PageCount : FreePreviewPageLimit;
        if (page < 1 || page > document.PageCount)
        {
            throw new NotFoundException($"Page {page} is out of range.");
        }

        if (page > pageLimit)
        {
            throw new ForbiddenException("Premium subscription required to preview beyond the free page limit.");
        }

        var contentUrl = await _fileStorage.GetSignedUrlAsync(
            $"{document.FilePath}#page={page}",
            TimeSpan.FromMinutes(15),
            cancellationToken);

        return new DocumentPreviewDto
        {
            Page = page,
            TotalPages = document.PageCount,
            PageLimit = pageLimit,
            ContentUrl = contentUrl
        };
    }

    public async Task<string> GetDownloadUrlAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureAuthenticated();
        if (!HasFullAccess())
        {
            throw new ForbiddenException("Premium subscription required to download documents.");
        }

        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        return await _fileStorage.GetSignedUrlAsync(document.FilePath, TimeSpan.FromMinutes(30), cancellationToken);
    }

    private void EnsureAuthenticated()
    {
        if (!_currentUser.IsAuthenticated)
        {
            throw new ForbiddenException("Authentication required.");
        }
    }

    private bool HasFullAccess() => _currentUser.IsPremium || _currentUser.IsModeratorOrAdmin;
}
