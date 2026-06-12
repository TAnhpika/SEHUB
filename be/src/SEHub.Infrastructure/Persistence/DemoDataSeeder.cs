using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SEHub.Application.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Identity;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence;

public static class DemoDataSeeder
{
    public const string DemoStudentEmail = "demo.student@sehub.local";
    public const string DemoStudentPassword = "Demo@12345";
    public const string DemoStudentUsername = "demo_student";

    public const string FreeStudentEmail = "free.student@sehub.local";
    public const string FreeStudentPassword = "Free@12345";
    public const string FreeStudentUsername = "free_student";

    public const string ModeratorEmail = "moderator@sehub.local";
    public const string ModeratorPassword = "Mod@12345";
    public const string ModeratorUsername = "demo_moderator";

    private const string DemoPostTag = "demo-seed";
    private const string DemoReportTag = "demo-seed-report";
    private const string FinalExamCode = "SE301-FINAL-01";
    private const string PracticeExamCode = "SE301-LAB-01";
    private const string DocumentCategoryName = "SE301 - Software Engineering";
    private const string DocumentTitle = "Slide SE301 - Chương 1";
    private const string DocumentRelativePath = "demo/se301-ch1.pdf";
    private const string SubscriptionPlanCode = "1m";

    private static readonly (string Code, decimal PriceVnd)[] OfficialSubscriptionPlanPrices =
    [
        ("1m", 48000),
        ("8m", 200000),
        ("4y", 650000),
    ];

    private static readonly Guid DemoStudentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid FreeStudentId = Guid.Parse("f1111111-1111-1111-1111-111111111111");
    private static readonly Guid ModeratorUserId = Guid.Parse("f2222222-2222-2222-2222-222222222222");
    private static readonly Guid SpammerUserId = Guid.Parse("f3333333-3333-3333-3333-333333333333");
    private static readonly Guid DemoSpamPostId = Guid.Parse("f4444444-4444-4444-4444-444444444401");
    private static readonly Guid DemoOffensivePostId = Guid.Parse("f4444444-4444-4444-4444-444444444402");
    private static readonly Guid DemoReportSpamId = Guid.Parse("f5555555-5555-5555-5555-555555555501");
    private static readonly Guid DemoReportHarmfulId = Guid.Parse("f5555555-5555-5555-5555-555555555502");
    private static readonly Guid DemoDocumentCategoryId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid DemoDocumentId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid DemoFinalExamId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid DemoPracticeExamId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private static readonly byte[] MinimalPdfBytes =
        "%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"u8.ToArray();

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<SEHubDbContext>>();
        var context = services.GetRequiredService<SEHubDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var subscriptionService = services.GetRequiredService<ISubscriptionService>();
        var configuration = services.GetRequiredService<IConfiguration>();

        try
        {
            await EnsurePrerequisitesAsync(context, logger);
            await RestoreOfficialSubscriptionPlanPricesAsync(context, logger);

            var before = await CaptureCountsAsync(context, userManager);
            logger.LogInformation(
                "DemoDataSeeder starting. Before: Users={Users}, Posts={Posts}, Reports={Reports}, Exams={Exams}, Questions={Questions}, Options={Options}, DocumentCategories={DocumentCategories}, Documents={Documents}, Subscriptions={Subscriptions}",
                before.Users, before.Posts, before.Reports, before.Exams, before.Questions, before.Options,
                before.DocumentCategories, before.Documents, before.Subscriptions);

            await SeedDocumentCategoryAndDocumentAsync(context, configuration, logger);
            var student = await SeedDemoStudentAsync(userManager, context, logger);
            var freeStudent = await SeedFreeStudentAsync(userManager, context, logger);
            await SeedModeratorAsync(userManager, context, logger);
            var spammer = await SeedSpammerStudentAsync(userManager, context, logger);
            await SeedFinalExamAsync(context, logger);
            await SeedPracticeExamAsync(context, logger);
            // demo.student stays Free so checkout/PayOS can be tested end-to-end.
            await SeedDemoPostsAsync(context, student.Id, logger);
            await SeedReportablePostsAsync(context, spammer.Id, logger);
            await SeedDemoPostReportsAsync(context, freeStudent.Id, student.Id, logger);

            var after = await CaptureCountsAsync(context, userManager);
            logger.LogInformation(
                "DemoDataSeeder completed. After: Users={Users}, Posts={Posts}, Reports={Reports}, Exams={Exams}, Questions={Questions}, Options={Options}, DocumentCategories={DocumentCategories}, Documents={Documents}, Subscriptions={Subscriptions}",
                after.Users, after.Posts, after.Reports, after.Exams, after.Questions, after.Options,
                after.DocumentCategories, after.Documents, after.Subscriptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding demo data.");
            throw;
        }
    }

    private static async Task EnsurePrerequisitesAsync(SEHubDbContext context, ILogger logger)
    {
        var roleCount = await context.Roles.CountAsync(r =>
            r.Name == RoleNames.Student || r.Name == RoleNames.Moderator || r.Name == RoleNames.Admin);
        if (roleCount < 3)
        {
            throw new InvalidOperationException("DemoDataSeeder requires DbSeeder roles (Student, Moderator, Admin).");
        }

        if (!await context.LevelConfigs.AnyAsync())
        {
            throw new InvalidOperationException("DemoDataSeeder requires at least one LevelConfig from DbSeeder.");
        }

        if (!await context.SubscriptionPlans.AnyAsync(p => p.Code == SubscriptionPlanCode))
        {
            throw new InvalidOperationException($"DemoDataSeeder requires SubscriptionPlan with Code '{SubscriptionPlanCode}' from DbSeeder.");
        }

        logger.LogInformation("DemoDataSeeder prerequisites verified.");
    }

    private static async Task RestoreOfficialSubscriptionPlanPricesAsync(SEHubDbContext context, ILogger logger)
    {
        var updated = false;

        foreach (var (code, priceVnd) in OfficialSubscriptionPlanPrices)
        {
            var plan = await context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Code == code);
            if (plan is null || plan.PriceVnd == priceVnd)
            {
                continue;
            }

            plan.PriceVnd = priceVnd;
            updated = true;
            logger.LogInformation(
                "Restored official subscription price for plan {PlanCode}: {PriceVnd} VND",
                code,
                priceVnd);
        }

        if (updated)
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task<ApplicationUser> SeedDemoStudentAsync(
        UserManager<ApplicationUser> userManager,
        SEHubDbContext context,
        ILogger logger)
    {
        var existing = await userManager.FindByEmailAsync(DemoStudentEmail);
        if (existing is not null)
        {
            if (!await context.UserProfiles.AnyAsync(p => p.UserId == existing.Id))
            {
                context.UserProfiles.Add(new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.Id,
                    Major = "SE",
                    Semester = 1,
                    Bio = "Demo student account for local development.",
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
                logger.LogInformation("Created missing UserProfile for demo student {Email}", DemoStudentEmail);
            }

            return existing;
        }

        var bronzeLevel = await context.LevelConfigs
            .OrderBy(l => l.MinPoints)
            .FirstAsync();

        var student = new ApplicationUser
        {
            Id = DemoStudentId,
            UserName = DemoStudentUsername,
            Email = DemoStudentEmail,
            EmailConfirmed = true,
            DisplayName = "Demo Student",
            Points = 0,
            LevelId = bronzeLevel.Id,
            StreakCount = 0
        };

        var result = await userManager.CreateAsync(student, DemoStudentPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create demo student: {errors}");
        }

        await userManager.AddToRoleAsync(student, RoleNames.Student);

        context.UserProfiles.Add(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = student.Id,
            Major = "SE",
            Semester = 1,
            Bio = "Demo student account for local development.",
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded demo student {Email}", DemoStudentEmail);
        return student;
    }

    private static async Task<ApplicationUser> SeedFreeStudentAsync(
        UserManager<ApplicationUser> userManager,
        SEHubDbContext context,
        ILogger logger)
    {
        return await SeedRoleUserAsync(
            userManager,
            context,
            logger,
            FreeStudentId,
            FreeStudentUsername,
            FreeStudentEmail,
            FreeStudentPassword,
            "Free Student",
            RoleNames.Student,
            "Free student account without premium subscription.");
    }

    private static async Task SeedModeratorAsync(
        UserManager<ApplicationUser> userManager,
        SEHubDbContext context,
        ILogger logger)
    {
        await SeedRoleUserAsync(
            userManager,
            context,
            logger,
            ModeratorUserId,
            ModeratorUsername,
            ModeratorEmail,
            ModeratorPassword,
            "Demo Moderator",
            RoleNames.Moderator,
            "Moderator account for local development and FE handoff.");
    }

    private static async Task<ApplicationUser> SeedSpammerStudentAsync(
        UserManager<ApplicationUser> userManager,
        SEHubDbContext context,
        ILogger logger)
    {
        return await SeedRoleUserAsync(
            userManager,
            context,
            logger,
            SpammerUserId,
            "spam_user",
            "spam.user@sehub.local",
            "Spam@12345",
            "Spam User",
            RoleNames.Student,
            "Demo author of reported posts for moderation screens.");
    }

    private static async Task<ApplicationUser> SeedRoleUserAsync(
        UserManager<ApplicationUser> userManager,
        SEHubDbContext context,
        ILogger logger,
        Guid userId,
        string username,
        string email,
        string password,
        string displayName,
        string role,
        string bio)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            if (!await context.UserProfiles.AnyAsync(p => p.UserId == existing.Id))
            {
                context.UserProfiles.Add(new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.Id,
                    Major = "SE",
                    Semester = 1,
                    Bio = bio,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
                logger.LogInformation("Created missing UserProfile for {Email}", email);
            }

            return existing;
        }

        var bronzeLevel = await context.LevelConfigs
            .OrderBy(l => l.MinPoints)
            .FirstAsync();

        var user = new ApplicationUser
        {
            Id = userId,
            UserName = username,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
            Points = 0,
            LevelId = bronzeLevel.Id,
            StreakCount = 0
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create user {email}: {errors}");
        }

        await userManager.AddToRoleAsync(user, role);

        context.UserProfiles.Add(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Major = "SE",
            Semester = 1,
            Bio = bio,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Role} user {Email}", role, email);
        return user;
    }

    private static async Task SeedReportablePostsAsync(SEHubDbContext context, Guid authorId, ILogger logger)
    {
        var now = DateTime.UtcNow;
        var posts = new List<Post>();

        if (!await context.Posts.AnyAsync(p => p.Id == DemoSpamPostId))
        {
            posts.Add(new Post
            {
                Id = DemoSpamPostId,
                AuthorId = authorId,
                Title = "Tài liệu ôn thi bí mật — click ngay!",
                Content = "Click ngay vào link này để nhận tài liệu ôn thi bí mật. Đăng ký gấp tại bit.ly/fake-sehub-docs.",
                Tags = $"{DemoPostTag},{DemoReportTag},spam",
                Status = PostStatus.Published,
                ViewCount = 12,
                IsFeatured = false,
                IsDeleted = false,
                CreatedAt = now.AddHours(-6)
            });
        }

        if (!await context.Posts.AnyAsync(p => p.Id == DemoOffensivePostId))
        {
            posts.Add(new Post
            {
                Id = DemoOffensivePostId,
                AuthorId = authorId,
                Title = "Bài viết vi phạm nội dung cộng đồng",
                Content = "Nội dung chứa quảng cáo trái phép và ngôn từ không phù hợp với quy tắc cộng đồng SEHub.",
                Tags = $"{DemoPostTag},{DemoReportTag},violation",
                Status = PostStatus.Published,
                ViewCount = 5,
                IsFeatured = false,
                IsDeleted = false,
                CreatedAt = now.AddHours(-4)
            });
        }

        if (posts.Count == 0)
        {
            return;
        }

        context.Posts.AddRange(posts);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} reportable demo posts for author {AuthorId}", posts.Count, authorId);
    }

    private static async Task SeedDemoPostReportsAsync(
        SEHubDbContext context,
        Guid freeStudentId,
        Guid premiumStudentId,
        ILogger logger)
    {
        var pendingCount = await context.PostReports
            .CountAsync(r => r.Reason.Contains(DemoReportTag) && r.Status == ReportStatus.Pending);

        if (pendingCount >= 2)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var reports = new List<PostReport>();

        if (!await context.PostReports.AnyAsync(r => r.Id == DemoReportSpamId))
        {
            reports.Add(new PostReport
            {
                Id = DemoReportSpamId,
                PostId = DemoSpamPostId,
                ReporterId = freeStudentId,
                Reason = $"{DemoReportTag}: Spam — quảng cáo link giả mạo tài liệu ôn thi.",
                Status = ReportStatus.Pending,
                CreatedAt = now.AddHours(-2)
            });
        }

        if (!await context.PostReports.AnyAsync(r => r.Id == DemoReportHarmfulId))
        {
            reports.Add(new PostReport
            {
                Id = DemoReportHarmfulId,
                PostId = DemoOffensivePostId,
                ReporterId = premiumStudentId,
                Reason = $"{DemoReportTag}: Nội dung có hại — vi phạm quy tắc cộng đồng.",
                Status = ReportStatus.Pending,
                CreatedAt = now.AddHours(-1)
            });
        }

        if (reports.Count == 0)
        {
            return;
        }

        context.PostReports.AddRange(reports);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} pending post reports", reports.Count);
    }

    private static async Task SeedFinalExamAsync(SEHubDbContext context, ILogger logger)
    {
        if (await context.Exams.AnyAsync(e => e.Code == FinalExamCode))
        {
            return;
        }

        var now = DateTime.UtcNow;
        var q1Id = Guid.Parse("11111111-1111-1111-1111-111111111101");
        var q2Id = Guid.Parse("11111111-1111-1111-1111-111111111102");
        var q1CorrectId = Guid.Parse("22222222-2222-2222-2222-222222222201");
        var q1OptionBId = Guid.Parse("22222222-2222-2222-2222-222222222202");
        var q1OptionCId = Guid.Parse("22222222-2222-2222-2222-222222222203");
        var q1OptionDId = Guid.Parse("22222222-2222-2222-2222-222222222204");
        var q2CorrectId = Guid.Parse("33333333-3333-3333-3333-333333333301");
        var q2OptionBId = Guid.Parse("33333333-3333-3333-3333-333333333302");
        var q2OptionCId = Guid.Parse("33333333-3333-3333-3333-333333333303");

        var exam = new Exam
        {
            Id = DemoFinalExamId,
            Code = FinalExamCode,
            Title = "Đề cuối kỳ SE301",
            ExamType = ExamType.Final,
            Semester = 1,
            Major = "SE",
            QuestionCount = 2,
            Status = ExamStatus.Published,
            ContentHash = ComputeContentHash("final-exam-se301"),
            Description = "Đề thi cuối kỳ môn Software Engineering (SE301) — dữ liệu demo Development.",
            CreatedAt = now,
            Questions =
            [
                new Question
                {
                    Id = q1Id,
                    ExamId = DemoFinalExamId,
                    OrderIndex = 1,
                    Content = "SDLC (Software Development Life Cycle) mô tả điều gì?",
                    CorrectOptionId = q1CorrectId,
                    CreatedAt = now,
                    Options =
                    [
                        new QuestionOption
                        {
                            Id = q1CorrectId,
                            QuestionId = q1Id,
                            Label = "A",
                            Text = "Các giai đoạn phát triển phần mềm từ yêu cầu đến bảo trì",
                            CreatedAt = now
                        },
                        new QuestionOption
                        {
                            Id = q1OptionBId,
                            QuestionId = q1Id,
                            Label = "B",
                            Text = "Chỉ quy trình viết mã nguồn",
                            CreatedAt = now
                        },
                        new QuestionOption
                        {
                            Id = q1OptionCId,
                            QuestionId = q1Id,
                            Label = "C",
                            Text = "Quy trình kiểm thử phần cứng",
                            CreatedAt = now
                        },
                        new QuestionOption
                        {
                            Id = q1OptionDId,
                            QuestionId = q1Id,
                            Label = "D",
                            Text = "Phương pháp quản lý nhân sự dự án",
                            CreatedAt = now
                        }
                    ]
                },
                new Question
                {
                    Id = q2Id,
                    ExamId = DemoFinalExamId,
                    OrderIndex = 2,
                    Content = "Trong Scrum, buổi họp nào dùng để lập kế hoạch cho Sprint tiếp theo?",
                    CorrectOptionId = q2CorrectId,
                    CreatedAt = now,
                    Options =
                    [
                        new QuestionOption
                        {
                            Id = q2CorrectId,
                            QuestionId = q2Id,
                            Label = "A",
                            Text = "Sprint Planning",
                            CreatedAt = now
                        },
                        new QuestionOption
                        {
                            Id = q2OptionBId,
                            QuestionId = q2Id,
                            Label = "B",
                            Text = "Daily Standup",
                            CreatedAt = now
                        },
                        new QuestionOption
                        {
                            Id = q2OptionCId,
                            QuestionId = q2Id,
                            Label = "C",
                            Text = "Sprint Retrospective",
                            CreatedAt = now
                        }
                    ]
                }
            ]
        };

        context.Exams.Add(exam);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded final exam {Code} with {QuestionCount} questions", FinalExamCode, exam.QuestionCount);
    }

    private static async Task SeedPracticeExamAsync(SEHubDbContext context, ILogger logger)
    {
        if (await context.Exams.AnyAsync(e => e.Code == PracticeExamCode))
        {
            return;
        }

        var exam = new Exam
        {
            Id = DemoPracticeExamId,
            Code = PracticeExamCode,
            Title = "Bài thực hành Lab 01",
            ExamType = ExamType.Practice,
            Semester = 1,
            Major = "SE",
            QuestionCount = 0,
            Status = ExamStatus.Published,
            ContentHash = ComputeContentHash("practice-exam-se301-lab01"),
            Description = "Nộp link repository GitHub chứa mã nguồn Lab 01 theo template. Dữ liệu demo Development.",
            AssetUrl = "https://github.com/sehub-demo/se301-lab01-template",
            CreatedAt = DateTime.UtcNow
        };

        context.Exams.Add(exam);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded practice exam {Code}", PracticeExamCode);
    }

    private static async Task SeedDocumentCategoryAndDocumentAsync(
        SEHubDbContext context,
        IConfiguration configuration,
        ILogger logger)
    {
        var category = await context.DocumentCategories
            .FirstOrDefaultAsync(c => c.Name == DocumentCategoryName);

        if (category is null)
        {
            category = new DocumentCategory
            {
                Id = DemoDocumentCategoryId,
                Name = DocumentCategoryName,
                Semester = 1,
                Major = "SE",
                CreatedAt = DateTime.UtcNow
            };
            context.DocumentCategories.Add(category);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded document category {Name}", DocumentCategoryName);
        }

        if (!await context.Documents.AnyAsync(d => d.Title == DocumentTitle))
        {
            context.Documents.Add(new Document
            {
                Id = DemoDocumentId,
                CategoryId = category.Id,
                Title = DocumentTitle,
                FilePath = DocumentRelativePath,
                MimeType = "application/pdf",
                PageCount = 10,
                AccessTier = AccessTier.FreePreview,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded document {Title}", DocumentTitle);
        }

        EnsureDemoPdfFile(configuration);
    }

    private static void EnsureDemoPdfFile(IConfiguration configuration)
    {
        var basePath = configuration["FileStorage:LocalPath"]
            ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        var fullPath = Path.Combine(basePath, DocumentRelativePath.Replace('/', Path.DirectorySeparatorChar));
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        if (!File.Exists(fullPath))
        {
            File.WriteAllBytes(fullPath, MinimalPdfBytes);
        }
    }

    private static async Task SeedActiveSubscriptionAsync(
        SEHubDbContext context,
        ISubscriptionService subscriptionService,
        Guid userId,
        ILogger logger)
    {
        var active = await context.Subscriptions
            .Where(s => s.UserId == userId && s.IsActive && s.EndAt > DateTime.UtcNow)
            .AnyAsync();

        if (active)
        {
            return;
        }

        var plan = await context.SubscriptionPlans
            .FirstAsync(p => p.Code == SubscriptionPlanCode);

        await subscriptionService.ActivateSubscriptionAsync(userId, plan.Id);
        logger.LogInformation("Activated demo subscription for user {UserId} with plan {PlanCode}", userId, SubscriptionPlanCode);
    }

    private static async Task SeedDemoPostsAsync(SEHubDbContext context, Guid authorId, ILogger logger)
    {
        var existingCount = await context.Posts
            .CountAsync(p => p.AuthorId == authorId && p.Tags.Contains(DemoPostTag) && !p.IsDeleted);

        if (existingCount >= 5)
        {
            return;
        }

        var postsToCreate = BuildDemoPosts(authorId).Skip(existingCount).ToList();
        if (postsToCreate.Count == 0)
        {
            return;
        }

        context.Posts.AddRange(postsToCreate);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} demo posts for author {AuthorId}", postsToCreate.Count, authorId);
    }

    private static IEnumerable<Post> BuildDemoPosts(Guid authorId)
    {
        var now = DateTime.UtcNow;
        var templates = new[]
        {
            (
                Title: "Chào mừng đến với SEHub",
                Content: "SEHub là nền tảng cộng đồng dành cho sinh viên Software Engineering. Đây là bài viết demo seed cho môi trường Development.",
                Featured: false
            ),
            (
                Title: "Mẹo ôn thi SE301 - Software Engineering",
                Content: "Tập trung vào SDLC, Agile/Scrum, UML cơ bản và các mô hình quy trình. Làm thêm đề Final demo trên SEHub để luyện tập.",
                Featured: false
            ),
            (
                Title: "Kinh nghiệm làm đồ án nhóm hiệu quả",
                Content: "Chia vai rõ ràng, dùng board theo dõi task, review code thường xuyên và ghi lại quyết định kiến trúc trong README.",
                Featured: false
            ),
            (
                Title: "Tổng hợp tài liệu học tập kỳ này",
                Content: "Xem mục Documents để tải slide SE301 Chương 1. Premium mở khóa toàn bộ tài liệu và chức năng thi.",
                Featured: true
            ),
            (
                Title: "Review môn SE301 sau giữa kỳ",
                Content: "Phần lý thuyết về quy trình phát triển phần mềm chiếm tỷ trọng lớn. Nên ôn lại các khái niệm waterfall vs agile.",
                Featured: false
            )
        };

        for (var i = 0; i < templates.Length; i++)
        {
            var template = templates[i];
            yield return new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = authorId,
                Title = template.Title,
                Content = template.Content,
                Tags = $"{DemoPostTag},demo,sehub",
                Status = PostStatus.Published,
                ViewCount = i * 3,
                IsFeatured = template.Featured,
                IsDeleted = false,
                CreatedAt = now.AddMinutes(-(templates.Length - i))
            };
        }
    }

    private static string ComputeContentHash(string key)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"demo-seed:{key}"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static async Task<SeedCounts> CaptureCountsAsync(
        SEHubDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        var demoStudent = await userManager.FindByEmailAsync(DemoStudentEmail);
        var demoPostCount = demoStudent is null
            ? 0
            : await context.Posts.CountAsync(p =>
                p.AuthorId == demoStudent.Id && p.Tags.Contains(DemoPostTag) && !p.IsDeleted);

        var demoSubscriptionCount = demoStudent is null
            ? 0
            : await context.Subscriptions.CountAsync(s =>
                s.UserId == demoStudent.Id && s.IsActive && s.EndAt > DateTime.UtcNow);

        return new SeedCounts
        {
            Users = await context.Users.CountAsync(),
            Posts = demoPostCount,
            Reports = await context.PostReports.CountAsync(r =>
                r.Reason.Contains(DemoReportTag) && r.Status == ReportStatus.Pending),
            Exams = await context.Exams.CountAsync(e =>
                e.Code == FinalExamCode || e.Code == PracticeExamCode),
            Questions = await context.Questions.CountAsync(q => q.Exam.Code == FinalExamCode),
            Options = await context.QuestionOptions.CountAsync(o => o.Question.Exam.Code == FinalExamCode),
            DocumentCategories = await context.DocumentCategories.CountAsync(c => c.Name == DocumentCategoryName),
            Documents = await context.Documents.CountAsync(d => d.Title == DocumentTitle && !d.IsDeleted),
            Subscriptions = demoSubscriptionCount
        };
    }

    private sealed class SeedCounts
    {
        public int Users { get; init; }
        public int Posts { get; init; }
        public int Reports { get; init; }
        public int Exams { get; init; }
        public int Questions { get; init; }
        public int Options { get; init; }
        public int DocumentCategories { get; init; }
        public int Documents { get; init; }
        public int Subscriptions { get; init; }
    }
}
