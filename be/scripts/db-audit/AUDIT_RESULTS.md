# Database Audit Results

Run all scripts in order against staging/production before applying schema migrations.

## How to run

```bash
# Supabase SQL Editor or psql — run each file:
# 01_audit_orphans.sql … 10_audit_ban_consistency.sql
```

## Gate criteria

| Script | Gate |
|--------|------|
| `01_audit_orphans.sql` | All `orphan_count` = 0 (or documented exceptions) |
| `02_audit_exam_duplicates.sql` | No duplicate `(Major, Code)` before unique index changes |
| `03_audit_user_reports.sql` | All `cnt` = 0 |
| `06_audit_schema_drift.sql` | Review drift counts; backfill before drop |
| `07_audit_denormalized_drift.sql` | Repair before dropping denormalized columns |
| `08_audit_document_categories.sql` | Resolve orphan/duplicate categories |
| `09_audit_post_media.sql` | Backfill CoverImageUrl before drop |
| `10_audit_ban_consistency.sql` | Sync ban flags before model change |

## Local dev (template)

> Fill in after running scripts against your environment.

| check_name | drift_count | Notes |
|------------|-------------|-------|
| Posts.Tags column exists | — | Run `06` |
| Documents.FilePath non-empty | — | Run `06` |
| Exams.AssetUrl non-null | — | Run `06` |
| Exams.QuestionCount mismatch | — | Run `07` |
| Exams orphan subject Code | — | Run `07` |

## Last run

- **Environment:** _(not run in CI — execute manually before prod deploy)_
- **Date:** —
- **Operator:** —
