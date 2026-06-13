using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Documents;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Documents;

public sealed class DocumentService : IDocumentService
{
    public const int FreePreviewPageLimit = DocumentAccessService.FreePreviewPageLimit;

    private readonly IDocumentRepository _documentRepository;
    private readonly IDocumentAccessLogRepository _accessLogRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly IDocumentAccessService _accessService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClientContext _clientContext;
    private readonly IMapper _mapper;

    public DocumentService(
        IDocumentRepository documentRepository,
        IDocumentAccessLogRepository accessLogRepository,
        IFileStorageService fileStorage,
        IDocumentAccessService accessService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IClientContext clientContext,
        IMapper mapper)
    {
        _documentRepository = documentRepository;
        _accessLogRepository = accessLogRepository;
        _fileStorage = fileStorage;
        _accessService = accessService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _clientContext = clientContext;
        _mapper = mapper;
    }

    public async Task<PagedResult<DocumentListItemDto>> GetDocumentsAsync(DocumentQueryParams query, CancellationToken cancellationToken = default)
    {
        _accessService.EnsureAuthenticated();
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
        _accessService.EnsureAuthenticated();
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        var dto = _mapper.Map<DocumentDetailDto>(document);
        var decision = _accessService.Evaluate(document);

        return new DocumentDetailDto
        {
            Id = dto.Id,
            Title = dto.Title,
            Category = dto.Category,
            PageCount = dto.PageCount,
            AccessTier = dto.AccessTier,
            MimeType = dto.MimeType,
            CreatedAt = dto.CreatedAt,
            CanDownload = decision.CanDownload,
            PageLimit = decision.PageLimit
        };
    }

    public async Task<DocumentPreviewDto> GetPreviewAsync(Guid id, int page, CancellationToken cancellationToken = default)
    {
        _accessService.EnsureAuthenticated();
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        if (page < 1 || page > document.PageCount)
        {
            throw new NotFoundException($"Page {page} is out of range.");
        }

        _accessService.EnsureCanPreview(document, page);
        var decision = _accessService.Evaluate(document);

        var contentUrl = await _fileStorage.GetSignedUrlAsync(
            $"{document.FilePath}#page={page}",
            TimeSpan.FromMinutes(15),
            cancellationToken);
        await LogAccessAsync(document.Id, "Preview", cancellationToken);

        return new DocumentPreviewDto
        {
            Page = page,
            TotalPages = document.PageCount,
            PageLimit = decision.PageLimit,
            ContentUrl = contentUrl
        };
    }

    public async Task<string> GetDownloadUrlAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _accessService.EnsureAuthenticated();
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        _accessService.EnsureCanDownload(document);
        await LogAccessAsync(document.Id, "Download", cancellationToken);

        return await _fileStorage.GetSignedUrlAsync(document.FilePath, TimeSpan.FromMinutes(30), cancellationToken);
    }

    public async Task<DocumentContentResult> GetContentAsync(Guid id, int? page, CancellationToken cancellationToken = default)
    {
        _accessService.EnsureAuthenticated();
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        if (page is >= 1)
        {
            _accessService.EnsureCanPreview(document, page.Value);
            await LogAccessAsync(document.Id, "Content", cancellationToken);
        }
        else
        {
            _accessService.EnsureCanDownload(document);
            await LogAccessAsync(document.Id, "Content", cancellationToken);
        }

        var stream = await _fileStorage.OpenReadAsync(document.FilePath, cancellationToken);
        return new DocumentContentResult
        {
            Stream = stream,
            ContentType = document.MimeType,
            FileName = BuildDownloadFileName(document.Title, document.MimeType)
        };
    }

    private async Task LogAccessAsync(Guid documentId, string action, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return;
        }

        await _accessLogRepository.AddAsync(new DocumentAccessLog
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            UserId = userId.Value,
            Action = action,
            IpAddress = _clientContext.IpAddress,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static string BuildDownloadFileName(string title, string mimeType)
    {
        var extension = mimeType switch
        {
            "application/pdf" => ".pdf",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" => ".pptx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
            _ => string.Empty
        };

        var safeTitle = string.Join('_', title.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
        return string.IsNullOrWhiteSpace(safeTitle) ? $"document{extension}" : $"{safeTitle}{extension}";
    }
}
