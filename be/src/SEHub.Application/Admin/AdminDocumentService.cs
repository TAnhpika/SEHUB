using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Documents;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Admin;

public sealed class AdminDocumentService : IAdminDocumentService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IDocumentCategoryRepository _categoryRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AdminDocumentService(
        IDocumentRepository documentRepository,
        IDocumentCategoryRepository categoryRepository,
        IFileStorageService fileStorage,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _documentRepository = documentRepository;
        _categoryRepository = categoryRepository;
        _fileStorage = fileStorage;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<AdminDocumentDto>> GetDocumentsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _documentRepository.GetPagedAsync(new DocumentQueryParams
        {
            Page = page,
            PageSize = pageSize
        }, cancellationToken);

        return new PagedResult<AdminDocumentDto>
        {
            Items = _mapper.Map<IReadOnlyList<AdminDocumentDto>>(items),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<AdminDocumentDto> GetDocumentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        return _mapper.Map<AdminDocumentDto>(document);
    }

    public async Task<AdminDocumentDto> UploadAsync(UploadDocumentRequest request, Stream fileContent, string fileName, string mimeType, int pageCount, CancellationToken cancellationToken = default)
    {
        _ = await _categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException("DocumentCategory", request.CategoryId);

        var filePath = await _fileStorage.UploadAsync(
            fileContent,
            fileName,
            mimeType,
            "documents",
            cancellationToken);

        Enum.TryParse<AccessTier>(request.AccessTier, true, out var accessTier);

        var document = new Document
        {
            Id = Guid.NewGuid(),
            CategoryId = request.CategoryId,
            Title = request.Title,
            FilePath = filePath,
            MimeType = mimeType,
            PageCount = pageCount,
            AccessTier = accessTier,
            CreatedAt = DateTime.UtcNow
        };

        await _documentRepository.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<AdminDocumentDto>(document);
    }

    public async Task<AdminDocumentDto> UpdateAsync(
        Guid id,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        if (document.IsDeleted)
        {
            throw new NotFoundException("Document", id);
        }

        if (request.CategoryId is Guid categoryId)
        {
            _ = await _categoryRepository.GetByIdAsync(categoryId, cancellationToken)
                ?? throw new NotFoundException("DocumentCategory", categoryId);
            document.CategoryId = categoryId;
        }

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            document.Title = request.Title.Trim();
        }

        if (request.PageCount is int pageCount)
        {
            document.PageCount = pageCount;
        }

        if (!string.IsNullOrWhiteSpace(request.AccessTier))
        {
            if (!Enum.TryParse<AccessTier>(request.AccessTier, true, out var accessTier))
            {
                throw new ForbiddenException("AccessTier must be FreePreview or PremiumFull.");
            }

            document.AccessTier = accessTier;
        }

        document.UpdatedAt = DateTime.UtcNow;
        await _documentRepository.UpdateAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        return _mapper.Map<AdminDocumentDto>(updated);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await _documentRepository.SoftDeleteAsync(document, actorId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
