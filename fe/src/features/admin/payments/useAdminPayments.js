import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPaidStudentsForTokenGrant,
  getPaymentStatsFromList,
  getPendingRefundRequestsFromList,
  getRefundedPaymentsFromList,
  loadAdminPayments,
  loadPaymentAuditLog,
} from "@/features/admin/payments/adminPaymentData";

export function useAdminPayments() {
  const [payments, setPayments] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    Promise.all([loadAdminPayments(), loadPaymentAuditLog()])
      .then(([paymentItems, auditItems]) => {
        if (!cancelled) {
          setPayments(paymentItems);
          setAuditLog(auditItems);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPayments([]);
          setAuditLog([]);
          setLoadError(error?.message ?? "Không tải được danh sách thanh toán.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const stats = useMemo(() => getPaymentStatsFromList(payments), [payments]);
  const paidStudents = useMemo(() => getPaidStudentsForTokenGrant(payments), [payments]);
  const refundedPayments = useMemo(() => getRefundedPaymentsFromList(payments), [payments]);
  const pendingRefundRequests = useMemo(
    () => getPendingRefundRequestsFromList(payments),
    [payments],
  );

  return {
    payments,
    auditLog,
    loading,
    loadError,
    refresh,
    stats,
    paidStudents,
    refundedPayments,
    pendingRefundRequests,
  };
}
