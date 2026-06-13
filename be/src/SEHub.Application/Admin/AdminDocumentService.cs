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

    public async Task<AdminDocumentDto> UploadAsync(
        UploadDocumentRequest request,
        Stream fileContent,
        string fileName,
        string mimeType,
        CancellationToken cancellationToken = default)
    {
        var category = await ResolveCategoryAsync(request, cancellationToken);

        var filePath = await _fileStorage.UploadAsync(
            fileContent,
            fileName,
            mimeType,
            "documents",
            cancellationToken);

        Enum.TryParse<AccessTier>(request.AccessTier, true, out var accessTier);

        var pageCount = request.PageCount > 0 ? request.PageCount : 1;
        var title = string.IsNullOrWhiteSpace(request.Title) ? fileName : request.Title.Trim();

        var document = new Document
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Title = title,
            FilePath = filePath,
            MimeType = mimeType,
            PageCount = pageCount,
            AccessTier = accessTier,
            CreatedAt = DateTime.UtcNow
        };

        await _documentRepository.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        document.Category = category;
        return _mapper.Map<AdminDocumentDto>(document);
    }

    private async Task<DocumentCategory> ResolveCategoryAsync(
        UploadDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CategoryId != Guid.Empty)
        {
            var existingById = await _categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken);
            if (existingById is not null)
            {
                return existingById;
            }
        }

        var subjectCode = request.SubjectCode.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(subjectCode))
        {
            throw new NotFoundException("DocumentCategory", request.CategoryId);
        }

        var existingBySubject = await _categoryRepository.FindBySubjectCodeAsync(subjectCode, cancellationToken);
        if (existingBySubject is not null)
        {
            return existingBySubject;
        }

        var semester = request.Semester > 0 ? request.Semester : 1;
        var category = new DocumentCategory
        {
            Id = Guid.NewGuid(),
            Name = $"{subjectCode} - Documents",
            Semester = semester,
            Major = "SE",
            CreatedAt = DateTime.UtcNow
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        return category;
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
