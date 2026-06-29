-- SEHUB orphan audit (read-only). Gate: resolve all non-zero counts before FK migrations.

-- Core user activity
SELECT 'ExamAttempts.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "ExamAttempts" e
LEFT JOIN "AspNetUsers" u ON u."Id" = e."UserId"
WHERE u."Id" IS NULL;

SELECT 'PracticeSubmissions.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "PracticeSubmissions" s
LEFT JOIN "AspNetUsers" u ON u."Id" = s."UserId"
WHERE u."Id" IS NULL;

SELECT 'PracticeSubmissions.ReviewedById' AS check_name, COUNT(*) AS orphan_count
FROM "PracticeSubmissions" s
LEFT JOIN "AspNetUsers" u ON u."Id" = s."ReviewedById"
WHERE s."ReviewedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'Posts.AuthorId' AS check_name, COUNT(*) AS orphan_count
FROM "Posts" p
LEFT JOIN "AspNetUsers" u ON u."Id" = p."AuthorId"
WHERE u."Id" IS NULL;

SELECT 'Posts.ModeratedById' AS check_name, COUNT(*) AS orphan_count
FROM "Posts" p
LEFT JOIN "AspNetUsers" u ON u."Id" = p."ModeratedById"
WHERE p."ModeratedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'Posts.DeletedById' AS check_name, COUNT(*) AS orphan_count
FROM "Posts" p
LEFT JOIN "AspNetUsers" u ON u."Id" = p."DeletedById"
WHERE p."DeletedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'Comments.AuthorId' AS check_name, COUNT(*) AS orphan_count
FROM "Comments" c
LEFT JOIN "AspNetUsers" u ON u."Id" = c."AuthorId"
WHERE u."Id" IS NULL;

SELECT 'Comments.DeletedById' AS check_name, COUNT(*) AS orphan_count
FROM "Comments" c
LEFT JOIN "AspNetUsers" u ON u."Id" = c."DeletedById"
WHERE c."DeletedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'Documents.DeletedById' AS check_name, COUNT(*) AS orphan_count
FROM "Documents" d
LEFT JOIN "AspNetUsers" u ON u."Id" = d."DeletedById"
WHERE d."DeletedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'PostLikes.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "PostLikes" l
LEFT JOIN "AspNetUsers" u ON u."Id" = l."UserId"
WHERE u."Id" IS NULL;

SELECT 'RefreshTokens.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "RefreshTokens" t
LEFT JOIN "AspNetUsers" u ON u."Id" = t."UserId"
WHERE u."Id" IS NULL;

SELECT 'ChatbotConversations.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "ChatbotConversations" c
LEFT JOIN "AspNetUsers" u ON u."Id" = c."UserId"
WHERE u."Id" IS NULL;

-- Payment & gamification
SELECT 'PaymentOrders.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "PaymentOrders" o
LEFT JOIN "AspNetUsers" u ON u."Id" = o."UserId"
WHERE u."Id" IS NULL;

SELECT 'Subscriptions.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "Subscriptions" s
LEFT JOIN "AspNetUsers" u ON u."Id" = s."UserId"
WHERE u."Id" IS NULL;

SELECT 'PointTransactions.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "PointTransactions" t
LEFT JOIN "AspNetUsers" u ON u."Id" = t."UserId"
WHERE u."Id" IS NULL;

SELECT 'RankRewardVouchers.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "RankRewardVouchers" v
LEFT JOIN "AspNetUsers" u ON u."Id" = v."UserId"
WHERE u."Id" IS NULL;

SELECT 'UserLevelHistories.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "UserLevelHistories" h
LEFT JOIN "AspNetUsers" u ON u."Id" = h."UserId"
WHERE u."Id" IS NULL;

SELECT 'UserBadges.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "UserBadges" b
LEFT JOIN "AspNetUsers" u ON u."Id" = b."UserId"
WHERE u."Id" IS NULL;

SELECT 'UserDailyActivities.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "UserDailyActivities" a
LEFT JOIN "AspNetUsers" u ON u."Id" = a."UserId"
WHERE u."Id" IS NULL;

SELECT 'DocumentAccessLogs.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "DocumentAccessLogs" l
LEFT JOIN "AspNetUsers" u ON u."Id" = l."UserId"
WHERE u."Id" IS NULL;

SELECT 'AiExamChatThreads.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "AiExamChatThreads" t
LEFT JOIN "AspNetUsers" u ON u."Id" = t."UserId"
WHERE u."Id" IS NULL;

SELECT 'AiExamChatThreads.ExamId' AS check_name, COUNT(*) AS orphan_count
FROM "AiExamChatThreads" t
LEFT JOIN "Exams" e ON e."Id" = t."ExamId"
WHERE e."Id" IS NULL;

SELECT 'AiExamChatThreads.QuestionId' AS check_name, COUNT(*) AS orphan_count
FROM "AiExamChatThreads" t
LEFT JOIN "Questions" q ON q."Id" = t."QuestionId"
WHERE q."Id" IS NULL;

-- Moderation & exams
SELECT 'Exams.SubmittedById' AS check_name, COUNT(*) AS orphan_count
FROM "Exams" e
LEFT JOIN "AspNetUsers" u ON u."Id" = e."SubmittedById"
WHERE e."SubmittedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'Exams.RejectedById' AS check_name, COUNT(*) AS orphan_count
FROM "Exams" e
LEFT JOIN "AspNetUsers" u ON u."Id" = e."RejectedById"
WHERE e."RejectedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'PostReports.ReporterId' AS check_name, COUNT(*) AS orphan_count
FROM "PostReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ReporterId"
WHERE u."Id" IS NULL;

SELECT 'PostReports.ResolvedById' AS check_name, COUNT(*) AS orphan_count
FROM "PostReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ResolvedById"
WHERE r."ResolvedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'CommentReports.ReporterId' AS check_name, COUNT(*) AS orphan_count
FROM "CommentReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ReporterId"
WHERE u."Id" IS NULL;

SELECT 'CommentReports.ResolvedById' AS check_name, COUNT(*) AS orphan_count
FROM "CommentReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ResolvedById"
WHERE r."ResolvedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'QuestionReports.ReporterId' AS check_name, COUNT(*) AS orphan_count
FROM "QuestionReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ReporterId"
WHERE u."Id" IS NULL;

SELECT 'QuestionReports.ResolvedById' AS check_name, COUNT(*) AS orphan_count
FROM "QuestionReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ResolvedById"
WHERE r."ResolvedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'UserReports.ReportedUserId' AS check_name, COUNT(*) AS orphan_count
FROM "UserReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ReportedUserId"
WHERE u."Id" IS NULL;

SELECT 'UserReports.ReporterId' AS check_name, COUNT(*) AS orphan_count
FROM "UserReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ReporterId"
WHERE u."Id" IS NULL;

SELECT 'UserReports.ResolvedById' AS check_name, COUNT(*) AS orphan_count
FROM "UserReports" r
LEFT JOIN "AspNetUsers" u ON u."Id" = r."ResolvedById"
WHERE r."ResolvedById" IS NOT NULL AND u."Id" IS NULL;

SELECT 'ViolationEscalations.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "ViolationEscalations" v
LEFT JOIN "AspNetUsers" u ON u."Id" = v."UserId"
WHERE u."Id" IS NULL;

SELECT 'ViolationEscalations.EscalatedById' AS check_name, COUNT(*) AS orphan_count
FROM "ViolationEscalations" v
LEFT JOIN "AspNetUsers" u ON u."Id" = v."EscalatedById"
WHERE u."Id" IS NULL;

SELECT 'QuestionComments.AuthorId' AS check_name, COUNT(*) AS orphan_count
FROM "QuestionComments" c
LEFT JOIN "AspNetUsers" u ON u."Id" = c."AuthorId"
WHERE u."Id" IS NULL;

SELECT 'QuestionComments.ExamId' AS check_name, COUNT(*) AS orphan_count
FROM "QuestionComments" c
LEFT JOIN "Exams" e ON e."Id" = c."ExamId"
WHERE e."Id" IS NULL;

SELECT 'UserFeedbacks.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "UserFeedbacks" f
LEFT JOIN "AspNetUsers" u ON u."Id" = f."UserId"
WHERE f."UserId" IS NOT NULL AND u."Id" IS NULL;

SELECT 'UserBans.UserId' AS check_name, COUNT(*) AS orphan_count
FROM "UserBans" b
LEFT JOIN "AspNetUsers" u ON u."Id" = b."UserId"
WHERE u."Id" IS NULL;

SELECT 'UserBans.ActorId' AS check_name, COUNT(*) AS orphan_count
FROM "UserBans" b
LEFT JOIN "AspNetUsers" u ON u."Id" = b."ActorId"
WHERE u."Id" IS NULL;
