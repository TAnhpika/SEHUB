-- DocumentCategory consistency with Subjects catalog.

-- Orphan SubjectCode on categories
SELECT 'DocumentCategories orphan SubjectCode' AS check_name, COUNT(*) AS drift_count
FROM "DocumentCategories" c
WHERE c."SubjectCode" IS NOT NULL
  AND trim(c."SubjectCode") <> ''
  AND NOT EXISTS (
      SELECT 1 FROM "Subjects" s WHERE upper(s."Code") = upper(c."SubjectCode")
  );

-- Major/Semester drift from Subject when SubjectCode is set
SELECT 'DocumentCategories Major/Semester drift' AS check_name, COUNT(*) AS drift_count
FROM "DocumentCategories" c
JOIN "Subjects" s ON upper(s."Code") = upper(c."SubjectCode")
WHERE c."Semester" <> s."Semester";

-- Duplicate categories for same subject
SELECT 'DocumentCategories duplicate SubjectCode' AS check_name, COUNT(*) AS drift_count
FROM (
    SELECT upper("SubjectCode") AS sc, COUNT(*) AS cnt
    FROM "DocumentCategories"
    WHERE "SubjectCode" IS NOT NULL AND trim("SubjectCode") <> ''
    GROUP BY upper("SubjectCode")
    HAVING COUNT(*) > 1
) d;
