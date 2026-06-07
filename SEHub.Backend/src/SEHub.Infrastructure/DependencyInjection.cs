using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Abstractions;
using SEHub.Application.Auth;
using SEHub.Infrastructure.Ai;
using SEHub.Infrastructure.Auth;
using SEHub.Infrastructure.Email;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Payments;
using SEHub.Infrastructure.Persistence;
using SEHub.Infrastructure.Persistence.Interceptors;
using SEHub.Infrastructure.Persistence.Repositories;
using SEHub.Infrastructure.Sms;
using SEHub.Infrastructure.Storage;

namespace SEHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddMemoryCache();

        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IPremiumStatusService, PremiumStatusService>();
        services.AddScoped<SoftDeleteInterceptor>();
        services.AddScoped<PaymentAuditLogAppendOnlyInterceptor>();

        services.AddDbContext<SEHubDbContext>((sp, options) =>
        {
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            options.AddInterceptors(
                sp.GetRequiredService<SoftDeleteInterceptor>(),
                sp.GetRequiredService<PaymentAuditLogAppendOnlyInterceptor>());
        });

        services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<SEHubDbContext>()
            .AddDefaultTokenProviders();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IOtpVerificationRepository, OtpVerificationRepository>();
        services.AddScoped<IPostRepository, PostRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<IPostLikeRepository, PostLikeRepository>();
        services.AddScoped<IPostReportRepository, PostReportRepository>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IExamAttemptRepository, ExamAttemptRepository>();
        services.AddScoped<IPracticeSubmissionRepository, PracticeSubmissionRepository>();
        services.AddScoped<IAiTokenUsageRepository, AiTokenUsageRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IDocumentCategoryRepository, DocumentCategoryRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IPaymentOrderRepository, PaymentOrderRepository>();
        services.AddScoped<ISubscriptionPlanRepository, SubscriptionPlanRepository>();
        services.AddScoped<IPaymentAuditLogRepository, PaymentAuditLogRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<ILevelConfigRepository, LevelConfigRepository>();
        services.AddScoped<IBadgeRepository, BadgeRepository>();
        services.AddScoped<IUserBadgeRepository, UserBadgeRepository>();
        services.AddScoped<IUserBanRepository, UserBanRepository>();

        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.Configure<OtpSettings>(configuration.GetSection(OtpSettings.SectionName));
        services.Configure<AuthSettings>(configuration.GetSection(AuthSettings.SectionName));
        services.Configure<GoogleAuthSettings>(configuration.GetSection(GoogleAuthSettings.SectionName));
        services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();

        var emailProvider = configuration.GetSection($"{EmailSettings.SectionName}:Provider").Get<string>() ?? "Logging";
        if (emailProvider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
        }
        else
        {
            services.AddScoped<IEmailService, LoggingEmailService>();
        }

        services.AddScoped<ISmsService, MockSmsService>();
        services.AddScoped<IPayOsService, PayOsService>();
        services.AddScoped<IPayOsWebhookHandler, PayOsWebhookHandler>();
        services.AddScoped<IAiExplanationService, MockAiExplanationService>();

        return services;
    }
}
