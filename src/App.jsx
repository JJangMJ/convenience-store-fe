import { useEffect, useMemo, useState } from "react";
import ProductCard from "./components/ProductCard";
import CartRow from "./components/CartRow";
import PaymentModal from "./components/PaymentModal";
import { money } from "./utils/money";
import "./App.css";
import { createOrder } from "./apis/orderApi";
import { getProducts } from "./apis/productApi";

export default function App() {
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productList, setProductList] = useState([]);
  const [cartItemsById, setCartItemsById] = useState({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState({
    applyMembership: false,
    takeFreeGift: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setIsLoadingProducts(true);
      try {
        const list = await getProducts(controller.signal);
        setProductList(list);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          alert("상품을 불러오지 못했습니다.");
        }
      } finally {
        setIsLoadingProducts(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const addToCart = (productToAdd) => {
    setCartItemsById((previousCartState) => {
      const updatedCartState = { ...previousCartState };

      const existingCartItem = updatedCartState[productToAdd.productId] || {
        productId: productToAdd.productId,
        name: productToAdd.name,
        price: productToAdd.price,
        quantity: 0,
      };

      const quantityAlreadyInCart =
        Object.values(previousCartState).find(
          (item) => item.productId === productToAdd.productId
        )?.quantity ?? 0;

      const productFromList = productList.find(
        (p) => p.productId === productToAdd.productId
      );
      const remainingStock =
        (productFromList?.stock ?? 0) - quantityAlreadyInCart;
      if (remainingStock <= 0) return previousCartState;

      existingCartItem.quantity += 1;
      updatedCartState[productToAdd.productId] = existingCartItem;
      return updatedCartState;
    });
  };

  const increaseCartItemQuantity = (productId) =>
    setCartItemsById((previousCartState) => {
      const updatedCartState = { ...previousCartState };
      const cartItem = updatedCartState[productId];
      if (!cartItem) return previousCartState;

      const productFromList = productList.find(
        (p) => p.productId === productId
      );
      const remainingStock = (productFromList?.stock ?? 0) - cartItem.quantity;
      if (remainingStock <= 0) return previousCartState;

      cartItem.quantity += 1;
      return updatedCartState;
    });

  const decreaseCartItemQuantity = (productId) =>
    setCartItemsById((previousCartState) => {
      const updatedCartState = { ...previousCartState };
      const cartItem = updatedCartState[productId];
      if (!cartItem) return previousCartState;

      cartItem.quantity -= 1;
      if (cartItem.quantity <= 0) delete updatedCartState[productId];
      return updatedCartState;
    });

  const removeCartItem = (productId) =>
    setCartItemsById((previousCartState) => {
      const updatedCartState = { ...previousCartState };
      delete updatedCartState[productId];
      return updatedCartState;
    });

  const cartItems = useMemo(
    () => Object.values(cartItemsById),
    [cartItemsById]
  );

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const subtotalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const paymentSummary = useMemo(
    () => ({ totalQuantity, subtotalText: money(subtotalAmount) }),
    [totalQuantity, subtotalAmount]
  );

  const productsByName = useMemo(() => {
    const map = new Map();
    for (const product of productList) {
      const arr = map.get(product.name) ?? [];
      arr.push(product);
      map.set(product.name, arr);
    }
    return map;
  }, [productList]);

  const getQtyInCart = (productId) => cartItemsById[productId]?.quantity ?? 0;

  const getRemainingStock = (product) =>
    (product.stock ?? 0) - getQtyInCart(product.productId);

  const isNormalLocked = (product) => {
    if (product.promotionSearchResponse) return false;
    const siblings = productsByName.get(product.name) ?? [];
    const promoVariant = siblings.find((p) => !!p.promotionSearchResponse);
    if (!promoVariant) return false;
    return getRemainingStock(promoVariant) > 0;
  };

  const productById = useMemo(
    () => new Map(productList.map((p) => [p.productId, p])),
    [productList]
  );

  const hasPromotionItemInCart = useMemo(
    () =>
      cartItems.some((item) => {
        const product = productById.get(item.productId);
        return !!product?.promotionSearchResponse;
      }),
    [cartItems, productById]
  );

  useEffect(() => {
    if (!hasPromotionItemInCart && paymentOptions.takeFreeGift) {
      setPaymentOptions((prev) => ({ ...prev, takeFreeGift: false }));
    }
  }, [hasPromotionItemInCart, paymentOptions.takeFreeGift]);

  const handleConfirmPayment = async () => {
    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        applyMembership: paymentOptions.applyMembership,
        takePromotionFreeGift: paymentOptions.takeFreeGift,
      };
      const json = await createOrder(payload);
      const message = json?.message || "결제가 완료되었습니다.";

      alert("결제가 완료되었습니다.");
      setCartItemsById({});
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("결제에 실패했습니다.");
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div className="brand">W 편의점</div>
      </header>

      <main className="layout">
        <section className="panel">
          <h3 className="panel__title">상품</h3>
          {isLoadingProducts && <div className="empty">로딩 중…</div>}
          <div className="grid">
            {productList.map((product) => {
              const quantityInCart =
                cartItemsById[product.productId]?.quantity ?? 0;

              const selfSoldOut = getRemainingStock(product) <= 0;
              const normalLocked = isNormalLocked(product);

              return (
                <ProductCard
                  key={product.productId}
                  product={product}
                  cartQty={quantityInCart}
                  onAdd={addToCart}
                  disabled={selfSoldOut || normalLocked}
                  disabledReason={
                    selfSoldOut
                      ? "재고가 부족합니다."
                      : normalLocked
                      ? "동일 상품의 프로모션 재고가 남아 있어 일반 상품은 선택할 수 없습니다."
                      : ""
                  }
                />
              );
            })}
          </div>
        </section>

        <aside className="panel cart">
          <h3 className="panel__title">장바구니</h3>
          <div className="cart__rows">
            {cartItems.map((item) => (
              <CartRow
                key={item.productId}
                item={item}
                onInc={increaseCartItemQuantity}
                onDec={decreaseCartItemQuantity}
                onRemove={removeCartItem}
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
            onClick={() => setIsPaymentModalOpen(true)}
          >
            결제하기
          </button>
        </aside>
      </main>

      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
        options={paymentOptions}
        setOptions={setPaymentOptions}
        summary={paymentSummary}
        promotionAvailable={hasPromotionItemInCart}
      />
    </div>
  );
}
