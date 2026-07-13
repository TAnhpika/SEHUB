using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public sealed class QuestionCommentService : IQuestionCommentService
{
    private readonly IQuestionCommentRepository _commentRepository;
    private readonly IExamRepository _examRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public QuestionCommentService(
        IQuestionCommentRepository commentRepository,
        IExamRepository examRepository,
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _commentRepository = commentRepository;
        _examRepository = examRepository;
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<QuestionCommentDto>> GetCommentsAsync(
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default)
    {
        await EnsureQuestionExistsAsync(examId, questionId, cancellationToken);

        var comments = await _commentRepository.GetByQuestionIdAsync(examId, questionId, cancellationToken);
        return await MapCommentsAsync(comments, cancellationToken);
    }

    public async Task<QuestionCommentDto> CreateAsync(
        Guid examId,
        Guid questionId,
        CreateQuestionCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsurePremiumAsync(cancellationToken);
        await EnsureQuestionExistsAsync(examId, questionId, cancellationToken);

        if (request.ParentCommentId is Guid parentId)
        {
            var parent = await _commentRepository.GetByIdAsync(parentId, cancellationToken)
                ?? throw new NotFoundException("Comment", parentId);

            if (parent.ExamId != examId || parent.QuestionId != questionId)
            {
                throw new NotFoundException("Comment", parentId);
            }
        }

        var content = HtmlContentHelper.ToPlainText(request.Content);
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new DomainException("Nội dung bình luận không được để trống.");
        }

        var comment = new QuestionComment
        {
            Id = Guid.NewGuid(),
            ExamId = examId,
            QuestionId = questionId,
            AuthorId = userId,
            ParentCommentId = request.ParentCommentId,
            Content = content,
            CreatedAt = DateTime.UtcNow,
        };

        await _commentRepository.AddAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (await MapCommentsAsync([comment], cancellationToken))[0];
    }

    public async Task DeleteAsync(
        Guid examId,
        Guid questionId,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment", commentId);

        if (comment.ExamId != examId || comment.QuestionId != questionId)
        {
            throw new NotFoundException("Comment", commentId);
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new ForbiddenException("Authentication required.");

        var isOwner = comment.AuthorId == userId;
        var isStaff = user.Role is RoleNames.Admin or RoleNames.Moderator;
        if (!isOwner && !isStaff)
        {
            throw new ForbiddenException("You can only delete your own comments.");
        }

        await _commentRepository.SoftDeleteAsync(comment, userId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsurePremiumAsync(CancellationToken cancellationToken)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        if (_currentUser.IsModeratorOrAdmin || _currentUser.IsPremium)
        {
            return;
        }

        throw new ForbiddenException(ErrorCodes.PremiumRequired);
    }

    private async Task EnsureQuestionExistsAsync(Guid examId, Guid questionId, CancellationToken cancellationToken)
    {
        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        _ = exam.Questions.FirstOrDefault(q => q.Id == questionId)
            ?? throw new NotFoundException("Question", questionId);
    }

    private async Task<IReadOnlyList<QuestionCommentDto>> MapCommentsAsync(
        IReadOnlyList<QuestionComment> comments,
        CancellationToken cancellationToken)
    {
        var authorIds = comments
            .SelectMany(c => new[] { c }.Concat(c.Replies))
            .Select(c => c.AuthorId)
            .Distinct()
            .ToList();

        var users = await _userRepository.GetByIdsAsync(authorIds, cancellationToken);
        var profiles = await _profileRepository.GetByUserIdsAsync(authorIds, cancellationToken);
        var usersById = users.ToDictionary(u => u.Id);
        var profilesByUserId = profiles.ToDictionary(p => p.UserId);

        QuestionCommentDto MapOne(QuestionComment comment) =>
            new()
            {
                Id = comment.Id,
                Content = comment.Content,
                ParentCommentId = comment.ParentCommentId,
                CreatedAt = comment.CreatedAt,
                Author = MapAuthor(comment.AuthorId),
                Replies = comment.Replies.Count > 0
                    ? comment.Replies.OrderBy(r => r.CreatedAt).Select(MapOne).ToList()
                    : null,
            };

        QuestionCommentAuthorDto MapAuthor(Guid authorId)
        {
            usersById.TryGetValue(authorId, out var user);
            profilesByUserId.TryGetValue(authorId, out var profile);

            return new QuestionCommentAuthorDto
            {
                Id = authorId,
                Username = user?.Username ?? "unknown",
                DisplayName = user?.DisplayName ?? user?.Username ?? "User",
                AvatarUrl = profile?.AvatarUrl,
            };
        }

        return comments.Select(MapOne).ToList();
    }
}
