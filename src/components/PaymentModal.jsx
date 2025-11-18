import { useEffect } from "react";
import { money } from "../utils/money";

export default function PaymentModal({
  open,
  onClose,
  onConfirm,
  options,
  setOptions,
  summary,
  promotionAvailable,
  preview,
  previewLoading,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  useEffect(() => {
    if (!promotionAvailable && options.takeFreeGift) {
      setOptions((prev) => ({ ...prev, takeFreeGift: false }));
    }
  }, [promotionAvailable, options.takeFreeGift, setOptions]);

  if (!open) return null;

  const previewSummary = preview?.summary;

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>결제 옵션 선택</h3>
        </div>

        <div className="modal__body">
          <label className="switch-row">
            <input
              type="checkbox"
              checked={options.applyMembership}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  applyMembership: e.target.checked,
                }))
              }
            />
            <span>멤버십 할인 적용</span>
          </label>

          <label
            className="switch-row"
            title={
              !promotionAvailable
                ? "장바구니에 프로모션 상품이 있을 때만 사용 가능합니다."
                : undefined
            }
          >
            <input
              type="checkbox"
              disabled={!promotionAvailable}
              checked={options.takeFreeGift}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  takeFreeGift: e.target.checked,
                }))
              }
            />
            <span>프로모션 무료 증정 받기</span>
          </label>

          {previewLoading && <div className="modal__summary">계산 중…</div>}

          {!previewLoading && previewSummary && (
            <div className="modal__summary">
              <div>
                총 수량: <b>{previewSummary.totalQuantity}</b>
              </div>
              <div>
                총구매액:{" "}
                <b>{money(previewSummary.originalTotalAmount ?? 0)}</b>
              </div>
              <div>
                행사할인:{" "}
                <b>-{money(previewSummary.promotionDiscountAmount ?? 0)}</b>
              </div>
              <div>
                멤버십할인:{" "}
                <b>-{money(previewSummary.membershipDiscountAmount ?? 0)}</b>
              </div>
              <div>
                결제금액: <b>{money(previewSummary.finalTotalAmount ?? 0)}</b>
              </div>
            </div>
          )}

          {!previewLoading && !previewSummary && summary && (
            <div className="modal__summary">
              <div>
                총 수량: <b>{summary.totalQuantity}</b>
              </div>
              <div>
                상품 금액: <b>{summary.subtotalText}</b>
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn-ghost" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-fill"
            onClick={onConfirm}
            disabled={previewLoading}
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
}
