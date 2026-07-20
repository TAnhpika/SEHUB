-- Post media consistency: PostImages gallery only (CoverImageUrl column dropped).

-- Soft-deleted posts that still have PostImages (orphan media risk)
SELECT 'Soft-deleted Posts with PostImages' AS check_name, COUNT(*) AS drift_count
FROM "Posts" p
WHERE p."IsDeleted" = true
  AND EXISTS (SELECT 1 FROM "PostImages" i WHERE i."PostId" = p."Id");

-- PostImages missing Url and DriveFileId (unusable rows)
SELECT 'PostImages without Url or DriveFileId' AS check_name, COUNT(*) AS drift_count
FROM "PostImages"
WHERE (COALESCE(trim("Url"), '') = '')
  AND (COALESCE(trim("DriveFileId"), '') = '');

-- Duplicate SortOrder within the same post
SELECT 'PostImages duplicate SortOrder per Post' AS check_name, COUNT(*) AS drift_count
FROM (
  SELECT "PostId", "SortOrder"
  FROM "PostImages"
  GROUP BY "PostId", "SortOrder"
  HAVING COUNT(*) > 1
) dups;

-- PostImages with both DriveFileId and Url (audit only)
SELECT 'PostImages with DriveFileId and Url' AS check_name, COUNT(*) AS drift_count
FROM "PostImages"
WHERE "DriveFileId" IS NOT NULL AND trim("DriveFileId") <> ''
  AND "Url" IS NOT NULL AND trim("Url") <> '';
