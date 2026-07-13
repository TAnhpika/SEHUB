using AutoMapper;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Admin;
using SEHub.Application.Mapping;
using SEHub.Application.Notifications;
using SEHub.Contracts.Admin;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Admin;

public sealed class AdminExamServicePinTests
{
    private readonly Mock<IExamRepository> _examRepository = new();
    private readonly Mock<ISubjectRepository> _subjectRepository = new();
    private readonly Mock<IExamAttachmentRepository> _attachmentRepository = new();
    private readonly Mock<IQuestionAttachmentRepository> _questionAttachmentRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly IMapper _mapper;

    private static readonly Guid SubmitterId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    public AdminExamServicePinTests()
    {
        _mapper = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>()).CreateMapper();
        _questionAttachmentRepository
            .Setup(r => r.GetByQuestionIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
    }

    private AdminExamService CreateSut() => new(
        _examRepository.Object,
        _subjectRepository.Object,
        _attachmentRepository.Object,
        _questionAttachmentRepository.Object,
        _unitOfWork.Object,
        _currentUser.Object,
        _workflowNotifications.Object,
        _userRepository.Object,
        _mapper);

    [Fact]
    public async Task CreatePracticeExam_WithPin_UnpinsOtherPracticeExamsForSameSubject()
    {
        const string subjectCode = "PRF192";
        var subject = new Subject { Code = subjectCode, Name = "Programming Fundamentals", Semester = 1 };
        _subjectRepository
            .Setup(r => r.GetByCodeAsync(subjectCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(subject);
        _examRepository
            .Setup(r => r.GetByPaperCodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Exam?)null);
        _examRepository
            .Setup(r => r.GetByContentHashAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Exam?)null);
        _attachmentRepository
            .Setup(r => r.GetByExamIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _currentUser.SetupGet(u => u.UserId).Returns(SubmitterId);

        Exam? captured = null;
        _examRepository
            .Setup(r => r.AddAsync(It.IsAny<Exam>(), It.IsAny<CancellationToken>()))
            .Callback<Exam, CancellationToken>((exam, _) => captured = exam);

        var sut = CreateSut();
        await sut.CreateExamAsync(new CreateExamRequest
        {
            SubjectCode = subjectCode,
            PaperCode = "PIN-UNIT-TEST-01",
            ExamType = nameof(ExamType.Practice),
            Description = "Pinned practice exam unit test.",
            IsPinned = true
        });

        _examRepository.Verify(
            r => r.UnpinPracticeExamsBySubjectCodeAsync(
                subjectCode,
                It.Is<Guid?>(id => id.HasValue),
                It.IsAny<CancellationToken>()),
            Times.Once);

        captured.Should().NotBeNull();
        captured!.IsPinned.Should().BeTrue();
        captured.PinnedAt.Should().NotBeNull();
        captured.ExamType.Should().Be(ExamType.Practice);
    }

    [Fact]
    public async Task CreateFinalExam_WithPin_DoesNotPinOrUnpin()
    {
        const string subjectCode = "MAE101";
        var subject = new Subject { Code = subjectCode, Name = "Math", Semester = 2 };
        _subjectRepository
            .Setup(r => r.GetByCodeAsync(subjectCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(subject);
        _examRepository
            .Setup(r => r.GetByPaperCodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Exam?)null);
        _examRepository
            .Setup(r => r.GetByContentHashAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Exam?)null);
        _attachmentRepository
            .Setup(r => r.GetByExamIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _currentUser.SetupGet(u => u.UserId).Returns(SubmitterId);

        Exam? captured = null;
        _examRepository
            .Setup(r => r.AddAsync(It.IsAny<Exam>(), It.IsAny<CancellationToken>()))
            .Callback<Exam, CancellationToken>((exam, _) => captured = exam);

        var sut = CreateSut();
        await sut.CreateExamAsync(new CreateExamRequest
        {
            SubjectCode = subjectCode,
            PaperCode = "PIN-FINAL-IGNORED",
            ExamType = nameof(ExamType.Final),
            Description = "Final exams cannot be pinned.",
            IsPinned = true,
            Questions =
            [
                new CreateExamQuestionItem
                {
                    OrderIndex = 1,
                    Content = "1 + 1 = ?",
                    CorrectOptionId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    Options =
                    [
                        new CreateExamOptionItem
                        {
                            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                            Label = "A",
                            Text = "2"
                        }
                    ]
                }
            ]
        });

        _examRepository.Verify(
            r => r.UnpinPracticeExamsBySubjectCodeAsync(
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        captured.Should().NotBeNull();
        captured!.IsPinned.Should().BeFalse();
        captured.PinnedAt.Should().BeNull();
    }
}
