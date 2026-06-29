-- Duplicate (Major, Code) pairs — must be empty before IX_Exams_Major_Code unique migration.

SELECT "Major", "Code", COUNT(*) AS cnt, array_agg("Id"::text) AS exam_ids
FROM "Exams"
GROUP BY "Major", "Code"
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- Global Code duplicates (current unique index) for reference
SELECT "Code", COUNT(*) AS cnt, array_agg("Major") AS majors
FROM "Exams"
GROUP BY "Code"
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
