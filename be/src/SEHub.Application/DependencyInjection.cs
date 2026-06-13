using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Admin;
using SEHub.Application.Admin.Validators;
using SEHub.Application.Auth;
using SEHub.Application.Auth.Validators;
using SEHub.Application.Documents;
using SEHub.Application.Exams;
using SEHub.Application.Exams.Validators;
using SEHub.Application.Feed;
using SEHub.Application.Feed.Validators;
using SEHub.Application.Gamification;
using SEHub.Application.Mapping;
using SEHub.Application.Premium;

using SEHub.Application.Premium.Validators;
using SEHub.Application.Profiles;
using SEHub.Application.Profiles.Validators;
using SEHub.Application.Users;
using SEHub.Application.Messaging;
using SEHub.Application.Notifications;
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

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IOtpService, OtpService>();

        services.AddScoped<IPostService, PostService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IPostLikeService, PostLikeService>();
        services.AddScoped<IPostReportService, PostReportService>();
        services.AddScoped<IGamificationService, GamificationService>();
        services.AddScoped<IBadgeCheckService, BadgeCheckService>();
        services.AddScoped<IGamificationCatalogService, GamificationCatalogService>();

        services.AddScoped<IExamQueryService, ExamQueryService>();
        services.AddScoped<IExamAttemptService, ExamAttemptService>();
        services.AddScoped<IExamGradingService, ExamGradingService>();
        services.AddScoped<IAiExplanationApplicationService, AiExplanationApplicationService>();
        services.AddScoped<IPracticeSubmissionService, PracticeSubmissionService>();

        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IDocumentAccessService, DocumentAccessService>();

        services.AddScoped<IPremiumService, PremiumService>();
        services.AddScoped<IPaymentOrderMaintenanceService, PaymentOrderMaintenanceService>();
        services.AddScoped<IPremiumRefundService, PremiumRefundService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IN8nPremiumActivationService, N8nPremiumActivationService>();
        services.AddScoped<IValidator<N8NPremiumActivationDto>, N8nPremiumActivationValidator>();
        services.AddScoped<IValidator<PremiumRefundRequestDto>, PremiumRefundRequestValidator>();

        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IProfileStatsService, ProfileStatsService>();
        services.AddScoped<IProfileActivityService, ProfileActivityService>();
        services.AddScoped<IUserActivityService, UserActivityService>();

        services.AddScoped<IUserSearchService, UserSearchService>();
        services.AddScoped<IFollowService, FollowService>();
        services.AddScoped<IMessagingService, MessagingService>();
        services.AddScoped<IConversationReportService, ConversationReportService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IUserBlockService, UserBlockService>();

        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminExamService, AdminExamService>();
        services.AddScoped<IAdminDocumentService, AdminDocumentService>();
        services.AddScoped<IModerationService, ModerationService>();
        services.AddScoped<IAdminPaymentService, AdminPaymentService>();
        services.AddScoped<IAdminGamificationService, AdminGamificationService>();
        services.AddScoped<IOcrExamService, OcrExamService>();

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
