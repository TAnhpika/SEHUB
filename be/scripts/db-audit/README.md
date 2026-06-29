# Database audit scripts (Supabase production)

Run **before** applying FK / constraint migrations from the Database Hardening plan.

## Order

1. **Backup** — Supabase Dashboard → Database → Backups (or `pg_dump`).
2. **`01_audit_orphans.sql`** — read-only counts; gate = all counts must be 0 (or understood).
3. **`02_audit_exam_duplicates.sql`** — check `(Major, Code)` conflicts before unique index change.
4. **`03_audit_user_reports.sql`** — invalid `Source` / context column combinations.
5. **`04_cleanup_optional.sql`** — only after reviewing audit output; run statements individually.

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
