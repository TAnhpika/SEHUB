import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import * as premiumApi from "@/api/premiumApi";
import { getFePlanId } from "@/features/premium/premiumPlanMap";

/**
 * @fileoverview Trang callback PayOS — poll trạng thái đơn sau redirect từ cổng thanh toán.
 *
 * @module features/premium/PaymentReturnPage
 */

/**
 * Khoảng thời gian giữa các lần poll đơn hàng (ms).
 *
 * @constant {number}
 * @readonly
 */
const POLL_INTERVAL_MS = 2000;

/**
 * Số lần poll tối đa trước khi chuyển sang trạng thái chờ xác nhận thủ công.
 *
 * @constant {number}
 * @readonly
 */
const MAX_POLL_ATTEMPTS = 20;

/**
 * Trang trung gian xử lý return URL từ PayOS (`?orderId=...`).
 *
 * Poll `premiumApi.getOrder` tối đa 20 lần; nếu chưa `Paid` → redirect success
 * với `manualConfirmRequired: true`.
 *
 * @returns {import('react').ReactElement} Spinner, thông báo lỗi, hoặc redirect.
 *
 * @example
 * // Route callback PayOS:
 * <Route path="/home/premium/return" element={<PaymentReturnPage />} />
 */
function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;

    async function pollOrder() {
      try {
        while (!cancelled && attempts < MAX_POLL_ATTEMPTS) {
          const order = await premiumApi.getOrder(orderId, { markWaitingConfirmation: true });
          if (order.status === "Paid") {
            const fePlanId = getFePlanId(order.planCode) ?? "semester";
            navigate(`/home/premium/success/${fePlanId}`, {
              replace: true,
              state: {
                orderId: order.orderId,
                payOsOrderCode: order.payOsOrderCode,
                amount: order.amount,
              },
            });
            return;
          }

          attempts += 1;
          await new Promise((resolve) => {
            window.setTimeout(resolve, POLL_INTERVAL_MS);
          });
        }

        if (!cancelled) {
          try {
            const order = await premiumApi.getOrder(orderId, { markWaitingConfirmation: true });
            const fePlanId = getFePlanId(order.planCode) ?? "semester";
            navigate(`/home/premium/success/${fePlanId}`, {
              replace: true,
              state: {
                orderId: order.orderId ?? orderId,
                payOsOrderCode: order.payOsOrderCode,
                manualConfirmRequired: true,
              },
            });
          } catch {
            setError("Chưa nhận được xác nhận thanh toán. Vui lòng kiểm tra lại sau.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "Không thể xác nhận thanh toán.");
        }
      }
    }

    pollOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, navigate]);

  if (!orderId) {
    return <Navigate to="/home/premium" replace />;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/home/premium")}>
          Quay lại bảng giá
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Đang xác nhận thanh toán PayOS...</p>
    </div>
  );
}

export default PaymentReturnPage;
