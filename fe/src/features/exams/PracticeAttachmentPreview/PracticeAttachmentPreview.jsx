import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArchive, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { renderAsync } from "docx-preview";
import {
  getPracticeFileType,
  isPreviewablePracticeAttachment,
} from "@/features/moderator/practiceExams/practiceExamUpload";
import styles from "./PracticeAttachmentPreview.module.css";

/**
 * Preview file đính kèm đề thực hành: PDF/ảnh/DOCX có preview, ZIP/RAR chỉ hiện thẻ tải.
 *
 * @param {object} props
 * @param {File} [props.file] - File local trước khi upload.
 * @param {string} [props.blobUrl] - Blob URL từ API.
 * @param {string} props.fileName - Tên file hiển thị.
 * @param {string} [props.className]
 */
function PracticeAttachmentPreview({ file, blobUrl, fileName, className = "" }) {
  const docxRef = useRef(null);
  const [localBlobUrl, setLocalBlobUrl] = useState(null);
  const [docxError, setDocxError] = useState(null);
  const [loadingDocx, setLoadingDocx] = useState(false);

  const resolvedName = fileName ?? file?.name ?? "Đính kèm";
  const fileType = getPracticeFileType(resolvedName);
  const previewable = isPreviewablePracticeAttachment(resolvedName);
  const previewUrl = blobUrl ?? localBlobUrl;

  useEffect(() => {
    if (!file || blobUrl) {
      setLocalBlobUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalBlobUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blobUrl, file]);

  useEffect(() => {
    if (fileType !== "docx" || !previewUrl || !docxRef.current) {
      setDocxError(null);
      setLoadingDocx(false);
      return undefined;
    }

    let cancelled = false;
    const container = docxRef.current;

    async function renderDocx() {
      setLoadingDocx(true);
      setDocxError(null);
      container.innerHTML = "";

      try {
        let arrayBuffer;
        if (file instanceof File) {
          arrayBuffer = await file.arrayBuffer();
        } else {
          const response = await fetch(previewUrl);
          arrayBuffer = await response.arrayBuffer();
        }

        if (cancelled) return;
        await renderAsync(arrayBuffer, container, null, {
          className: styles.docxPage,
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
        });
      } catch {
        if (!cancelled) {
          setDocxError("Không xem trước được file DOCX. Vui lòng tải xuống để mở.");
        }
      } finally {
        if (!cancelled) {
          setLoadingDocx(false);
        }
      }
    }

    renderDocx();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [file, fileType, previewUrl]);

  if (!previewable) {
    return (
      <div className={`${styles.fileCard} ${className}`}>
        <FontAwesomeIcon
          icon={fileType === "archive" ? faFileArchive : faFileLines}
          size="2x"
          color="#004ac6"
        />
        <p>
          File <strong>{resolvedName}</strong> là file đính kèm — không hỗ trợ xem trực tiếp.
          Dùng nút tải xuống để mở trên máy.
        </p>
      </div>
    );
  }

  if (fileType === "pdf" && previewUrl) {
    return (
      <div className={`${styles.frameWrap} ${className}`}>
        <iframe title={resolvedName} src={previewUrl} className={styles.frame} />
      </div>
    );
  }

  if (fileType === "image" && previewUrl) {
    return (
      <div className={`${styles.imageWrap} ${className}`}>
        <img src={previewUrl} alt={resolvedName} className={styles.image} />
      </div>
    );
  }

  if (fileType === "docx") {
    return (
      <div className={`${styles.docxWrap} ${className}`}>
        {loadingDocx ? <p className={styles.loading}>Đang render DOCX...</p> : null}
        {docxError ? <p className={styles.error}>{docxError}</p> : null}
        <div ref={docxRef} className={styles.docxContainer} />
      </div>
    );
  }

  return null;
}

export default PracticeAttachmentPreview;
