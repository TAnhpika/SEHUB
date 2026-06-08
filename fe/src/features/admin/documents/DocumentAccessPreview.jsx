import {
  buildMockPageLabels,
  getDocumentAccessState,
} from "@/features/documents/documentAccessPolicy";
import docStyles from "@/features/admin/documents/AdminDocuments.module.css";

function AccessColumn({ title, badge, state, docName }) {
  const pages = buildMockPageLabels(
    state.totalPages,
    state.canView ? state.visiblePages : 0,
  );

  return (
    <div className={docStyles.previewColumn}>
      <div className={docStyles.previewColumnHead}>
        <h4 className={docStyles.previewColumnTitle}>{title}</h4>
        <span
          className={`${docStyles.previewBadge} ${
            state.canView
              ? docStyles.previewBadgeOk
              : docStyles.previewBadgeLocked
          }`}
        >
          {badge}
        </span>
      </div>
      <p className={docStyles.previewFileName}>{docName}</p>
      <p className={docStyles.previewStatus}>{state.label}</p>

      {!state.canView ? (
        <div className={docStyles.previewLocked}>
          <span className={docStyles.previewLockIcon} aria-hidden="true">
            🔒
          </span>
          <p>
            {state.reason === "premium_required"
              ? "Tài liệu gán quyền Premium. SV Basic cần nâng cấp gói để mở khóa."
              : "Cần đăng nhập để xem tài liệu."}
          </p>
        </div>
      ) : (
        <>
          <div className={docStyles.previewPages} aria-label={`Xem trước trang — ${title}`}>
            {pages.map((page) => (
              <div
                key={page.pageNum}
                className={`${docStyles.previewPage} ${
                  page.visible ? docStyles.previewPageVisible : docStyles.previewPageHidden
                }`}
              >
                <span className={docStyles.previewPageNum}>Trang {page.pageNum}</span>
                {!page.visible ? (
                  <span className={docStyles.previewPageBlur}>Khóa</span>
                ) : (
                  <span className={docStyles.previewPageContent}>Nội dung mẫu…</span>
                )}
              </div>
            ))}
          </div>
          <ul className={docStyles.previewPerks}>
            <li className={state.limited ? docStyles.perkWarn : docStyles.perkOk}>
              {state.limited
                ? `Giới hạn ${state.visiblePages} trang đầu`
                : `Xem đủ ${state.totalPages} trang`}
            </li>
            <li className={state.canDownload ? docStyles.perkOk : docStyles.perkOff}>
              {state.canDownload ? "Cho phép tải file" : "Không cho tải file"}
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

export function DocumentAccessCompare({ doc, showMeta = true }) {
  const basicState = getDocumentAccessState(doc, { isPremium: false });
  const premiumState = getDocumentAccessState(doc, { isPremium: true });

  return (
    <>
      {showMeta ? (
        <div className={docStyles.previewDocHead}>
          <span className={docStyles.previewDocName}>{doc.name}</span>
          <span
            className={`${docStyles.previewAccessPill} ${
              doc.access?.includes("Premium")
                ? docStyles.previewAccessPremium
                : docStyles.previewAccessFree
            }`}
          >
            {doc.access}
          </span>
          <span className={docStyles.previewDocMeta}>{doc.pages} trang</span>
        </div>
      ) : null}
      {doc.description ? (
        <p className={docStyles.previewDocDesc}>{doc.description}</p>
      ) : null}
      <div className={docStyles.previewGrid}>
        <AccessColumn
          title="Student (Basic)"
          badge="Free"
          state={basicState}
          docName={doc.name}
        />
        <AccessColumn
          title="Student (Premium)"
          badge="Premium"
          state={premiumState}
          docName={doc.name}
        />
      </div>
    </>
  );
}

function DocumentAccessPreview({ documents }) {
  if (documents.length === 0) return null;

  const previewableDocs = documents.filter((doc) => doc.pages > 0);
  const missingPageDocs = documents.filter((doc) => !doc.pages || doc.pages <= 0);

  return (
    <section className={docStyles.previewPanel}>
      <header className={docStyles.previewHeader}>
        <h3 className={docStyles.previewTitle}>Xem trước phân quyền SV</h3>
        <p className={docStyles.previewSubtitle}>
          So sánh trải nghiệm <strong>Student (Basic)</strong> và{" "}
          <strong>Student (Premium)</strong> theo quyền Admin đã gán. Kiểm tra thực tế: đăng
          nhập <code>student_basic</code> / <code>basic123</code> hoặc{" "}
          <code>student_premium</code> / <code>premium123</code> → Tài liệu → môn học.
        </p>
      </header>

      {missingPageDocs.length > 0 ? (
        <p className={docStyles.previewMissingPages}>
          {missingPageDocs.length} tài liệu chưa có số trang — không mô phỏng được Basic/Premium.
          Upload lại với số trang hoặc chỉ xem các file bên dưới.
        </p>
      ) : null}

      {previewableDocs.length === 0 ? (
        <p className={docStyles.previewMissingPages}>
          Chưa có tài liệu nào có số trang. Khi upload, nhập số trang để xem preview ngay.
        </p>
      ) : null}

      {previewableDocs.map((doc) => (
        <article key={doc.id} className={docStyles.previewDoc}>
          <DocumentAccessCompare doc={doc} />
        </article>
      ))}
    </section>
  );
}

export default DocumentAccessPreview;
