using SEHub.Application.Abstractions;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

/// <summary>
/// Guest may browse exam metadata; exam content (questions, PDF attachments) requires
/// authentication and a published exam (unless moderator/admin).
/// </summary>
public static class ExamContentAccess
{
    public static bool CanViewExamContent(ICurrentUserService currentUser, Exam exam)
    {
        if (currentUser.UserId is null)
        {
            return false;
        }

        if (currentUser.IsModeratorOrAdmin)
        {
            return true;
        }

        return exam.Status == ExamStatus.Published;
    }

    public static void EnsureCanViewExamContent(ICurrentUserService currentUser, Exam exam)
    {
        if (currentUser.UserId is null)
        {
            throw new ForbiddenException(ErrorCodes.Unauthorized);
        }

        if (currentUser.IsModeratorOrAdmin)
        {
            return;
        }

        if (exam.Status != ExamStatus.Published)
        {
            throw new NotFoundException("Exam", exam.Id);
        }
    }
}
