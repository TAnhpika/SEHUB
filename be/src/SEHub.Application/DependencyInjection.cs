using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Abstractions;
using SEHub.Application.Admin;
using SEHub.Application.Admin.Validators;
using SEHub.Application.Auth;
using SEHub.Application.Auth.Validators;
using SEHub.Application.Chatbot;
using SEHub.Application.Documents;
using SEHub.Application.Exams;
using SEHub.Application.Exams.Validators;
using SEHub.Application.Feedback;
using SEHub.Application.Feed;
using SEHub.Application.Feed.Validators;
using SEHub.Application.Gamification;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Engines;
using SEHub.Application.Gamification.Orchestration;
using SEHub.Application.Mapping;
using SEHub.Application.Premium;

using SEHub.Application.Premium.Validators;
using SEHub.Application.Profiles;
using SEHub.Application.Profiles.Validators;
using SEHub.Application.Subjects;
using SEHub.Application.Trust;
using SEHub.Application.Users;
using SEHub.Application.Messaging;
using SEHub.Application.Notifications;
using SEHub.Application.Presence;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Exams;
using SEHub.Contracts.Feed;
using SEHub.Contracts.Premium;
using SEHub.Contracts.Profiles;

namespace SEHub.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(MappingProfile));

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        services.AddScoped<IGamificationEventPublisher, GamificationEventPublisher>();
        services.AddScoped<IPointEngine, PointEngine>();
        services.AddScoped<IRewardEngine, RewardEngine>();
        services.AddScoped<ILevelEngine, LevelEngine>();
        services.AddScoped<IStreakEngine, StreakEngine>();
        services.AddScoped<IHeatmapProjection, HeatmapProjection>();
        services.AddScoped<IAchievementEngine, BadgeCheckService>();
        services.AddScoped<IGamificationReadService, GamificationReadService>();
        services.AddScoped<LeaderboardService>();
        services.AddScoped<ILeaderboardService, CachedLeaderboardService>();
        services.AddScoped<IMissionProgressService, MissionProgressService>();
        services.AddScoped<IBanStatusService, BanStatusService>();
        services.AddScoped<IUserBanSyncService, UserBanSyncService>();
        services.AddScoped<IAccountPenaltyService, AccountPenaltyService>();
        services.AddScoped<IPointsReconciliationService, PointsReconciliationService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IOtpService, OtpService>();

        services.AddScoped<IPostService, PostService>();
        services.AddScoped<IPostImageService, PostImageService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IPostLikeService, PostLikeService>();
        services.AddScoped<IPostReportService, PostReportService>();
        services.AddScoped<ICommentReportService, CommentReportService>();
        services.AddScoped<IGamificationService, GamificationService>();
        services.AddScoped<IBadgeCheckService, BadgeCheckService>();
        services.AddScoped<IGamificationCatalogService, GamificationCatalogService>();

        services.AddScoped<IExamQueryService, ExamQueryService>();
        services.AddScoped<IExamAttachmentService, ExamAttachmentService>();
        services.AddScoped<IExamAttemptService, ExamAttemptService>();
        services.AddScoped<IExamGradingService, ExamGradingService>();
        services.AddScoped<IAiExplanationApplicationService, AiExplanationApplicationService>();
        services.AddScoped<IAiExamChatApplicationService, AiExamChatApplicationService>();
        services.AddScoped<IChatbotApplicationService, ChatbotApplicationService>();
        services.AddScoped<IAdminChatbotService, AdminChatbotService>();
        services.AddScoped<IAiTokenService, AiTokenService>();
        services.AddScoped<IPracticeSubmissionService, PracticeSubmissionService>();
        services.AddScoped<IQuestionReportService, QuestionReportService>();
        services.AddScoped<IQuestionCommentService, QuestionCommentService>();

        services.AddScoped<IFeedbackService, FeedbackService>();
        services.AddScoped<ISubjectCatalogService, SubjectCatalogService>();
        services.AddScoped<ISubjectLookupService, SubjectLookupService>();

        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IDocumentAccessService, DocumentAccessService>();

        services.AddScoped<IPremiumService, PremiumService>();
        services.AddScoped<IPaymentOrderMaintenanceService, PaymentOrderMaintenanceService>();
        services.AddScoped<IPremiumRefundService, PremiumRefundService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IN8nPremiumActivationService, N8nPremiumActivationService>();
        services.AddScoped<IValidator<N8NPremiumActivationDto>, N8nPremiumActivationValidator>();
        services.AddScoped<IValidator<PremiumRefundRequestDto>, PremiumRefundRequestValidator>();
        services.AddScoped<IValidator<PremiumRefundBankDetailsRequest>, PremiumRefundBankDetailsValidator>();

        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IProfileStatsService, ProfileStatsService>();
        services.AddScoped<IExamAttemptHistoryService, ExamAttemptHistoryService>();
        services.AddScoped<IProfileActivityService, ProfileActivityService>();
        services.AddScoped<IUserActivityService, UserActivityService>();

        services.AddScoped<IUserSearchService, UserSearchService>();
        services.AddScoped<IFollowService, FollowService>();
        services.AddScoped<IMessagingService, MessagingService>();
        services.AddSingleton<IUserPresenceTracker, UserPresenceTracker>();
        services.AddScoped<IUserPresenceService, UserPresenceService>();
        services.AddScoped<IConversationReportService, ConversationReportService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IWorkflowNotificationService, WorkflowNotificationService>();
        services.AddScoped<IUserBlockService, UserBlockService>();
        services.AddScoped<IUserReportService, UserReportService>();
        services.AddSingleton<TrustScoreCalculator>();
        services.AddScoped<ITrustScoreService, TrustScoreService>();

        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IAdminDashboardChartsService, AdminDashboardChartsService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminExamService, AdminExamService>();
        services.AddScoped<IAdminDocumentService, AdminDocumentService>();
        services.AddScoped<IDocumentDriveMigrationService, DocumentDriveMigrationService>();
        services.AddScoped<IModerationService, ModerationService>();
        services.AddScoped<IAdminPaymentService, AdminPaymentService>();
        services.AddScoped<IAdminGamificationService, AdminGamificationService>();
        services.AddScoped<IAdminVoucherService, AdminVoucherService>();
        services.AddScoped<IAdminAuditLogService, AdminAuditLogService>();
        services.AddScoped<IAdminExportService, AdminExportService>();
        services.AddScoped<IAdminOverviewService, AdminOverviewService>();
        services.AddScoped<IOcrExamService, OcrExamService>();
        services.AddScoped<IExamMarkdownImportService, ExamMarkdownImportService>();
        services.AddScoped<IExamImageService, ExamImageService>();

        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();
        services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
        services.AddScoped<IValidator<RefreshTokenRequest>, RefreshTokenRequestValidator>();
        services.AddScoped<IValidator<ResetPasswordRequest>, ResetPasswordRequestValidator>();
        services.AddScoped<IValidator<SendEmailVerificationRequest>, SendEmailVerificationRequestValidator>();
        services.AddScoped<IValidator<VerifyEmailRequest>, VerifyEmailRequestValidator>();
        services.AddScoped<IValidator<SendSmsOtpRequest>, SendSmsOtpRequestValidator>();
        services.AddScoped<IValidator<VerifySmsOtpRequest>, VerifySmsOtpRequestValidator>();
        services.AddScoped<IValidator<GoogleAuthRequest>, GoogleAuthRequestValidator>();
        services.AddScoped<IValidator<CreatePostRequest>, CreatePostRequestValidator>();
        services.AddScoped<IValidator<UpdatePostRequest>, UpdatePostRequestValidator>();
        services.AddScoped<IValidator<CreateCommentRequest>, CreateCommentRequestValidator>();
        services.AddScoped<IValidator<ReportPostRequest>, ReportPostRequestValidator>();
        services.AddScoped<IValidator<ModeratePostRequest>, ModeratePostRequestValidator>();
        services.AddScoped<IValidator<ModeratorBanUserRequest>, ModeratorBanUserRequestValidator>();
        services.AddScoped<IValidator<ModeratorWarnUserRequest>, ModeratorWarnUserRequestValidator>();
        services.AddScoped<IValidator<UpdateDocumentRequest>, UpdateDocumentRequestValidator>();
        services.AddScoped<IValidator<AdminUserPatchRequest>, AdminUserPatchRequestValidator>();
        services.AddScoped<IValidator<UpdateLevelsRequest>, UpdateLevelsRequestValidator>();
        services.AddScoped<IValidator<CreateBadgeRequest>, CreateBadgeRequestValidator>();
        services.AddScoped<IValidator<UpdateBadgeRequest>, UpdateBadgeRequestValidator>();
        services.AddScoped<IValidator<GrantTokensRequest>, GrantTokensRequestValidator>();
        services.AddScoped<IValidator<SaveAnswersRequest>, SaveAnswersRequestValidator>();
        services.AddScoped<IValidator<SubmitPracticeRequest>, SubmitPracticeRequestValidator>();
        services.AddScoped<IValidator<UpdateProfileRequest>, UpdateProfileRequestValidator>();

        return services;
    }
}
