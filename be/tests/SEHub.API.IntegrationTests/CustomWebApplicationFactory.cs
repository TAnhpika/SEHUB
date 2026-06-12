using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Identity;
using SEHub.API.IntegrationTests.Auth;
using SEHub.Application.Abstractions;
using IGoogleTokenValidator = SEHub.Application.Abstractions.IGoogleTokenValidator;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public static readonly Guid FreeUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public const string FreeUserEmail = "free@test.local";
    public const string FreeUserPassword = "Free@Test123";

    public static readonly Guid PublishedExamId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid SubscriptionPlanId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid PendingPaymentOrderId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public const string PayOsOrderCode = "9876543210";
    public const string N8nInboundSecretKey = "integration-n8n-secret";
    public const string WebhookReference = "payos-ref-001";
    public const string SoftDeletedPostTitle = "Soft Deleted Post Should Not Appear";
    public static readonly Guid SoftDeletedPostId = Guid.Parse("55555555-5555-5555-5555-555555555555");

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

            services.AddDbContext<SEHubDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
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
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Posts.AnyAsync(p => p.Id != SoftDeletedPostId))
        {
            context.Posts.Add(new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = FreeUserId,
                Title = "Integration Test Post",
                Content = "Published post for integration tests.",
                Tags = "test",
                Status = PostStatus.Published,
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
                Tags = "test",
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
                Code = "INT-001",
                Title = "Integration Final Exam",
                ExamType = ExamType.Final,
                Semester = 1,
                Major = "SE",
                QuestionCount = 0,
                Status = ExamStatus.Published,
                ContentHash = "integration-exam-hash",
                Description = "Exam for integration tests",
                CreatedAt = DateTime.UtcNow
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
}
