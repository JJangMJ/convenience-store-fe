import { money } from "../utils/money";

export default function ProductCard({
  product,
  cartQty = 0,
  onAdd,
  disabled = false,
  disabledReason = "",
}) {
  const promo = product.promotionSearchResponse;
  const stockLeft = Math.max(0, product.stock - cartQty);

  return (
    <div className="product-card">
      <div className="product-card__header">
        <div className="product-card__title">{product.name}</div>
        {promo && <span className="badge">{promo.name}</span>}
      </div>

      <div className="product-card__price">{money(product.price)}</div>
      <div className="product-card__stock">재고: {stockLeft}</div>

      <button
        className="btn btn-fill"
        disabled={disabled}
        onClick={() => onAdd(product)}
        title={disabled ? disabledReason : undefined}
      >
        담기
      </button>
    </div>
  );
}
