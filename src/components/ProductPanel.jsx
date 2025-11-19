import ProductCard from "./ProductCard";

const getQuantityInCart = (cartItemsByProductId, productId) =>
  cartItemsByProductId[productId]?.quantity ?? 0;

const getRemainingStockForProduct = (product, cartItemsByProductId) =>
  (product.stock ?? 0) -
  getQuantityInCart(cartItemsByProductId, product.productId);

const isNormalProductLocked = (
  product,
  productsByName,
  cartItemsByProductId
) => {
  if (product.promotionSearchResponse) return false;

  const productsWithSameName = productsByName.get(product.name) ?? [];
  const promotionProduct = productsWithSameName.find(
    (candidateProduct) => !!candidateProduct.promotionSearchResponse
  );
  if (!promotionProduct) return false;

  return (
    getRemainingStockForProduct(promotionProduct, cartItemsByProductId) > 0
  );
};

export default function ProductPanel({
  productList,
  cartItemsByProductId,
  productsByName,
  isLoadingProducts,
  onAddToCart,
}) {
  return (
    <section className="panel">
      <h3 className="panel__title">상품</h3>
      {isLoadingProducts && <div className="empty">로딩 중…</div>}
      <div className="grid">
        {productList.map((product) => {
          const quantityInCart =
            cartItemsByProductId[product.productId]?.quantity ?? 0;
          const selfSoldOut =
            getRemainingStockForProduct(product, cartItemsByProductId) <= 0;
          const normalProductLocked = isNormalProductLocked(
            product,
            productsByName,
            cartItemsByProductId
          );

          return (
            <ProductCard
              key={product.productId}
              product={product}
              cartQty={quantityInCart}
              onAdd={onAddToCart}
              disabled={selfSoldOut || normalProductLocked}
              disabledReason={
                selfSoldOut
                  ? "재고가 부족합니다."
                  : normalProductLocked
                  ? "동일 상품의 프로모션 재고가 남아 있어 일반 상품은 선택할 수 없습니다."
                  : ""
              }
            />
          );
        })}
      </div>
    </section>
  );
}
