-- UserReports context validation (Source: Post=0, QuestionComment=1, Profile=2)

SELECT 'Source=0 missing PostId' AS issue, COUNT(*) AS cnt
FROM "UserReports"
WHERE "Source" = 0 AND "PostId" IS NULL;

SELECT 'Source=0 extra context' AS issue, COUNT(*) AS cnt
FROM "UserReports"
WHERE "Source" = 0
  AND ("ExamId" IS NOT NULL OR "QuestionId" IS NOT NULL OR "QuestionCommentId" IS NOT NULL);

SELECT 'Source=1 incomplete context' AS issue, COUNT(*) AS cnt
FROM "UserReports"
WHERE "Source" = 1
  AND ("ExamId" IS NULL OR "QuestionId" IS NULL OR "QuestionCommentId" IS NULL);

SELECT 'Source=1 extra PostId' AS issue, COUNT(*) AS cnt
FROM "UserReports"
WHERE "Source" = 1 AND "PostId" IS NOT NULL;

SELECT 'Source=2 has context' AS issue, COUNT(*) AS cnt
FROM "UserReports"
WHERE "Source" = 2
  AND ("PostId" IS NOT NULL OR "ExamId" IS NOT NULL OR "QuestionId" IS NOT NULL OR "QuestionCommentId" IS NOT NULL);

-- Orphan FK targets for UserReports
SELECT 'UserReports.PostId orphan' AS issue, COUNT(*) AS cnt
FROM "UserReports" r
LEFT JOIN "Posts" p ON p."Id" = r."PostId"
WHERE r."PostId" IS NOT NULL AND p."Id" IS NULL;

SELECT 'UserReports.QuestionCommentId orphan' AS issue, COUNT(*) AS cnt
FROM "UserReports" r
LEFT JOIN "QuestionComments" c ON c."Id" = r."QuestionCommentId"
WHERE r."QuestionCommentId" IS NOT NULL AND c."Id" IS NULL;
