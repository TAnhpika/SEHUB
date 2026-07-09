using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Exams;

public sealed class ExamContentAccessTests
{
    private static readonly Guid ExamId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static Exam PublishedExam() => new()
    {
        Id = ExamId,
        SubjectCode = "EX-001",
        PaperCode = "Sample",
        ExamType = ExamType.Final,
        Status = ExamStatus.Published
    };

    [Fact]
    public void CanViewExamContent_Guest_ReturnsFalse()
    {
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.SetupGet(u => u.UserId).Returns((Guid?)null);

        ExamContentAccess.CanViewExamContent(currentUser.Object, PublishedExam()).Should().BeFalse();
    }

    [Fact]
    public void EnsureCanViewExamContent_Guest_ThrowsForbidden()
    {
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.SetupGet(u => u.UserId).Returns((Guid?)null);

        var act = () => ExamContentAccess.EnsureCanViewExamContent(currentUser.Object, PublishedExam());

        act.Should().Throw<ForbiddenException>();
    }

    [Fact]
    public void CanViewExamContent_FreeUserOnPublishedExam_ReturnsTrue()
    {
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.SetupGet(u => u.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(u => u.IsPremium).Returns(false);
        currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);

        ExamContentAccess.CanViewExamContent(currentUser.Object, PublishedExam()).Should().BeTrue();
    }

    [Fact]
    public void EnsureCanViewExamContent_UnpublishedExamForFreeUser_ThrowsNotFound()
    {
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.SetupGet(u => u.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);

        var exam = PublishedExam();
        exam.Status = ExamStatus.PendingApproval;

        var act = () => ExamContentAccess.EnsureCanViewExamContent(currentUser.Object, exam);

        act.Should().Throw<NotFoundException>();
    }

    [Fact]
    public void CanViewExamContent_ModeratorOnUnpublishedExam_ReturnsTrue()
    {
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.SetupGet(u => u.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(true);

        var exam = PublishedExam();
        exam.Status = ExamStatus.PendingApproval;

        ExamContentAccess.CanViewExamContent(currentUser.Object, exam).Should().BeTrue();
    }
}
