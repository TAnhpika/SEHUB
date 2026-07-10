using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence;

public class SEHubDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public SEHubDbContext(DbContextOptions<SEHubDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserDailyActivity> UserDailyActivities => Set<UserDailyActivity>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OtpVerification> OtpVerifications => Set<OtpVerification>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();
    public DbSet<PostReport> PostReports => Set<PostReport>();
    public DbSet<CommentReport> CommentReports => Set<CommentReport>();
    public DbSet<UserReport> UserReports => Set<UserReport>();
    public DbSet<QuestionReport> QuestionReports => Set<QuestionReport>();
    public DbSet<QuestionComment> QuestionComments => Set<QuestionComment>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamAttachment> ExamAttachments => Set<ExamAttachment>();
    public DbSet<PostImage> PostImages => Set<PostImage>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<PracticeSubmission> PracticeSubmissions => Set<PracticeSubmission>();
    public DbSet<DocumentCategory> DocumentCategories => Set<DocumentCategory>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentAccessLog> DocumentAccessLogs => Set<DocumentAccessLog>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<PaymentOrder> PaymentOrders => Set<PaymentOrder>();
    public DbSet<PaymentAuditLog> PaymentAuditLogs => Set<PaymentAuditLog>();
    public DbSet<LevelConfig> LevelConfigs => Set<LevelConfig>();
    public DbSet<Badge> Badges => Set<Badge>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<PointRule> PointRules => Set<PointRule>();
    public DbSet<PointTransaction> PointTransactions => Set<PointTransaction>();
    public DbSet<GamificationEventInbox> GamificationEventInboxes => Set<GamificationEventInbox>();
    public DbSet<RewardRule> RewardRules => Set<RewardRule>();
    public DbSet<RankRewardVoucher> RankRewardVouchers => Set<RankRewardVoucher>();
    public DbSet<PartnerVoucherType> PartnerVoucherTypes => Set<PartnerVoucherType>();
    public DbSet<PartnerVoucherCode> PartnerVoucherCodes => Set<PartnerVoucherCode>();
    public DbSet<SubscriptionPlanPartnerReward> SubscriptionPlanPartnerRewards => Set<SubscriptionPlanPartnerReward>();
    public DbSet<UserLevelHistory> UserLevelHistories => Set<UserLevelHistory>();
    public DbSet<DailyMission> DailyMissions => Set<DailyMission>();
    public DbSet<WeeklyMission> WeeklyMissions => Set<WeeklyMission>();
    public DbSet<BattlePassSeason> BattlePassSeasons => Set<BattlePassSeason>();
    public DbSet<AiTokenDailyUsage> AiTokenDailyUsages => Set<AiTokenDailyUsage>();
    public DbSet<AiExamChatThread> AiExamChatThreads => Set<AiExamChatThread>();
    public DbSet<AiExamChatMessage> AiExamChatMessages => Set<AiExamChatMessage>();
    public DbSet<ChatbotSettings> ChatbotSettings => Set<ChatbotSettings>();
    public DbSet<ChatbotKnowledgeEntry> ChatbotKnowledgeEntries => Set<ChatbotKnowledgeEntry>();
    public DbSet<ChatbotConversation> ChatbotConversations => Set<ChatbotConversation>();
    public DbSet<ChatbotMessage> ChatbotMessages => Set<ChatbotMessage>();
    public DbSet<UserBan> UserBans => Set<UserBan>();
    public DbSet<UserFollow> UserFollows => Set<UserFollow>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<UserNotification> UserNotifications => Set<UserNotification>();
    public DbSet<UserBlock> UserBlocks => Set<UserBlock>();
    public DbSet<ConversationReport> ConversationReports => Set<ConversationReport>();
    public DbSet<ViolationEscalation> ViolationEscalations => Set<ViolationEscalation>();
    public DbSet<UserFeedback> UserFeedbacks => Set<UserFeedback>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<PostTag> PostTags => Set<PostTag>();
    public DbSet<QuestionAttachment> QuestionAttachments => Set<QuestionAttachment>();
    public DbSet<UserMissionProgress> UserMissionProgress => Set<UserMissionProgress>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(typeof(SEHubDbContext).Assembly);

        builder.Entity<Post>().HasQueryFilter(p => !p.IsDeleted);
        builder.Entity<Comment>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<QuestionComment>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<Document>().HasQueryFilter(d => !d.IsDeleted);
    }
}
