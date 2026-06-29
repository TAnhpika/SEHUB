-- OPTIONAL cleanup — review audit output first. Run one statement at a time.

-- Optional actors: null out invalid user references (safe for SET NULL FKs)
-- UPDATE "Posts" SET "ModeratedById" = NULL
-- WHERE "ModeratedById" IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM "AspNetUsers" u WHERE u."Id" = "Posts"."ModeratedById");

-- UPDATE "Posts" SET "DeletedById" = NULL
-- WHERE "DeletedById" IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM "AspNetUsers" u WHERE u."Id" = "Posts"."DeletedById");

-- UPDATE "Exams" SET "SubmittedById" = NULL
-- WHERE "SubmittedById" IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM "AspNetUsers" u WHERE u."Id" = "Exams"."SubmittedById");

-- UPDATE "Exams" SET "RejectedById" = NULL
-- WHERE "RejectedById" IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM "AspNetUsers" u WHERE u."Id" = "Exams"."RejectedById");

-- UPDATE "Documents" SET "DeletedById" = NULL
-- WHERE "DeletedById" IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM "AspNetUsers" u WHERE u."Id" = "Documents"."DeletedById");

-- DELETE orphan rows only if confirmed test/demo data:
-- DELETE FROM "RefreshTokens" t
-- WHERE NOT EXISTS (SELECT 1 FROM "AspNetUsers" u WHERE u."Id" = t."UserId");
