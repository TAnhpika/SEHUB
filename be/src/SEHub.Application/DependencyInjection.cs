using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Admin;
using SEHub.Application.Auth;
using SEHub.Application.Auth.Validators;
using SEHub.Application.Documents;
using SEHub.Application.Exams;
using SEHub.Application.Exams.Validators;
using SEHub.Application.Feed;
using SEHub.Application.Feed.Validators;
using SEHub.Application.Mapping;
using SEHub.Application.Premium;
using SEHub.Application.Profiles;
using SEHub.Application.Profiles.Validators;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Exams;
using SEHub.Contracts.Feed;
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

        services.AddScoped<IExamQueryService, ExamQueryService>();
        services.AddScoped<IExamAttemptService, ExamAttemptService>();
        services.AddScoped<IExamGradingService, ExamGradingService>();
        services.AddScoped<IAiExplanationApplicationService, AiExplanationApplicationService>();
        services.AddScoped<IPracticeSubmissionService, PracticeSubmissionService>();

        services.AddScoped<IDocumentService, DocumentService>();

        services.AddScoped<IPremiumService, PremiumService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();

        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IProfileStatsService, ProfileStatsService>();

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
        services.AddScoped<IValidator<SaveAnswersRequest>, SaveAnswersRequestValidator>();
        services.AddScoped<IValidator<SubmitPracticeRequest>, SubmitPracticeRequestValidator>();
        services.AddScoped<IValidator<UpdateProfileRequest>, UpdateProfileRequestValidator>();

        return services;
    }
}
