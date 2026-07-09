-- Denormalized column drift vs source-of-truth tables.

-- Exams.QuestionCount != actual question count
SELECT 'Exams.QuestionCount mismatch' AS check_name, COUNT(*) AS drift_count
FROM "Exams" e
LEFT JOIN (
    SELECT "ExamId", COUNT(*) AS cnt
    FROM "Questions"
    GROUP BY "ExamId"
) q ON q."ExamId" = e."Id"
WHERE e."QuestionCount" <> COALESCE(q.cnt, 0);

-- Exams.Semester drift from Subjects
SELECT 'Exams.Semester drift from Subjects' AS check_name, COUNT(*) AS drift_count
FROM "Exams" e
JOIN "Subjects" s ON upper(s."Code") = upper(e."Code")
WHERE e."Semester" <> s."Semester";

-- Exams orphan subject codes (no matching Subject)
SELECT 'Exams orphan subject Code' AS check_name, COUNT(*) AS drift_count
FROM "Exams" e
WHERE NOT EXISTS (
    SELECT 1 FROM "Subjects" s WHERE upper(s."Code") = upper(e."Code")
);

-- AspNetUsers.Points drift from PointTransactions
SELECT 'Users.Points drift from transactions' AS check_name, COUNT(*) AS drift_count
FROM "AspNetUsers" u
LEFT JOIN (
    SELECT "UserId", COALESCE(SUM("Amount"), 0) AS total
    FROM "PointTransactions"
    WHERE "Status" = 0
    GROUP BY "UserId"
) t ON t."UserId" = u."Id"
WHERE u."Points" <> COALESCE(t.total, 0);
