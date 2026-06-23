import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "./Toast.module.css";

const ToastContext = createContext(null);
const DEFAULT_TOAST_DURATION = 3200;

function ToastViewport({ toast, onClose }) {
  if (!toast) return null;

  if (toast.variant === "copy") {
    return (
      <div className={`${styles.viewport} ${styles["viewport-top"]}`} role="status" aria-live="polite">
        <div className={styles["toast-copy"]}>
          <div className={styles["toast-copy-body"]}>
            <p className={styles["toast-copy-title"]}>{toast.title}</p>
            <p className={styles["toast-copy-message"]}>{toast.message}</p>
          </div>
          <span className={styles.progress} aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.viewport} role="status" aria-live="polite">
      <div className={styles.toast}>
        <FontAwesomeIcon icon={faCircleInfo} className={styles.icon} />
        <div className={styles.content}>
          <p className={styles.message}>{toast.message}</p>
          {toast.countdown != null && (
            <p className={styles.countdown}>Chuyển trang sau {toast.countdown} giây</p>
          )}
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label="Đóng thông báo"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const onCompleteRef = useRef(null);
  const onCancelRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    onCompleteRef.current = null;
    onCancelRef.current = null;
  }, []);

  const hideToast = useCallback(() => {
    onCancelRef.current?.();
    clearTimers();
    setToast(null);
  }, [clearTimers]);

  const showToast = useCallback(
    (message, duration = DEFAULT_TOAST_DURATION) => {
      clearTimers();
      setToast({ message });

      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    },
    [clearTimers],
  );

  const showCopyToast = useCallback(
    ({
      title = "Đã sao chép",
      message = "Link bài viết đã được sao chép vào clipboard",
      duration = DEFAULT_TOAST_DURATION,
    } = {}) => {
      clearTimers();
      setToast({ variant: "copy", title, message });

      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    },
    [clearTimers],
  );

  const showCountdownToast = useCallback(
    (message, onComplete, onCancel) => {
      clearTimers();
      onCompleteRef.current = onComplete;
      onCancelRef.current = onCancel;

      let remaining = 3;
      setToast({ message, countdown: remaining });

      countdownRef.current = setInterval(() => {
        remaining -= 1;

        if (remaining > 0) {
          setToast({ message, countdown: remaining });
          return;
        }

        const complete = onCompleteRef.current;
        clearTimers();
        setToast(null);
        complete?.();
      }, 1000);
    },
    [clearTimers],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  const value = useMemo(
    () => ({
      showToast,
      showCopyToast,
      showCountdownToast,
      hideToast,
    }),
    [showToast, showCopyToast, showCountdownToast, hideToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={toast} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
