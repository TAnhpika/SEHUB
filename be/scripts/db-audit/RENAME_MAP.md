# Database / API Rename Map

Rollback reference for the database cleanup refactor. Use **inverse** column names when rolling back a migration.

## Planned renames (Phase 2+)

| Layer | Old name | New name | Reason |
|-------|----------|----------|--------|
| DB `Exams` | `Code` | `SubjectCode` | Stores subject catalog code, not exam id |
| DB `Exams` | `Title` | `PaperCode` | Stores paper identifier (FE-, PE-, …) |
| API JSON | `code` | `subjectCode` | Align with DB semantics |
| API JSON | `title` | `paperCode` | Align with DB semantics |
| API JSON | `questionCount` | *(removed)* | Derived from `Questions` count |
| API JSON | `major` (on Exam) | *(removed)* | Derived from `Subject` |
| API JSON | `semester` (on Exam) | *(removed)* | Derived from `Subject` |
| API JSON | `assetUrl` | *(removed)* | Use `attachments[]` |
| DB `Documents` | `FilePath` | *(removed)* | `DriveFileId` only |
| DB `Posts` | `Tags` | *(removed)* | `PostTags` + `Tags` tables |
| DB `Posts` | `CoverImageUrl` | *(removed)* | First `PostImages` by `SortOrder` |
| DB `DocumentCategories` | `Major` | *(removed)* | From `Subjects` via `SubjectCode` |
| DB `DocumentCategories` | `Semester` | *(removed)* | From `Subjects` via `SubjectCode` |

## Inverse mapping (rollback)

| New name | Restore as |
|----------|------------|
| `SubjectCode` | `Code` |
| `PaperCode` | `Title` |
| `subjectCode` (API) | `code` |
| `paperCode` (API) | `title` |

## Technical debt removed

| Item | Action |
|------|--------|
| Migration `EnsurePostsTagsColumn` | Superseded by final `DropPostsTags` migration |
| `ExamSchemaMigration.MigrateLegacyExamCodesAsync` on startup | One-shot SQL in migration; removed from boot |
| `MappingProfile` fake `drive:{id}` FilePath | Removed when `FilePath` column dropped |

## Status

| Change | Status |
|--------|--------|
| Phase 0 audit scripts | Done |
| Phase 1 dead columns | Done |
| Phase 2 exam rename | Done |
| Phase 2 document category | Done |
| Phase 2 post/user/gamification | Done |
| Migration `20260708195855_DatabaseCleanupRefactor` | Done |
