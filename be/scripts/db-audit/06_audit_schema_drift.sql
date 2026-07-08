-- Schema drift: columns present in DB but not mapped by EF Core model.
-- Gate: investigate any non-zero rows before dropping columns.

SELECT 'Posts.Tags column exists' AS check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'Posts'
             AND column_name = 'Tags'
       ) THEN 1 ELSE 0 END AS drift_count;

-- Documents.FilePath still populated (legacy local storage)
SELECT 'Documents.FilePath non-empty' AS check_name, COUNT(*) AS drift_count
FROM "Documents"
WHERE "FilePath" IS NOT NULL AND trim("FilePath") <> '';

-- Exams.AssetUrl still populated (should migrate to ExamAttachments)
SELECT 'Exams.AssetUrl non-null' AS check_name, COUNT(*) AS drift_count
FROM "Exams"
WHERE "AssetUrl" IS NOT NULL AND trim("AssetUrl") <> '';

-- AspNetUsers.PhoneNumber vs UserProfiles.Phone both set
SELECT 'Users with both PhoneNumber and Profile.Phone' AS check_name, COUNT(*) AS drift_count
FROM "AspNetUsers" u
JOIN "UserProfiles" p ON p."UserId" = u."Id"
WHERE u."PhoneNumber" IS NOT NULL AND trim(u."PhoneNumber") <> ''
  AND p."Phone" IS NOT NULL AND trim(p."Phone") <> ''
  AND u."PhoneNumber" <> p."Phone";
