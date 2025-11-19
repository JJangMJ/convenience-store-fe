import CartRow from "./CartRow";
import { money } from "../utils/money";

export default function CartPanel({
  cartItems,
  totalQuantity,
  subtotalAmount,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onClickPay,
}) {
  return (
    <aside className="panel cart">
      <h3 className="panel__title">장바구니</h3>
      <div className="cart__rows">
        {cartItems.map((cartItem) => (
          <CartRow
            key={cartItem.productId}
            item={cartItem}
            onInc={onIncreaseQuantity}
            onDec={onDecreaseQuantity}
            onRemove={onRemoveItem}
          />
        ))}
      </div>
      <div className="cart__summary">
        <div>총 수량</div>
        <div>{totalQuantity}</div>
        <div>상품 금액</div>
        <div>{money(subtotalAmount)}</div>
      </div>
      <button
        className="btn btn-fill cart__pay"
        disabled={cartItems.length === 0}
        onClick={onClickPay}
      >
        결제하기
      </button>
    </aside>
  );
}
