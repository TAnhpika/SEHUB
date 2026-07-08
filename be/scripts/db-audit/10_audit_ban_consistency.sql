-- User ban consistency: AspNetUsers flags vs UserBans audit table.

-- User IsBanned=true but no active UserBan record
SELECT 'Users IsBanned without active UserBan' AS check_name, COUNT(*) AS drift_count
FROM "AspNetUsers" u
WHERE u."IsBanned" = true
  AND NOT EXISTS (
      SELECT 1 FROM "UserBans" b
      WHERE b."UserId" = u."Id"
        AND (b."Until" IS NULL OR b."Until" > now() AT TIME ZONE 'utc')
  );

-- Active UserBan but user IsBanned=false
SELECT 'Active UserBan but user not IsBanned' AS check_name, COUNT(*) AS drift_count
FROM "UserBans" b
JOIN "AspNetUsers" u ON u."Id" = b."UserId"
WHERE (b."Until" IS NULL OR b."Until" > now() AT TIME ZONE 'utc')
  AND u."IsBanned" = false;

-- BanUntil on user does not match latest active ban Until
SELECT 'Users BanUntil mismatch latest UserBan' AS check_name, COUNT(*) AS drift_count
FROM "AspNetUsers" u
JOIN LATERAL (
    SELECT b."Until"
    FROM "UserBans" b
    WHERE b."UserId" = u."Id"
      AND (b."Until" IS NULL OR b."Until" > now() AT TIME ZONE 'utc')
    ORDER BY b."CreatedAt" DESC
    LIMIT 1
) latest ON true
WHERE u."IsBanned" = true
  AND (
    (u."BanUntil" IS NULL AND latest."Until" IS NOT NULL)
    OR (u."BanUntil" IS NOT NULL AND latest."Until" IS NULL)
    OR (u."BanUntil" IS NOT NULL AND latest."Until" IS NOT NULL
        AND abs(extract(epoch from (u."BanUntil" - latest."Until"))) > 1)
  );
