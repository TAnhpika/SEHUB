# Document Viewer Pagination — Baseline

Route: `/home/documents/{code}/{documentId}` → `StudentDocumentViewer`

## Before optimization (per page flip)

| Step | Request | Backend work |
|------|---------|--------------|
| 1 | `GET /api/v1/documents/{id}/preview?page=N` | DB + full PDF from Google Drive + page count reconcile + access log |
| 2 | `GET /api/v1/documents/{id}/content?page=N` | DB + full PDF from Drive again + PdfSharp extract + access log |

**Total:** ~2 HTTP requests, ~2 Drive downloads, ~2 DB access logs per click.

## After optimization (target)

| User tier | Page flip | Requests |
|-----------|-----------|----------|
| Basic | Per-page extract | 1× `content?page=N` (preview skipped); Drive cached in memory |
| Premium PDF | Full file once | 0 on flip (iframe `#page=N` on cached blob) |

## Manual verify

1. Open DevTools → Network, filter `documents`
2. Open a PDF document, click page 2 → expect **1** content request (not preview+content)
3. Click page 3 → still 1 request; repeat page 2 → **0** new requests (FE cache)
4. Premium: first load 1 full `content` (no `page`); flips should not add requests

## Implemented (2026-07-09)

- **BE:** `DocumentPdfCache` (IMemoryCache, 10min sliding), preview skips Drive + access log, hot path uses stored `PageCount`
- **FE:** Direct `content` fetch (no preview API), per-page blob cache, prefetch adjacent pages, Premium full-PDF iframe `#page=N`
- **Tests:** 11 unit + 3 integration (`DocumentPageFlipIntegrationTests`) — all pass
