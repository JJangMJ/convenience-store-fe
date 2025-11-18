import { money } from "../utils/money";

export default function CartRow({ item, onInc, onDec, onRemove }) {
  const subtotal = item.price * item.quantity;

  return (
    <div className="cart-row">
      <div className="cart-row__name">{item.name}</div>

      <div className="cart-row__qty">
        <button className="btn btn-ghost" onClick={() => onDec(item.productId)}>
          -
        </button>
        <span className="cart-row__qty-num">{item.quantity}</span>
        <button className="btn btn-ghost" onClick={() => onInc(item.productId)}>
          +
        </button>
      </div>

      <div className="cart-row__price">{money(subtotal)}</div>

      <button
        className="btn btn-danger"
        onClick={() => onRemove(item.productId)}
      >
        삭제
      </button>
    </div>
  );
}
