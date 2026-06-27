import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/common/ConfirmDialog/ConfirmDialog";

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        title: options.title ?? "Xác nhận",
        description: options.description ?? "",
        confirmLabel: options.confirmLabel ?? "Xác nhận",
        cancelLabel: options.cancelLabel ?? "Hủy",
        variant: options.variant ?? "primary",
      });
    });
  }, []);

  const closeDialog = useCallback((result) => {
    setDialogState((current) => (current ? { ...current, open: false } : null));
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        {...dialogState}
        open={Boolean(dialogState?.open)}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
}
