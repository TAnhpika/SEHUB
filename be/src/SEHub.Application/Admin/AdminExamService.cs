using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Common;
using SEHub.Application.Exams;
using SEHub.Application.Notifications;
using SEHub.Domain.Enums;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Admin;

public sealed class AdminExamService : IAdminExamService
{
    private readonly IExamRepository _examRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IExamAttachmentRepository _attachmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public AdminExamService(
        IExamRepository examRepository,
        ISubjectRepository subjectRepository,
        IExamAttachmentRepository attachmentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IWorkflowNotificationService workflowNotifications,
        IUserRepository userRepository,
        IMapper mapper)
    {
        _examRepository = examRepository;
        _subjectRepository = subjectRepository;
        _attachmentRepository = attachmentRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _workflowNotifications = workflowNotifications;
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<PagedResult<ExamListItemDto>> GetExamsAsync(ExamQueryParams query, CancellationToken cancellationToken = default)
    {
        var adminQuery = new ExamQueryParams
        {
            SubjectCode = query.SubjectCode,
            Type = query.Type,
            Semester = query.Semester,
            Major = query.Major,
            Page = query.Page,
            PageSize = query.PageSize,
            Status = query.Status,
            SubmittedById = query.Mine ? _currentUser.UserId : query.SubmittedById,
            IncludeUnpublished = true
        };

        var (items, total) = await _examRepository.GetPagedAsync(adminQuery, cancellationToken);
        return new PagedResult<ExamListItemDto>
        {
            Items = await MapExamListItemsAsync(items, cancellationToken),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<AdminExamDto> GetExamAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> CreateExamAsync(CreateExamRequest request, bool confirmDuplicate = false, CancellationToken cancellationToken = default)
    {
        var subject = await ExamSubjectBinder.ResolveSubjectAsync(
            request.SubjectCode,
            _subjectRepository,
            cancellationToken);

        var paperCode = request.PaperCode.Trim();
        if (string.IsNullOrWhiteSpace(paperCode))
        {
            throw new DomainException("Mã đề thi không được để trống.");
        }

        if (await _examRepository.GetByPaperCodeAsync(paperCode, cancellationToken) is not null)
        {
            throw new ConflictException("Mã đề đã tồn tại. Vui lòng dùng mã khác.");
        }

        var contentHash = ExamContentFingerprint.ComputeHashFromCreateRequest(request);
        await EnsureNoDuplicateHashAsync(contentHash, currentExam: null, confirmDuplicate, cancellationToken);

        var exam = BuildExamFromRequest(request, subject, contentHash, _currentUser.UserId);
        await ApplyPracticeExamPinAsync(exam, cancellationToken);
        await _examRepository.AddAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await NotifyAdminsIfModeratorSubmittedAsync(exam, isResubmit: false, cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> UpdateExamAsync(
        Guid id,
        UpdateExamRequest request,
        bool confirmDuplicate = false,
        CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status == ExamStatus.Published && request.Questions is not null)
        {
            throw new DomainException("Đề đã xuất bản — không thể sửa câu hỏi trực tiếp. Tạo bản revision để gửi Admin duyệt.");
        }

        if (request.SubjectCode is not null)
        {
            var subject = await ExamSubjectBinder.ResolveSubjectAsync(
                request.SubjectCode,
                _subjectRepository,
                cancellationToken);
            ExamSubjectBinder.ApplySubject(exam, subject);
        }

        if (request.PaperCode is not null)
        {
            var paperCode = request.PaperCode.Trim();
            var existing = await _examRepository.GetByPaperCodeAsync(paperCode, cancellationToken);
            if (existing is not null && existing.Id != exam.Id)
            {
                throw new ConflictException("Mã đề đã tồn tại. Vui lòng dùng mã khác.");
            }

            exam.PaperCode = paperCode;
        }

        if (request.Description is not null)
        {
            exam.Description = HtmlContentHelper.ToPlainText(request.Description);
        }
        if (request.ExamType is not null && Enum.TryParse<ExamType>(request.ExamType, true, out var examType)) exam.ExamType = examType;
        if (request.Status is not null && Enum.TryParse<ExamStatus>(request.Status, true, out var status)) exam.Status = status;

        if (request.Questions is not null)
        {
            await ReplaceExamQuestionsAsync(exam, request.Questions, confirmDuplicate, cancellationToken);
        }

        exam.UpdatedAt = DateTime.UtcNow;
        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> ApproveExamAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status != ExamStatus.PendingApproval)
        {
            throw new DomainException("Chỉ duyệt được đề đang chờ phê duyệt.");
        }

        if (exam.RevisionOfExamId is Guid parentId)
        {
            var parent = await _examRepository.GetByIdAsync(parentId, cancellationToken: cancellationToken)
                ?? throw new NotFoundException("Exam", parentId);

            if (parent.Status != ExamStatus.Published)
            {
                throw new DomainException("Bản gốc không còn ở trạng thái xuất bản.");
            }

            var livePaperCode = parent.PaperCode;
            parent.PaperCode = $"{livePaperCode}-ARCH-{DateTime.UtcNow:yyyyMMddHHmmss}";
            parent.Status = ExamStatus.Archived;
            parent.UpdatedAt = DateTime.UtcNow;

            exam.PaperCode = livePaperCode;
            await _examRepository.UpdateAsync(parent, cancellationToken);
        }

        exam.Status = ExamStatus.Published;
        var publishedSubject = await ExamSubjectBinder.ResolveSubjectAsync(
            exam.SubjectCode,
            _subjectRepository,
            cancellationToken);
        ExamSubjectBinder.ApplySubject(exam, publishedSubject);
        await ApplyPracticeExamPinAsync(exam, cancellationToken);
        exam.UpdatedAt = DateTime.UtcNow;
        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _workflowNotifications.NotifyModeratorExamReviewResultAsync(
            exam,
            approved: true,
            _currentUser.UserId,
            cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> RejectExamAsync(
        Guid id,
        RejectExamRequest request,
        CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status != ExamStatus.PendingApproval)
        {
            throw new DomainException("Chỉ từ chối được đề đang chờ phê duyệt.");
        }

        exam.Status = ExamStatus.Rejected;
        exam.RejectionReasonCode = HtmlContentHelper.ToPlainText(request.ReasonCode);
        exam.RejectionReasonDetail = string.IsNullOrWhiteSpace(request.Detail)
            ? HtmlContentHelper.ToPlainText(request.ReasonLabel)
            : $"{HtmlContentHelper.ToPlainText(request.ReasonLabel)}: {HtmlContentHelper.ToPlainText(request.Detail)}";
        exam.RejectedAt = DateTime.UtcNow;
        exam.RejectedById = _currentUser.UserId;
        exam.UpdatedAt = DateTime.UtcNow;

        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _workflowNotifications.NotifyModeratorExamReviewResultAsync(
            exam,
            approved: false,
            _currentUser.UserId,
            cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> ResubmitExamAsync(
        Guid id,
        ResubmitExamRequest request,
        bool confirmDuplicate = false,
        CancellationToken cancellationToken = default)
    {
        RequireModeratorUserId();
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: false, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        EnsureModeratorOwnsExamInstance(exam);

        if (exam.Status != ExamStatus.Rejected && !IsEditableRevision(exam))
        {
            throw new DomainException("Chỉ sửa được đề bị từ chối hoặc bản revision đang chờ duyệt.");
        }

        ApplyResubmitContent(exam, request);

        if (request.Questions.Count > 0)
        {
            await ReplaceExamQuestionsAsync(exam, request.Questions, confirmDuplicate, cancellationToken);
        }
        else if (exam.ExamType == ExamType.Practice)
        {
            ApplyPracticeMetadataHash(exam);
            await EnsureNoDuplicateHashAsync(exam.ContentHash, exam, confirmDuplicate, cancellationToken);
        }

        if (exam.Status == ExamStatus.Rejected)
        {
            exam.RejectionReasonCode = null;
            exam.RejectionReasonDetail = null;
            exam.RejectedAt = null;
            exam.RejectedById = null;
        }

        exam.Status = ExamStatus.PendingApproval;
        exam.UpdatedAt = DateTime.UtcNow;

        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var refreshed = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        await NotifyAdminsIfModeratorSubmittedAsync(refreshed, isResubmit: true, cancellationToken);
        return await MapAdminExamAsync(refreshed, cancellationToken);
    }

    public async Task<AdminExamDto> CreateRevisionAsync(Guid publishedExamId, CancellationToken cancellationToken = default)
    {
        RequireModeratorUserId();
        var published = await _examRepository.GetByIdAsync(publishedExamId, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", publishedExamId);

        if (!_currentUser.IsModeratorOrAdmin || _currentUser.Role != RoleNames.Admin)
        {
            EnsureModeratorOwnsExamInstance(published);
        }

        if (published.Status != ExamStatus.Published)
        {
            throw new DomainException("Chỉ tạo bản sửa từ đề đã xuất bản.");
        }

        var existingRevision = await _examRepository.GetPendingRevisionOfAsync(publishedExamId, cancellationToken);
        if (existingRevision is not null)
        {
            return await MapAdminExamAsync(existingRevision, cancellationToken);
        }

        var revision = await CloneExamAsRevisionAsync(published, cancellationToken);
        await _examRepository.AddAsync(revision, cancellationToken);
        await CloneExamAttachmentsAsync(published.Id, revision.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAdminExamAsync(revision, cancellationToken);
    }

    public async Task DeleteExamAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status == ExamStatus.Archived)
        {
            throw new DomainException("Đề đã được xóa trước đó.");
        }

        if (await _examRepository.GetPendingRevisionOfAsync(id, cancellationToken) is not null)
        {
            throw new DomainException("Không thể xóa đề đang có bản revision chờ duyệt. Hãy xử lý hàng chờ trước.");
        }

        var livePaperCode = exam.PaperCode;
        exam.PaperCode = $"{livePaperCode}-DEL-{DateTime.UtcNow:yyyyMMddHHmmss}";
        exam.Status = ExamStatus.Archived;
        exam.UpdatedAt = DateTime.UtcNow;

        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task NotifyAdminsIfModeratorSubmittedAsync(
        Exam exam,
        bool isResubmit,
        CancellationToken cancellationToken)
    {
        if (exam.Status != ExamStatus.PendingApproval)
        {
            return;
        }

        if (string.Equals(_currentUser.Role, RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        await _workflowNotifications.NotifyAdminsExamPendingReviewAsync(
            exam,
            _currentUser.UserId,
            isResubmit,
            cancellationToken);
    }

    private async Task EnsureNoDuplicateHashAsync(
        string contentHash,
        Exam? currentExam,
        bool confirmDuplicate,
        CancellationToken cancellationToken)
    {
        if (confirmDuplicate)
        {
            return;
        }

        var duplicate = await _examRepository.GetByContentHashAsync(contentHash, cancellationToken);
        if (duplicate is null)
        {
            return;
        }

        if (currentExam is not null && IsSameExamLineage(duplicate, currentExam))
        {
            return;
        }

        throw new ConflictException(ErrorCodes.DuplicateExam);
    }

    private static bool IsSameExamLineage(Exam duplicate, Exam currentExam)
    {
        if (duplicate.Id == currentExam.Id)
        {
            return true;
        }

        if (currentExam.RevisionOfExamId == duplicate.Id)
        {
            return true;
        }

        if (duplicate.RevisionOfExamId == currentExam.Id)
        {
            return true;
        }

        if (currentExam.RevisionOfExamId is Guid parentId
            && duplicate.RevisionOfExamId == parentId)
        {
            return true;
        }

        return false;
    }

    private static void ApplyPracticeMetadataHash(Exam exam)
    {
        exam.ContentHash = ExamContentFingerprint.ComputeHash(
            ExamContentFingerprint.NormalizeText(
                ExamContentFingerprint.BuildPracticeMetadata(exam.SubjectCode, exam.PaperCode, exam.Description)));
    }

    private static Exam BuildExamFromRequest(
        CreateExamRequest request,
        Subject subject,
        string contentHash,
        Guid? submittedById)
    {
        var examId = Guid.NewGuid();
        Enum.TryParse<ExamType>(request.ExamType, true, out var examType);

        var exam = new Exam
        {
            Id = examId,
            PaperCode = request.PaperCode.Trim(),
            ExamType = examType,
            Description = HtmlContentHelper.ToPlainText(request.Description),
            SubmittedById = submittedById,
            Status = ExamStatus.PendingApproval,
            ContentHash = contentHash,
            IsPinned = request.IsPinned && examType == ExamType.Practice,
            PinnedAt = request.IsPinned && examType == ExamType.Practice ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        };

        ExamSubjectBinder.ApplySubject(exam, subject);

        exam.Questions = request.Questions.Select(q => BuildQuestion(q, examId)).ToList();
        return exam;
    }

    private static Question BuildQuestion(CreateExamQuestionItem item, Guid examId)
    {
        var questionId = Guid.NewGuid();
        var options = item.Options.Select(o => new QuestionOption
        {
            Id = o.Id == Guid.Empty ? Guid.NewGuid() : o.Id,
            QuestionId = questionId,
            Label = o.Label,
            Text = HtmlContentHelper.SanitizeRichHtml(o.Text),
            CreatedAt = DateTime.UtcNow,
        }).ToList();

        var questionType = Enum.TryParse<QuestionType>(item.QuestionType, true, out var parsedType)
            ? parsedType
            : QuestionType.SingleChoice;
        var correctOptionIds = ResolveCorrectOptionIds(item, options);
        if (correctOptionIds.Count == 0 && options.Count > 0)
        {
            correctOptionIds = [options[0].Id];
        }

        if (correctOptionIds.Count > 1)
        {
            questionType = QuestionType.MultiSelect;
        }

        int? requiredSelectCount = questionType == QuestionType.MultiSelect
            ? item.RequiredSelectCount ?? correctOptionIds.Count
            : null;

        return new Question
        {
            Id = questionId,
            ExamId = examId,
            OrderIndex = item.OrderIndex,
            Content = HtmlContentHelper.SanitizeRichHtml(item.Content),
            QuestionType = questionType,
            RequiredSelectCount = requiredSelectCount,
            CorrectOptionId = questionType == QuestionType.SingleChoice ? correctOptionIds[0] : null,
            CorrectOptionIdsJson = QuestionCorrectAnswers.SerializeCorrectOptionIds(correctOptionIds),
            CreatedAt = DateTime.UtcNow,
            Options = options,
        };
    }

    private static List<Guid> ResolveCorrectOptionIds(CreateExamQuestionItem item, IReadOnlyList<QuestionOption> options)
    {
        var optionIds = options.Select(option => option.Id).ToHashSet();
        var fromRequest = item.CorrectOptionIds.Where(optionIds.Contains).Distinct().ToList();
        if (fromRequest.Count > 0)
        {
            return fromRequest;
        }

        if (item.CorrectOptionId != Guid.Empty && optionIds.Contains(item.CorrectOptionId))
        {
            return [item.CorrectOptionId];
        }

        return [];
    }

    private static Exam CloneExamAsRevision(Exam published, string revisionTitle)
    {
        var revisionId = Guid.NewGuid();

        var revision = new Exam
        {
            Id = revisionId,
            SubjectCode = published.SubjectCode,
            PaperCode = revisionTitle,
            ExamType = published.ExamType,
            Description = published.Description,
            SubmittedById = published.SubmittedById,
            RevisionOfExamId = published.Id,
            Status = ExamStatus.Draft,
            ContentHash = published.ContentHash,
            CreatedAt = DateTime.UtcNow,
        };

        revision.Questions = published.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q =>
            {
                var questionId = Guid.NewGuid();
                var options = q.Options.Select(o => new QuestionOption
                {
                    Id = Guid.NewGuid(),
                    QuestionId = questionId,
                    Label = o.Label,
                    Text = HtmlContentHelper.SanitizeRichHtml(o.Text),
                    CreatedAt = DateTime.UtcNow,
                }).ToList();

                var correctLabels = QuestionCorrectAnswers.GetCorrectOptionIds(q)
                    .Select(id => q.Options.FirstOrDefault(o => o.Id == id)?.Label)
                    .Where(label => !string.IsNullOrWhiteSpace(label))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var remappedCorrectIds = options
                    .Where(o => correctLabels.Contains(o.Label))
                    .Select(o => o.Id)
                    .ToList();

                if (remappedCorrectIds.Count == 0)
                {
                    remappedCorrectIds = options.Count > 0 ? [options[0].Id] : [];
                }

                return new Question
                {
                    Id = questionId,
                    ExamId = revisionId,
                    OrderIndex = q.OrderIndex,
                    Content = HtmlContentHelper.SanitizeRichHtml(q.Content),
                    QuestionType = q.QuestionType,
                    RequiredSelectCount = q.RequiredSelectCount,
                    CorrectOptionId = q.QuestionType == QuestionType.SingleChoice
                        ? remappedCorrectIds.FirstOrDefault()
                        : null,
                    CorrectOptionIdsJson = QuestionCorrectAnswers.SerializeCorrectOptionIds(remappedCorrectIds),
                    CreatedAt = DateTime.UtcNow,
                    Options = options,
                };
            })
            .ToList();

        return revision;
    }

    private async Task<Exam> CloneExamAsRevisionAsync(Exam published, CancellationToken cancellationToken)
    {
        var revisionTitle = await BuildRevisionTitleAsync(published.PaperCode, cancellationToken);
        return CloneExamAsRevision(published, revisionTitle);
    }

    private async Task<string> BuildRevisionTitleAsync(string publishedPaperCode, CancellationToken cancellationToken)
    {
        var baseTitle = $"{publishedPaperCode.Trim()}-Rev";
        if (baseTitle.Length > 100)
        {
            baseTitle = baseTitle[..100];
        }

        var candidate = baseTitle;
        var suffix = 2;
        while (await _examRepository.GetByPaperCodeAsync(candidate, cancellationToken) is not null)
        {
            candidate = $"{baseTitle}-{suffix}";
            if (candidate.Length > 100)
            {
                candidate = candidate[..100];
            }

            suffix++;
        }

        return candidate;
    }

    private async Task ReplaceExamQuestionsAsync(
        Exam exam,
        IEnumerable<CreateExamQuestionItem> items,
        bool confirmDuplicate,
        CancellationToken cancellationToken)
    {
        var itemList = items.ToList();
        var contentHash = ExamContentFingerprint.ComputeHashFromQuestions(itemList);
        await EnsureNoDuplicateHashAsync(contentHash, exam, confirmDuplicate, cancellationToken);

        var newQuestions = itemList.Select(q => BuildQuestion(q, exam.Id)).ToList();
        await _examRepository.ReplaceQuestionsAsync(exam.Id, newQuestions, cancellationToken);
        exam.ContentHash = contentHash;
    }

    private static void ApplyResubmitContent(Exam exam, ResubmitExamRequest request)
    {
        if (exam.RevisionOfExamId is null)
        {
            exam.PaperCode = request.PaperCode.Trim();
        }

        if (request.Description is not null)
        {
            exam.Description = HtmlContentHelper.ToPlainText(request.Description);
        }

        if (exam.ExamType == ExamType.Practice && request.Questions.Count == 0)
        {
            ApplyPracticeMetadataHash(exam);
        }
    }

    private Guid RequireModeratorUserId() =>
        _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

    private void EnsureModeratorOwnsExamInstance(Exam exam)
    {
        var userId = RequireModeratorUserId();
        if (exam.SubmittedById != userId && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("You can only edit your own exam submissions.");
        }
    }

    private static bool IsEditableRevision(Exam exam) =>
        exam.RevisionOfExamId is not null
        && (exam.Status == ExamStatus.Draft || exam.Status == ExamStatus.PendingApproval);

    private async Task ApplyPracticeExamPinAsync(Exam exam, CancellationToken cancellationToken)
    {
        if (exam.ExamType != ExamType.Practice || !exam.IsPinned)
        {
            return;
        }

        await _examRepository.UnpinPracticeExamsBySubjectCodeAsync(exam.SubjectCode, exam.Id, cancellationToken);
        exam.PinnedAt = DateTime.UtcNow;
    }

    private static bool CanModeratorResubmit(Exam exam) =>
        exam.Status == ExamStatus.Rejected || IsEditableRevision(exam);

    private static bool IsContentLocked(Exam exam) =>
        exam.Status == ExamStatus.Published;

    private async Task<AdminExamDto> MapAdminExamAsync(Exam exam, CancellationToken cancellationToken)
    {
        var attachments = await _attachmentRepository.GetByExamIdAsync(exam.Id, cancellationToken);
        var submitter = exam.SubmittedById is Guid submittedById
            ? await _userRepository.GetByIdAsync(submittedById, cancellationToken)
            : null;

        return new AdminExamDto
        {
            Id = exam.Id,
            SubjectCode = exam.SubjectCode,
            PaperCode = exam.PaperCode,
            SubjectName = ExamDtoMapper.ResolveSubjectName(exam),
            ExamType = exam.ExamType.ToString(),
            Semester = ExamDtoMapper.ResolveSemester(exam).ToString(),
            Major = ExamDtoMapper.ResolveMajor(exam),
            QuestionCount = exam.Questions.Count,
            Status = exam.Status.ToString(),
            Description = exam.Description,
            ContentHash = exam.ContentHash,
            CreatedAt = exam.CreatedAt,
            UpdatedAt = exam.UpdatedAt,
            RevisionOfExamId = exam.RevisionOfExamId,
            RejectionReasonCode = exam.RejectionReasonCode,
            RejectionReasonDetail = exam.RejectionReasonDetail,
            RejectedAt = exam.RejectedAt,
            CanResubmit = CanModeratorResubmit(exam),
            IsContentLocked = IsContentLocked(exam),
            RevisionSourceSubjectCode = exam.RevisionOfExam?.SubjectCode,
            RevisionSourcePaperCode = exam.RevisionOfExam?.PaperCode,
            SubmittedByUsername = submitter?.Username,
            SubmittedByDisplayName = submitter?.DisplayName,
            IsPinned = exam.IsPinned,
            Attachments = attachments.Select(a => ExamAttachmentService.MapDto(exam.Id, a)).ToList(),
            Questions = exam.Questions.OrderBy(q => q.OrderIndex).Select(q => new AdminExamQuestionDto
            {
                Id = q.Id,
                OrderIndex = q.OrderIndex,
                Content = q.Content,
                QuestionType = q.QuestionType.ToString(),
                RequiredSelectCount = q.RequiredSelectCount,
                CorrectOptionId = q.CorrectOptionId ?? Guid.Empty,
                CorrectOptionIds = QuestionCorrectAnswers.GetCorrectOptionIds(q),
                Options = q.Options.OrderBy(o => o.Label).Select(o => new AdminExamOptionDto
                {
                    Id = o.Id,
                    Label = o.Label,
                    Text = o.Text
                }).ToList()
            }).ToList()
        };
    }

    private async Task<IReadOnlyList<ExamListItemDto>> MapExamListItemsAsync(
        IReadOnlyList<Exam> exams,
        CancellationToken cancellationToken)
    {
        var submitterIds = exams
            .Where(exam => exam.SubmittedById is Guid)
            .Select(exam => exam.SubmittedById!.Value)
            .Distinct()
            .ToList();

        var submitters = submitterIds.Count == 0
            ? []
            : await _userRepository.GetByIdsAsync(submitterIds, cancellationToken);

        var submitterLookup = submitters.ToDictionary(user => user.Id);
        var questionCounts = await _examRepository.GetQuestionCountsAsync(
            exams.Select(exam => exam.Id).ToList(),
            cancellationToken);

        return exams
            .Select(exam =>
            {
                submitterLookup.TryGetValue(exam.SubmittedById ?? Guid.Empty, out var submitter);
                questionCounts.TryGetValue(exam.Id, out var questionCount);
                return MapExamListItem(exam, submitter?.Username, submitter?.DisplayName, questionCount);
            })
            .ToList();
    }

    private static ExamListItemDto MapExamListItem(
        Exam exam,
        string? submittedByUsername = null,
        string? submittedByDisplayName = null,
        int questionCount = 0) => new()
    {
        Id = exam.Id,
        SubjectCode = exam.SubjectCode,
        PaperCode = exam.PaperCode,
        SubjectName = ExamDtoMapper.ResolveSubjectName(exam),
        ExamType = exam.ExamType.ToString(),
        Semester = ExamDtoMapper.ResolveSemester(exam).ToString(),
        Major = ExamDtoMapper.ResolveMajor(exam),
        QuestionCount = exam.Questions.Count > 0 ? exam.Questions.Count : questionCount,
        Status = exam.Status.ToString(),
        Description = exam.Description,
        ContentHash = exam.ContentHash,
        CreatedAt = exam.CreatedAt,
        UpdatedAt = exam.UpdatedAt,
        RevisionOfExamId = exam.RevisionOfExamId,
        RejectionReasonCode = exam.RejectionReasonCode,
        RejectionReasonDetail = exam.RejectionReasonDetail,
        RejectedAt = exam.RejectedAt,
        CanResubmit = CanModeratorResubmit(exam),
        IsContentLocked = IsContentLocked(exam),
        RevisionSourceSubjectCode = exam.RevisionOfExam?.SubjectCode,
        RevisionSourcePaperCode = exam.RevisionOfExam?.PaperCode,
        SubmittedByUsername = submittedByUsername,
        SubmittedByDisplayName = submittedByDisplayName,
        IsPinned = exam.IsPinned,
    };

    private async Task CloneExamAttachmentsAsync(
        Guid sourceExamId,
        Guid targetExamId,
        CancellationToken cancellationToken)
    {
        var attachments = await _attachmentRepository.GetByExamIdAsync(sourceExamId, cancellationToken);
        foreach (var attachment in attachments)
        {
            await _attachmentRepository.AddAsync(new ExamAttachment
            {
                Id = Guid.NewGuid(),
                ExamId = targetExamId,
                DriveFileId = attachment.DriveFileId,
                OriginalFileName = attachment.OriginalFileName,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                CreatedAt = DateTime.UtcNow,
            }, cancellationToken);
        }
    }
}
