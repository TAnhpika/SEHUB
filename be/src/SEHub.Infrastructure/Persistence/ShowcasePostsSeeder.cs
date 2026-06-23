using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence;

/// <summary>
/// Published, pinned posts for a professional home-feed demo (teacher presentation).
/// Idempotent — skips posts that already exist by fixed Id.
/// </summary>
public static class ShowcasePostsSeeder
{
    public const string ShowcasePostTag = "showcase-seed";

    private static readonly Guid Post1Id = Guid.Parse("f1010101-0101-0101-0101-010101010101");
    private static readonly Guid Post2Id = Guid.Parse("f1010101-0101-0101-0101-010101010102");
    private static readonly Guid Post3Id = Guid.Parse("f1010101-0101-0101-0101-010101010103");
    private static readonly Guid Post4Id = Guid.Parse("f1010101-0101-0101-0101-010101010104");
    private static readonly Guid Post5Id = Guid.Parse("f1010101-0101-0101-0101-010101010105");
    private static readonly Guid Post6Id = Guid.Parse("f1010101-0101-0101-0101-010101010106");

    public static async Task SeedAsync(SEHubDbContext context, ILogger logger)
    {
        var demoAuthor = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == DemoDataSeeder.DemoStudentEmail);

        if (demoAuthor is null)
        {
            logger.LogWarning("ShowcasePostsSeeder skipped: demo student not found.");
            return;
        }

        var freeAuthor = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == DemoDataSeeder.FreeStudentEmail);

        var now = DateTime.UtcNow;
        var templates = BuildTemplates(demoAuthor.Id, freeAuthor?.Id ?? demoAuthor.Id);
        var added = 0;

        foreach (var template in templates)
        {
            if (await context.Posts.IgnoreQueryFilters().AnyAsync(p => p.Id == template.Id))
            {
                continue;
            }

            context.Posts.Add(new Post
            {
                Id = template.Id,
                AuthorId = template.AuthorId,
                Title = template.Title,
                Content = template.Content,
                Tags = template.TagList,
                Status = PostStatus.Published,
                ViewCount = template.ViewCount,
                IsPinned = template.IsPinned,
                IsFeatured = template.IsFeatured,
                IsDeleted = false,
                CreatedAt = now.AddMinutes(template.MinutesAgo),
            });
            added++;
        }

        if (added == 0)
        {
            return;
        }

        await context.SaveChangesAsync();
        logger.LogInformation("ShowcasePostsSeeder added {Count} showcase posts for home demo.", added);
    }

    private static IReadOnlyList<ShowcasePostTemplate> BuildTemplates(Guid demoAuthorId, Guid freeAuthorId)
    {
        return
        [
            new ShowcasePostTemplate(
                Post1Id,
                demoAuthorId,
                "Hướng dẫn tra cứu và sử dụng học liệu số trên SEHub",
                """
                <h2>Giới thiệu</h2>
                <p>SEHub tập trung <strong>học liệu số</strong> dành cho sinh viên ngành Software Engineering: slide bài giảng, tài liệu tham khảo và đề luyện tập được tổ chức theo môn học và học kỳ.</p>
                <h3>Các bước tra cứu tài liệu</h3>
                <ul>
                <li>Vào mục <strong>Documents</strong>, chọn ngành (SE) và học kỳ tương ứng.</li>
                <li>Lọc theo môn học (ví dụ SE301, CSD, PTTK) để tìm slide và bài đọc thêm.</li>
                <li>Tải file PDF hoặc xem trực tuyến; ghi chú lại phần chưa hiểu để hỏi trên diễn đàn.</li>
                </ul>
                <h3>Gợi ý học tập</h3>
                <p>Nên đọc slide <em>trước</em> buổi học, làm bài tập nhóm sau buổi học, và ôn lại bằng đề thi thử trên SEHub trước kỳ thi. Tài khoản Premium mở khóa toàn bộ học liệu và chức năng thi.</p>
                """,
                "SE,Documents,Học liệu,SE301",
                IsPinned: true,
                IsFeatured: true,
                ViewCount: 128,
                MinutesAgo: -6),
            new ShowcasePostTemplate(
                Post2Id,
                demoAuthorId,
                "Lộ trình ôn thi môn Software Engineering (SE301)",
                """
                <h2>Cấu trúc đề thi thường gặp</h2>
                <p>Môn <strong>Software Engineering</strong> đánh giá cả lý thuyết quy trình phát triển phần mềm lẫn khả năng áp dụng vào tình huống đồ án.</p>
                <h3>Nội dung trọng tâm</h3>
                <ul>
                <li><strong>SDLC</strong>: Waterfall, V-Model, Iterative, Spiral — ưu/nhược và khi nào áp dụng.</li>
                <li><strong>Agile &amp; Scrum</strong>: vai trò Product Owner, Scrum Master, Sprint, backlog, Definition of Done.</li>
                <li><strong>Yêu cầu phần mềm</strong>: functional / non-functional, use case, user story.</li>
                <li><strong>UML cơ bản</strong>: sơ đồ use case, class, sequence phục vụ phân tích thiết kế.</li>
                </ul>
                <h3>Kế hoạch ôn 4 tuần</h3>
                <p><strong>Tuần 1–2</strong>: đọc slide + làm câu hỏi trắc nghiệm. <strong>Tuần 3</strong>: luyện đề Final trên SEHub. <strong>Tuần 4</strong>: tổng ôn khái niệm và thuật ngữ tiếng Anh.</p>
                """,
                "SE301,Ôn thi,Software Engineering",
                IsPinned: true,
                IsFeatured: true,
                ViewCount: 96,
                MinutesAgo: -5),
            new ShowcasePostTemplate(
                Post3Id,
                demoAuthorId,
                "Phương pháp tự học Cấu trúc dữ liệu & Giải thuật hiệu quả",
                """
                <h2>Nguyên tắc học CSD</h2>
                <p>Cấu trúc dữ liệu và giải thuật không chỉ là ghi nhớ code — cần hiểu <strong>độ phức tạp</strong> và <strong>lựa chọn cấu trúc phù hợp</strong> với bài toán.</p>
                <h3>Trình tự đề xuất</h3>
                <ol>
                <li>Mảng, danh sách liên kết, stack, queue — nền tảng và thao tác cơ bản.</li>
                <li>Cây (BST, heap), bảng băm — tra cứu và cân bằng.</li>
                <li>Đồ thị — BFS, DFS, Dijkstra; liên hệ với bài toán thực tế.</li>
                </ol>
                <h3>Cách luyện tập</h3>
                <p>Mỗi chủ đề: đọc lý thuyết → vẽ minh họa → code 2–3 bài tập → phân tích <code>O(n)</code>. Dùng SEHub để làm đề thi thử và xem lại câu sai.</p>
                """,
                "CSD,Giải thuật,Ôn thi",
                IsPinned: true,
                IsFeatured: false,
                ViewCount: 74,
                MinutesAgo: -4),
            new ShowcasePostTemplate(
                Post4Id,
                freeAuthorId,
                "Kinh nghiệm làm đồ án nhóm theo quy trình Agile",
                """
                <h2>Bối cảnh đồ án</h2>
                <p>Đồ án môn học thường kéo dài 8–12 tuần với nhóm 4–5 sinh viên. Áp dụng <strong>Scrum</strong> giúp nhóm theo dõi tiến độ và giảm rủi ro trễ deadline.</p>
                <h3>Thực hành trong nhóm</h3>
                <ul>
                <li><strong>Sprint 1–2</strong>: làm rõ yêu cầu, phác thảo kiến trúc, setup repository và CI cơ bản.</li>
                <li><strong>Sprint 3+</strong>: phát triển theo user story, review code, demo cuối sprint.</li>
                <li>Ghi lại quyết định kiến trúc trong README; dùng board (Jira/Trello) đồng bộ với SEHub khi trao đổi tài liệu.</li>
                </ul>
                <p>Chia commit đều, tránh “bus factor” — mỗi thành viên nắm ít nhất một module chính.</p>
                """,
                "Đồ án,Agile,Scrum,SE",
                IsPinned: true,
                IsFeatured: false,
                ViewCount: 61,
                MinutesAgo: -3),
            new ShowcasePostTemplate(
                Post5Id,
                demoAuthorId,
                "Tóm tắt kiến thức UML cho môn Phân tích & Thiết kế hệ thống",
                """
                <h2>Mục đích UML trong môn PTTK</h2>
                <p>UML là ngôn ngữ mô hình hóa thống nhất giữa nhóm phân tích, thiết kế và lập trình. Thầy cô thường yêu cầu nộp kèm sơ đồ trong báo cáo đồ án.</p>
                <h3>Ba loại sơ đồ cần nắm</h3>
                <ul>
                <li><strong>Use Case</strong>: tác nhân, use case, quan hệ include/extend — mô tả phạm vi hệ thống.</li>
                <li><strong>Class</strong>: lớp, thuộc tính, quan hệ association, inheritance — chuyển từ yêu cầu sang thiết kế.</li>
                <li><strong>Sequence</strong>: luồng tương tác theo thời gian — làm rõ API và nghiệp vụ.</li>
                </ul>
                <h3>Lỗi thường gặp</h3>
                <p>Nhầm association với inheritance; vẽ quá chi tiết ở giai đoạn phân tích; thiếu tên cho message trong sequence diagram.</p>
                """,
                "PTTK,UML,Thiết kế hệ thống",
                IsPinned: true,
                IsFeatured: false,
                ViewCount: 55,
                MinutesAgo: -2),
            new ShowcasePostTemplate(
                Post6Id,
                demoAuthorId,
                "Sử dụng đề thi thử (Practice Exam) để đánh giá năng lực trước kỳ thi",
                """
                <h2>Vì sao nên làm đề thi thử?</h2>
                <p>Đề <strong>Practice Exam</strong> trên SEHub mô phỏng cấu trúc đề chính thức: thời gian, loại câu hỏi và mức độ phủ kiến thức theo đề cương.</p>
                <h3>Quy trình 3 bước</h3>
                <ol>
                <li>Làm bài trong thời gian quy định, không tra tài liệu lần đầu.</li>
                <li>Xem kết quả, ghi lại chủ đề sai và ôn lại slide tương ứng.</li>
                <li>Làm lại sau 3–5 ngày để kiểm tra mức độ ghi nhớ.</li>
                </ol>
                <p>Kết hợp Practice Exam với học liệu trong mục Documents để xây dựng lộ trình ôn cá nhân hóa.</p>
                """,
                "Practice Exam,Ôn thi,SEHub",
                IsPinned: false,
                IsFeatured: true,
                ViewCount: 42,
                MinutesAgo: -1),
        ];
    }

    private sealed record ShowcasePostTemplate(
        Guid Id,
        Guid AuthorId,
        string Title,
        string Content,
        string ExtraTags,
        bool IsPinned,
        bool IsFeatured,
        int ViewCount,
        int MinutesAgo)
    {
        public string TagList => $"{ShowcasePostTag},{ExtraTags}";
    }
}
