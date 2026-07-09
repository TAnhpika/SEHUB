-- Post media consistency: CoverImageUrl vs PostImages.

-- Posts with CoverImageUrl but no PostImages
SELECT 'Posts CoverImageUrl without PostImages' AS check_name, COUNT(*) AS drift_count
FROM "Posts" p
WHERE p."CoverImageUrl" IS NOT NULL AND trim(p."CoverImageUrl") <> ''
  AND NOT EXISTS (SELECT 1 FROM "PostImages" i WHERE i."PostId" = p."Id");

-- Posts with PostImages but null CoverImageUrl
SELECT 'Posts PostImages without CoverImageUrl' AS check_name, COUNT(*) AS drift_count
FROM "Posts" p
WHERE EXISTS (SELECT 1 FROM "PostImages" i WHERE i."PostId" = p."Id")
  AND (p."CoverImageUrl" IS NULL OR trim(p."CoverImageUrl") = '');

-- CoverImageUrl does not match first PostImage by SortOrder
SELECT 'Posts CoverImageUrl mismatch first image' AS check_name, COUNT(*) AS drift_count
FROM "Posts" p
JOIN LATERAL (
    SELECT i."Url"
    FROM "PostImages" i
    WHERE i."PostId" = p."Id"
    ORDER BY i."SortOrder", i."CreatedAt"
    LIMIT 1
) first_img ON true
WHERE p."CoverImageUrl" IS NOT NULL
  AND trim(p."CoverImageUrl") <> ''
  AND p."CoverImageUrl" <> first_img."Url";

-- PostImages with both DriveFileId and Url (audit only)
SELECT 'PostImages with DriveFileId and Url' AS check_name, COUNT(*) AS drift_count
FROM "PostImages"
WHERE "DriveFileId" IS NOT NULL AND trim("DriveFileId") <> ''
  AND "Url" IS NOT NULL AND trim("Url") <> '';
