import { money } from "../utils/money";

export default function ReceiptModal({ open, onClose, receipt }) {
  if (!open || !receipt) return null;

  const lines = receipt.lines || [];
  const s = receipt.summary || {};

  const row = (name, qty, amount) => {
    const n = String(name ?? "")
      .slice(0, 12)
      .padEnd(12, " ");
    const q = String(qty ?? 0).padStart(2, " ");
    const a = money(amount ?? 0).padStart(10, " ");
    return `${n}  ${q}   ${a}`;
  };

  const totalQty = lines.reduce((acc, l) => acc + (l.qty || 0), 0);

  const body = [
    "===========W 편의점===========",
    "상품명          수량      금액",
    ...lines.map((l) => row(l.name, l.qty, l.amount)),
    "==============================",
    `총구매액        ${String(totalQty).padStart(2, " ")}   ${money(
      s.originalTotalAmount || 0
    ).padStart(10, " ")}`,
    `행사할인                     -${money(s.promotionDiscountAmount || 0)}`,
    `멤버십할인                   -${money(s.membershipDiscountAmount || 0)}`,
    `결제금액                      ${money(s.finalTotalAmount || 0)}`,
  ].join("\n");

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>영수증</h3>
        </div>
        <div className="modal__body">
          <pre
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
            }}
          >
            {body}
          </pre>
        </div>
        <div className="modal__footer">
          <button className="btn btn-fill" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
