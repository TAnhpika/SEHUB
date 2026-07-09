using AutoMapper;

using Microsoft.Extensions.Configuration;

using SEHub.Application.Abstractions;

using SEHub.Application.Abstractions.Repositories;

using SEHub.Application.Gamification.Abstractions;

using SEHub.Application.Gamification.Events;

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

    private readonly ICloudFileStorageService _cloudStorage;

    private readonly IDocumentAccessService _accessService;

    private readonly ICurrentUserService _currentUser;

    private readonly IUnitOfWork _unitOfWork;

    private readonly IClientContext _clientContext;

    private readonly IMapper _mapper;

    private readonly IGamificationEventPublisher _gamificationPublisher;

    private readonly IPdfPageExtractor _pdfPageExtractor;

    private readonly IDocumentPdfCache _pdfCache;

    private readonly string _apiBaseUrl;



    public DocumentService(

        IDocumentRepository documentRepository,

        IDocumentAccessLogRepository accessLogRepository,

        ICloudFileStorageService cloudStorage,

        IDocumentAccessService accessService,

        ICurrentUserService currentUser,

        IUnitOfWork unitOfWork,

        IClientContext clientContext,

        IMapper mapper,

        IGamificationEventPublisher gamificationPublisher,

        IPdfPageExtractor pdfPageExtractor,

        IDocumentPdfCache pdfCache,

        IConfiguration configuration)

    {

        _documentRepository = documentRepository;

        _accessLogRepository = accessLogRepository;

        _cloudStorage = cloudStorage;

        _accessService = accessService;

        _currentUser = currentUser;

        _unitOfWork = unitOfWork;

        _clientContext = clientContext;

        _mapper = mapper;

        _gamificationPublisher = gamificationPublisher;

        _pdfPageExtractor = pdfPageExtractor;

        _pdfCache = pdfCache;

        _apiBaseUrl = configuration["FileStorage:ApiBaseUrl"]?.TrimEnd('/')

            ?? "http://localhost:5006";

    }



    public async Task<PagedResult<DocumentListItemDto>> GetDocumentsAsync(DocumentQueryParams query, CancellationToken cancellationToken = default)

    {

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

        var pageCount = await ResolveEffectivePageCountAsync(document, cancellationToken);



        return new DocumentDetailDto

        {

            Id = dto.Id,

            Title = dto.Title,

            Category = dto.Category,

            PageCount = pageCount,

            AccessTier = dto.AccessTier,

            MimeType = dto.MimeType,

            CreatedAt = dto.CreatedAt,

            CanDownload = decision.CanDownload,

            PageLimit = Math.Min(decision.PageLimit, pageCount)

        };

    }



    public async Task<DocumentPreviewDto> GetPreviewAsync(Guid id, int page, CancellationToken cancellationToken = default)

    {

        _accessService.EnsureAuthenticated();

        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)

            ?? throw new NotFoundException("Document", id);



        var effectivePageCount = await GetStoredPageCountAsync(document, cancellationToken);



        if (page < 1 || page > effectivePageCount)

        {

            throw new NotFoundException($"Page {page} is out of range.");

        }



        _accessService.EnsureCanPreview(document, page);

        var decision = _accessService.Evaluate(document);



        var contentUrl = BuildContentApiUrl(document.Id, page);



        return new DocumentPreviewDto

        {

            Page = page,

            TotalPages = effectivePageCount,

            PageLimit = Math.Min(decision.PageLimit, effectivePageCount),

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



        return BuildContentApiUrl(document.Id, page: null);

    }



    public async Task<DocumentContentResult> GetContentAsync(Guid id, int? page, CancellationToken cancellationToken = default)

    {

        _accessService.EnsureAuthenticated();

        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)

            ?? throw new NotFoundException("Document", id);



        if (page is >= 1)

        {

            var effectivePageCount = await GetStoredPageCountAsync(document, cancellationToken);

            if (page.Value > effectivePageCount)

            {

                throw new NotFoundException($"Page {page.Value} is out of range.");

            }



            _accessService.EnsureCanPreview(document, page.Value);

            await LogAccessAsync(document.Id, "Content", cancellationToken);

        }

        else

        {

            _accessService.EnsureCanDownload(document);

            await LogAccessAsync(document.Id, "Content", cancellationToken);

        }



        var stream = await OpenPdfStreamAsync(document, cancellationToken);



        if (page is >= 1 && IsPdf(document.MimeType))

        {

            stream = await _pdfPageExtractor.ExtractSinglePageAsync(stream, page.Value, cancellationToken);

        }



        return new DocumentContentResult

        {

            Stream = stream,

            ContentType = document.MimeType,

            FileName = DocumentFileAccess.ResolveDownloadFileName(document)

        };

    }



    private static bool IsPdf(string? mimeType) =>

        string.Equals(mimeType, "application/pdf", StringComparison.OrdinalIgnoreCase);



    private async Task<int> GetStoredPageCountAsync(Document document, CancellationToken cancellationToken)

    {

        if (!IsPdf(document.MimeType) || document.PageCount > 0)

        {

            return document.PageCount;

        }



        return await ResolveEffectivePageCountAsync(document, cancellationToken);

    }



    private async Task<int> ResolveEffectivePageCountAsync(Document document, CancellationToken cancellationToken)

    {

        if (!IsPdf(document.MimeType))

        {

            return document.PageCount;

        }



        await using var stream = await OpenPdfStreamAsync(document, cancellationToken);

        var actualPageCount = _pdfPageExtractor.GetPageCount(stream);

        if (actualPageCount <= 0)

        {

            return document.PageCount;

        }



        if (actualPageCount != document.PageCount)

        {

            document.PageCount = actualPageCount;

            await _documentRepository.UpdateAsync(document, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

        }



        return actualPageCount;

    }



    private async Task<Stream> OpenPdfStreamAsync(Document document, CancellationToken cancellationToken)
    {
        if (!IsPdf(document.MimeType))
        {
            return await DocumentFileAccess.OpenReadAsync(document, _cloudStorage, cancellationToken);
        }

        return await _pdfCache.OpenPdfAsync(
            document.Id,
            ct => DocumentFileAccess.OpenReadAsync(document, _cloudStorage, ct),
            cancellationToken);
    }



    private string BuildContentApiUrl(Guid documentId, int? page)

    {

        var path = page is >= 1

            ? $"/api/v1/documents/{documentId}/content?page={page.Value}"

            : $"/api/v1/documents/{documentId}/content";



        return $"{_apiBaseUrl}{path}";

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



        if (action is "Content")

        {

            await _gamificationPublisher.PublishAsync(new DocumentReadEvent(documentId, userId.Value), cancellationToken);

        }

    }

}


