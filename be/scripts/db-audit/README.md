# Database audit scripts (Supabase production)

Run **before** applying FK / constraint migrations from the Database Hardening plan.

## Order

1. **Backup** — Supabase Dashboard → Database → Backups (or `pg_dump`).
2. **`01_audit_orphans.sql`** — read-only counts; gate = all counts must be 0 (or understood).
3. **`02_audit_exam_duplicates.sql`** — check `(Major, Code)` conflicts before unique index change.
4. **`03_audit_user_reports.sql`** — invalid `Source` / context column combinations.
5. **`06_audit_schema_drift.sql`** — orphan DB columns / legacy fields not in EF model.
6. **`07_audit_denormalized_drift.sql`** — denormalized column drift (QuestionCount, Points, …).
7. **`08_audit_document_categories.sql`** — DocumentCategory vs Subjects consistency.
8. **`09_audit_post_media.sql`** — CoverImageUrl vs PostImages consistency.
9. **`10_audit_ban_consistency.sql`** — AspNetUsers ban flags vs UserBans.
10. **`04_cleanup_optional.sql`** — only after reviewing audit output; run statements individually.

Record results in **`AUDIT_RESULTS.md`**. See **`RENAME_MAP.md`** for field rename rollback reference.

## Apply migrations (after audit passes)

```bash
cd be
dotnet ef database update --project src/SEHub.Infrastructure --startup-project src/SEHub.API
```

## Verify indexes

```bash
# Run 05_verify_indexes.sql in Supabase SQL Editor
```

## Rollback

Restore Supabase backup. Do not remove migrations on production.
