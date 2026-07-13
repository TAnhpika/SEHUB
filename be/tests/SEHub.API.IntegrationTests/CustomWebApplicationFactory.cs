using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.IdentityModel.Tokens;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Identity;
using SEHub.API.IntegrationTests.Auth;
using SEHub.Application.Abstractions;
using IGoogleTokenValidator = SEHub.Application.Abstractions.IGoogleTokenValidator;
using SEHub.Infrastructure.Persistence;
using SEHub.Infrastructure.Persistence.Repositories;
using SEHub.Shared.Constants;
using SEHub.API.IntegrationTests.Storage;

namespace SEHub.API.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public static readonly Guid FreeUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public const string FreeUserEmail = "free@test.local";
    public const string FreeUserPassword = "Free@Test123";

    public static readonly Guid PublishedExamId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid SubmittedExamAttemptId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
    public static readonly Guid PracticeExamId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid PracticeSubmissionId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid SubscriptionPlanId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid PendingPaymentOrderId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public const string PayOsOrderCode = "9876543210";
    public const string N8nInboundSecretKey = "integration-n8n-secret";
    public const string WebhookReference = "payos-ref-001";
    public const string SoftDeletedPostTitle = "Soft Deleted Post Should Not Appear";
    public static readonly Guid SoftDeletedPostId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    public static readonly Guid RejectedPostId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    public static readonly Guid PendingPostId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    public static readonly Guid RejectModerationPostId = Guid.Parse("77777777-7777-7777-7777-777777777778");
    public static readonly Guid ReportSeedPostId = Guid.Parse("77777777-7777-7777-7777-777777777779");
    public static readonly Guid ReportSeedCommentId = Guid.Parse("77777777-7777-7777-7777-77777777777a");
    public static readonly Guid ModeratorUserId = Guid.Parse("88888888-8888-8888-8888-888888888888");
    public const string ModeratorEmail = "moderator@test.local";
    public const string ModeratorPassword = "Mod@Test123";
    public static readonly Guid AdminUserId = Guid.Parse("99999999-9999-9999-9999-99999999999a");    public const string AdminEmail = "admin@test.local";
    public const string AdminPassword = "Admin@Test123";
    public const string TaggedPostTitle = "CSharp Tagged Post";
    public const string RejectedPostTitle = "Rejected Post For Resubmit";

    private readonly string _databaseName = Guid.NewGuid().ToString();

    public CapturingEmailService EmailCapture { get; } = new();
    public FakeGoogleTokenValidator GoogleTokenValidator { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Testing:RelaxedRateLimits"] = "true",
                ["Jwt:Secret"] = "SEHub-Test-Secret-Key-Min-32-Chars!",
                ["Jwt:Issuer"] = "SEHub",
                ["Jwt:Audience"] = "SEHub",
                ["Jwt:ExpirationMinutes"] = "60",
                ["PayOS:ChecksumKey"] = "mock-checksum-key-dev",
                ["Otp:ExpiryMinutes"] = "10",
                ["Otp:ResendCooldownSeconds"] = "0",
                ["Otp:MaxAttempts"] = "5",
                ["Otp:MaxRequestsPerHour"] = "5",
                ["RateLimit:LoginPermitLimit"] = "100",
                ["RateLimit:GoogleLoginPermitLimit"] = "100",
                ["RateLimit:RegisterPermitLimit"] = "100",
                ["RateLimit:RefreshPermitLimit"] = "100",
                ["N8n:InboundSecretKey"] = N8nInboundSecretKey
            });
        });

        builder.ConfigureServices(services =>
        {
            var descriptors = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<SEHubDbContext>)
                    || d.ServiceType == typeof(SEHubDbContext))
                .ToList();

            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

            services.AddScoped<SEHub.Infrastructure.Persistence.Interceptors.RoleChangeAuditAppendOnlyInterceptor>();
            services.AddDbContext<SEHubDbContext>((sp, options) =>
            {
                options.UseInMemoryDatabase(_databaseName);
                options.AddInterceptors(
                    sp.GetRequiredService<SEHub.Infrastructure.Persistence.Interceptors.RoleChangeAuditAppendOnlyInterceptor>());
            });

            services.PostConfigure<SEHub.Application.Auth.JwtSettings>(options =>
            {
                options.Secret = "SEHub-Test-Secret-Key-Min-32-Chars!";
                options.Issuer = "SEHub";
                options.Audience = "SEHub";
                options.ExpirationMinutes = 60;
            });

            var emailDescriptors = services.Where(d => d.ServiceType == typeof(IEmailService)).ToList();
            foreach (var descriptor in emailDescriptors)
            {
                services.Remove(descriptor);
            }

            var googleValidatorDescriptors = services.Where(d => d.ServiceType == typeof(IGoogleTokenValidator)).ToList();
            foreach (var descriptor in googleValidatorDescriptors)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton(EmailCapture);
            services.AddScoped<IEmailService>(sp => sp.GetRequiredService<CapturingEmailService>());
            services.AddSingleton(GoogleTokenValidator);
            services.AddScoped<IGoogleTokenValidator>(sp => sp.GetRequiredService<FakeGoogleTokenValidator>());

            var cloudStorageDescriptors = services
                .Where(d => d.ServiceType == typeof(ICloudFileStorageService))
                .ToList();
            foreach (var descriptor in cloudStorageDescriptors)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<FakeCloudFileStorageService>();
            services.AddScoped<ICloudFileStorageService>(sp => sp.GetRequiredService<FakeCloudFileStorageService>());

            var cdnStorageDescriptors = services
                .Where(d => d.ServiceType == typeof(IImageCdnStorageService))
                .ToList();
            foreach (var descriptor in cdnStorageDescriptors)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<FakeImageCdnStorageService>();
            services.AddScoped<IImageCdnStorageService>(sp => sp.GetRequiredService<FakeImageCdnStorageService>());

            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = "SEHub",
                    ValidAudience = "SEHub",
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes("SEHub-Test-Secret-Key-Min-32-Chars!"))
                };
            });
        });
    }

    public async Task InitializeAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        await SeedTestDataAsync(scope.ServiceProvider);
    }

    public new Task DisposeAsync() => Task.CompletedTask;

    private static async Task SeedTestDataAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<SEHubDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        await context.Database.EnsureCreatedAsync();
        await SubjectSeedData.SyncAsync(context, NullLogger.Instance);
        await PartnerVoucherSeedData.SyncAsync(context, NullLogger.Instance);

        foreach (var role in new[] { RoleNames.Student, RoleNames.Moderator, RoleNames.Admin })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        if (!await context.LevelConfigs.AnyAsync())
        {
            context.LevelConfigs.Add(new LevelConfig
            {
                Id = Guid.NewGuid(),
                Name = "Bronze",
                MinPoints = 0,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        var bronzeLevel = await context.LevelConfigs.OrderBy(l => l.MinPoints).FirstAsync();

        if (await userManager.FindByEmailAsync(FreeUserEmail) is null)
        {
            var user = new ApplicationUser
            {
                Id = FreeUserId,
                UserName = "freeuser",
                Email = FreeUserEmail,
                EmailConfirmed = true,
                DisplayName = "Free User",
                LevelId = bronzeLevel.Id
            };

            await userManager.CreateAsync(user, FreeUserPassword);
            await userManager.AddToRoleAsync(user, RoleNames.Student);

            context.UserProfiles.Add(new UserProfile
            {
                Id = Guid.NewGuid(),
                UserId = FreeUserId,
                Major = "SE",
                Semester = 1,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var profile = await context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == FreeUserId);
            if (profile is not null)
            {
                profile.Major = "SE";
                profile.Semester = 1;
            }
        }

        if (!await context.Posts.AnyAsync(p => p.Id != SoftDeletedPostId && p.Id != RejectedPostId))
        {
            context.Posts.Add(new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = FreeUserId,
                Title = "Integration Test Post",
                Content = "Published post for integration tests.",
                Status = PostStatus.Published,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Posts.AnyAsync(p => p.Title == TaggedPostTitle))
        {
            context.Posts.Add(new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = FreeUserId,
                Title = TaggedPostTitle,
                Content = "Post used for tag filter integration tests.",
                Status = PostStatus.Published,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Posts.AnyAsync(p => p.Id == RejectedPostId))
        {
            context.Posts.Add(new Post
            {
                Id = RejectedPostId,
                AuthorId = FreeUserId,
                Title = RejectedPostTitle,
                Content = "Rejected post awaiting author resubmit.",
                Status = PostStatus.Rejected,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Posts.AnyAsync(p => p.Id == PendingPostId))
        {
            context.Posts.Add(new Post
            {
                Id = PendingPostId,
                AuthorId = FreeUserId,
                Title = "Pending Post For Moderation",
                Content = "This post awaits moderator approval before appearing on the public feed.",
                Status = PostStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var pendingPost = await context.Posts.IgnoreQueryFilters().FirstAsync(p => p.Id == PendingPostId);
            pendingPost.Status = PostStatus.Pending;
        }

        if (!await context.Posts.AnyAsync(p => p.Id == RejectModerationPostId))
        {
            context.Posts.Add(new Post
            {
                Id = RejectModerationPostId,
                AuthorId = FreeUserId,
                Title = "Reject Moderation Candidate",
                Content = "Used by integration tests for legacy post rejection API.",
                Status = PostStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var rejectCandidate = await context.Posts.IgnoreQueryFilters().FirstAsync(p => p.Id == RejectModerationPostId);
            rejectCandidate.Status = PostStatus.Pending;
        }

        if (!await context.Posts.AnyAsync(p => p.Id == ReportSeedPostId))
        {
            context.Posts.Add(new Post
            {
                Id = ReportSeedPostId,
                AuthorId = FreeUserId,
                Title = "Report Seed Post",
                Content = "Published post with a comment for report integration tests.",
                Status = PostStatus.Published,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (await userManager.FindByEmailAsync(ModeratorEmail) is null)
        {
            var moderator = new ApplicationUser
            {
                Id = ModeratorUserId,
                UserName = "moderator",
                Email = ModeratorEmail,
                EmailConfirmed = true,
                DisplayName = "Test Moderator",
                LevelId = bronzeLevel.Id
            };

            await userManager.CreateAsync(moderator, ModeratorPassword);
            await userManager.AddToRoleAsync(moderator, RoleNames.Moderator);
        }

        if (await userManager.FindByEmailAsync(AdminEmail) is null)
        {
            var admin = new ApplicationUser
            {
                Id = AdminUserId,
                UserName = "admin",
                Email = AdminEmail,
                EmailConfirmed = true,
                DisplayName = "Test Admin",
                LevelId = bronzeLevel.Id
            };

            await userManager.CreateAsync(admin, AdminPassword);
            await userManager.AddToRoleAsync(admin, RoleNames.Admin);
        }

        if (!await context.Comments.AnyAsync(c => c.Id == ReportSeedCommentId))
        {
            context.Comments.Add(new Comment
            {
                Id = ReportSeedCommentId,
                PostId = ReportSeedPostId,
                AuthorId = ModeratorUserId,
                Content = "Offensive comment used for report integration tests.",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Posts.AnyAsync(p => p.Id == SoftDeletedPostId))
        {
            context.Posts.Add(new Post
            {
                Id = SoftDeletedPostId,
                AuthorId = FreeUserId,
                Title = SoftDeletedPostTitle,
                Content = "This post is soft-deleted and must not appear in public listings.",
                Status = PostStatus.Published,
                IsDeleted = true,
                DeletedAt = DateTime.UtcNow,
                DeletedById = FreeUserId,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Exams.AnyAsync())
        {
            context.Exams.Add(new Exam
            {
                Id = PublishedExamId,
                SubjectCode = "PRF192",
                PaperCode = "INT-FINAL-001",
                ExamType = ExamType.Final,
                Status = ExamStatus.Published,
                ContentHash = "integration-exam-hash",
                Description = "Exam for integration tests",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Exams.AnyAsync(e => e.Id == PracticeExamId))
        {
            context.Exams.Add(new Exam
            {
                Id = PracticeExamId,
                SubjectCode = "PRF192",
                PaperCode = "INT-PRAC-01",
                ExamType = ExamType.Practice,
                Status = ExamStatus.Published,
                ContentHash = "integration-practice-exam-hash",
                Description = "Practice exam for integration tests",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.PracticeSubmissions.AnyAsync(s => s.Id == PracticeSubmissionId))
        {
            context.PracticeSubmissions.Add(new PracticeSubmission
            {
                Id = PracticeSubmissionId,
                UserId = FreeUserId,
                ExamId = PracticeExamId,
                GitHubRepoUrl = "https://github.com/sehub-test/integration-lab",
                SubmittedAt = DateTime.UtcNow.AddHours(-2),
                Status = PracticeSubmissionStatus.Submitted,
                IsLatest = true,
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            });
        }

        if (!await context.ExamAttempts.AnyAsync(a => a.Id == SubmittedExamAttemptId))
        {
            context.ExamAttempts.Add(new ExamAttempt
            {
                Id = SubmittedExamAttemptId,
                UserId = ModeratorUserId,
                ExamId = PublishedExamId,
                StartedAt = DateTime.UtcNow.AddHours(-2),
                SubmittedAt = DateTime.UtcNow.AddHours(-1),
                Score = 76m,
                Status = ExamAttemptStatus.Submitted,
                AnswersJson = "{}",
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            });
        }

        if (!await context.SubscriptionPlans.AnyAsync())
        {
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Id = SubscriptionPlanId,
                Code = "1m",
                Name = "1 Month",
                DurationDays = 30,
                PriceVnd = 48000,
                CreatedAt = DateTime.UtcNow
            });
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333334"),
                Code = "8m",
                Name = "8 Months",
                DurationDays = 240,
                PriceVnd = 200000,
                CreatedAt = DateTime.UtcNow
            });
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333335"),
                Code = "4y",
                Name = "4 Years",
                DurationDays = 1460,
                PriceVnd = 650000,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.PaymentOrders.AnyAsync())
        {
            context.PaymentOrders.Add(new PaymentOrder
            {
                Id = PendingPaymentOrderId,
                UserId = FreeUserId,
                PlanId = SubscriptionPlanId,
                PayOsOrderCode = PayOsOrderCode,
                Amount = 48000,
                Status = PaymentOrderStatus.Pending,
                ExpiredAt = DateTime.UtcNow.AddMinutes(15),
                CreatedAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();
        await SeedIntegrationPostTagsAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedIntegrationPostTagsAsync(SEHubDbContext context)
    {
        var tagRepository = new PostTagRepository(context);
        var syncTargets = new (Guid? PostId, string? Title, string[] Tags)[]
        {
            (RejectedPostId, null, ["rejected"]),
            (PendingPostId, null, ["pending", "moderation"]),
            (RejectModerationPostId, null, ["reject", "moderation"]),
            (ReportSeedPostId, null, ["report", "integration"]),
            (SoftDeletedPostId, null, ["test"]),
            (null, TaggedPostTitle, ["csharp", "integration"]),
            (null, "Integration Test Post", ["test"]),
        };

        foreach (var (postId, title, tags) in syncTargets)
        {
            Guid resolvedId;
            if (postId is Guid id)
            {
                if (!await context.Posts.AnyAsync(p => p.Id == id))
                {
                    continue;
                }

                resolvedId = id;
            }
            else
            {
                var post = await context.Posts.FirstOrDefaultAsync(p => p.Title == title);
                if (post is null)
                {
                    continue;
                }

                resolvedId = post.Id;
            }

            if (await context.PostTags.AnyAsync(pt => pt.PostId == resolvedId))
            {
                continue;
            }

            await tagRepository.SyncPostTagsAsync(resolvedId, tags);
        }
    }

    public async Task<string> LoginAndGetTokenAsync(HttpClient client)
    {
        var payload = JsonSerializer.Serialize(new
        {
            emailOrUsername = FreeUserEmail,
            password = FreeUserPassword
        });

        using var response = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        return document.RootElement
            .GetProperty("data")
            .GetProperty("accessToken")
            .GetString()!;
    }

    public async Task<string> LoginModeratorAndGetTokenAsync(HttpClient client)
    {
        var payload = JsonSerializer.Serialize(new
        {
            emailOrUsername = ModeratorEmail,
            password = ModeratorPassword
        });

        using var response = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        return document.RootElement
            .GetProperty("data")
            .GetProperty("accessToken")
            .GetString()!;
    }

    public async Task<string> LoginAdminAndGetTokenAsync(HttpClient client)
    {
        var payload = JsonSerializer.Serialize(new
        {
            emailOrUsername = AdminEmail,
            password = AdminPassword
        });

        using var response = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        return document.RootElement
            .GetProperty("data")
            .GetProperty("accessToken")
            .GetString()!;
    }
}
