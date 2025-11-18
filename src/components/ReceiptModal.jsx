import { money } from "../utils/money";

export default function ReceiptModal({ open, onClose, receipt }) {
  if (!open || !receipt) return null;

  const lineItems = receipt.lines ?? [];
  const summary = receipt.summary ?? {};
  const formatReceiptRow = (productName, quantity, amount) => {
    const nameCell = String(productName ?? "")
      .slice(0, 12)
      .padEnd(12, " ");
    const quantityCell = String(quantity ?? 0).padStart(2, " ");
    const amountCell = money(amount ?? 0).padStart(10, " ");
    return `${nameCell}  ${quantityCell}   ${amountCell}`;
  };

  const totalQuantity = lineItems.reduce(
    (acc, item) => acc + (item.qty || 0),
    0
  );

  const receiptText = [
    "===========W 편의점=============",
    "상품명          수량      금액",
    ...lineItems.map((item) =>
      formatReceiptRow(item.name, item.qty, item.amount)
    ),
    "==============================",
    `총구매액        ${String(totalQuantity).padStart(2, " ")}   ${money(
      summary.originalTotalAmount || 0
    ).padStart(10, " ")}`,
    `행사할인                     -${money(
      summary.promotionDiscountAmount || 0
    )}`,
    `멤버십할인                   -${money(
      summary.membershipDiscountAmount || 0
    )}`,
    `결제금액                      ${money(summary.finalTotalAmount || 0)}`,
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
            {receiptText}
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
