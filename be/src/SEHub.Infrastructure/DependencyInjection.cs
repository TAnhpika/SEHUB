using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Auth;
using SEHub.Infrastructure.Ai;
using SEHub.Infrastructure.Auth;
using SEHub.Infrastructure.Email;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Notifications;
using SEHub.Infrastructure.Payments;
using SEHub.Infrastructure.Persistence;
using SEHub.Infrastructure.Persistence.Interceptors;
using SEHub.Infrastructure.Caching;
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
        services.AddScoped<IClientContext, ClientContext>();
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
        services.AddScoped<IQuestionReportRepository, QuestionReportRepository>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IExamAttemptRepository, ExamAttemptRepository>();
        services.AddScoped<IPracticeSubmissionRepository, PracticeSubmissionRepository>();
        services.AddScoped<IAiTokenUsageRepository, AiTokenUsageRepository>();
        services.AddScoped<IAiExamChatRepository, AiExamChatRepository>();
        services.AddScoped<IChatbotRepository, ChatbotRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IDocumentAccessLogRepository, DocumentAccessLogRepository>();
        services.AddScoped<IDocumentCategoryRepository, DocumentCategoryRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IPaymentOrderRepository, PaymentOrderRepository>();
        services.AddScoped<ISubscriptionPlanRepository, SubscriptionPlanRepository>();
        services.AddScoped<IPaymentAuditLogRepository, PaymentAuditLogRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<ILevelConfigRepository, LevelConfigRepository>();
        services.AddScoped<IBadgeRepository, BadgeRepository>();
        services.AddScoped<IUserBadgeRepository, UserBadgeRepository>();
        services.AddScoped<IUserDailyActivityRepository, UserDailyActivityRepository>();
        services.AddScoped<IProfileActivityCache, ProfileActivityCache>();
        services.AddScoped<IProfileSnapshotCache, ProfileSnapshotCache>();
        services.AddScoped<IUserBanRepository, UserBanRepository>();
        services.AddScoped<IUserSearchRepository, UserSearchRepository>();
        services.AddScoped<IUserFollowRepository, UserFollowRepository>();
        services.AddScoped<IConversationRepository, ConversationRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IUserBlockRepository, UserBlockRepository>();
        services.AddScoped<IConversationReportRepository, ConversationReportRepository>();
        services.AddScoped<IExamAttachmentRepository, ExamAttachmentRepository>();
        services.AddScoped<IPostImageRepository, PostImageRepository>();
        services.AddScoped<IChatNotifier, NullChatNotifier>();
        services.AddScoped<INotificationNotifier, NullNotificationNotifier>();

        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        services.Configure<GoogleDriveOptions>(configuration.GetSection(GoogleDriveOptions.SectionName));
        services.AddScoped<ICloudFileStorageService, GoogleDriveStorageService>();

        services.Configure<CloudinaryOptions>(configuration.GetSection(CloudinaryOptions.SectionName));
        services.AddSingleton<ICdnFolderSettings, CdnFolderSettings>();
        services.AddScoped<IImageCdnStorageService, CloudinaryStorageService>();

        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.Configure<OtpSettings>(configuration.GetSection(OtpSettings.SectionName));
        services.Configure<AuthSettings>(configuration.GetSection(AuthSettings.SectionName));
        services.Configure<GoogleAuthSettings>(configuration.GetSection(GoogleAuthSettings.SectionName));
        services.Configure<N8nSettings>(configuration.GetSection(N8nSettings.SectionName));
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
        services.AddHttpClient(nameof(PayOsService), client =>
        {
            client.BaseAddress = new Uri("https://api-merchant.payos.vn/");
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddScoped<IPayOsService, PayOsService>();
        services.AddScoped<IPayOsWebhookHandler, PayOsWebhookHandler>();
        services.AddHttpClient<IPaymentNotificationWebhook, N8nPaymentNotificationWebhook>((sp, client) =>
        {
            var settings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<N8nSettings>>().Value;
            var timeoutSeconds = Math.Clamp(settings.TimeoutSeconds, 3, 60);
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        });
        services.AddHttpClient<IPaymentRefundNotificationWebhook, N8nPaymentRefundWebhook>((sp, client) =>
        {
            var settings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<N8nSettings>>().Value;
            var timeoutSeconds = Math.Clamp(settings.TimeoutSeconds, 3, 60);
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        });
        services.AddScoped<IPaymentConfirmationNotifier, PaymentConfirmationNotifier>();
        var environmentName = configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT");
        if (!string.Equals(environmentName, "Testing", StringComparison.OrdinalIgnoreCase))
        {
            services.AddHostedService<PaymentOrderExpiryBackgroundService>();
        }

        if (AiInfrastructureRegistration.ShouldUseOpenRouter(configuration))
        {
            services.AddOpenRouterClient();
            services.AddScoped<IAiProvider, OpenRouterAiProvider>();
            services.AddScoped<IAiExplanationService, GeminiAiExplanationService>();
        }
        else
        {
            services.AddScoped<IAiProvider, MockAiProvider>();
            services.AddScoped<IAiExplanationService, MockAiExplanationService>();
        }

        return services;
    }
}

