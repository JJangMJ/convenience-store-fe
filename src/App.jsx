import { useEffect, useMemo, useState } from "react";
import ProductCard from "./components/ProductCard";
import CartRow from "./components/CartRow";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import { money } from "./utils/money";
import { createOrder } from "./apis/orderApi";
import "./App.css";

export default function App() {
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productList, setProductList] = useState([]);
  const [cartItemsById, setCartItemsById] = useState({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState({
    applyMembership: false,
    takeFreeGift: false,
  });
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    (async () => {
      setIsLoadingProducts(true);
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        const list = Array.isArray(json.result)
          ? json.result
          : json.result?.data ?? [];
        setProductList(list);
      } catch (e) {
        console.error(e);
        alert("상품을 불러오지 못했습니다.");
      } finally {
        setIsLoadingProducts(false);
      }
    })();
  }, []);

  const addToCart = (productToAdd) => {
    setCartItemsById((prev) => {
      const next = { ...prev };
      const existing = next[productToAdd.productId] || {
        productId: productToAdd.productId,
        name: productToAdd.name,
        price: productToAdd.price,
        quantity: 0,
      };
      const already =
        Object.values(prev).find((i) => i.productId === productToAdd.productId)
          ?.quantity ?? 0;
      const product = productList.find(
        (p) => p.productId === productToAdd.productId
      );
      const remain = (product?.stock ?? 0) - already;
      if (remain <= 0) return prev;
      existing.quantity += 1;
      next[productToAdd.productId] = existing;
      return next;
    });
  };

  const increaseCartItemQuantity = (productId) =>
    setCartItemsById((prev) => {
      const next = { ...prev };
      const row = next[productId];
      if (!row) return prev;
      const product = productList.find((p) => p.productId === productId);
      const remain = (product?.stock ?? 0) - row.quantity;
      if (remain <= 0) return prev;
      row.quantity += 1;
      return next;
    });

  const decreaseCartItemQuantity = (productId) =>
    setCartItemsById((prev) => {
      const next = { ...prev };
      const row = next[productId];
      if (!row) return prev;
      row.quantity -= 1;
      if (row.quantity <= 0) delete next[productId];
      return next;
    });

  const removeCartItem = (productId) =>
    setCartItemsById((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

  const cartItems = useMemo(
    () => Object.values(cartItemsById),
    [cartItemsById]
  );
  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  );
  const subtotalAmount = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cartItems]
  );
  const paymentSummary = useMemo(
    () => ({ totalQuantity, subtotalText: money(subtotalAmount) }),
    [totalQuantity, subtotalAmount]
  );

  const productsByName = useMemo(() => {
    const map = new Map();
    for (const p of productList) {
      const arr = map.get(p.name) ?? [];
      arr.push(p);
      map.set(p.name, arr);
    }
    return map;
  }, [productList]);

  const getQtyInCart = (productId) => cartItemsById[productId]?.quantity ?? 0;
  const getRemainingStock = (product) =>
    (product.stock ?? 0) - getQtyInCart(product.productId);

  const isNormalLocked = (product) => {
    if (product.promotionSearchResponse) return false;
    const siblings = productsByName.get(product.name) ?? [];
    const promo = siblings.find((p) => !!p.promotionSearchResponse);
    if (!promo) return false;
    return getRemainingStock(promo) > 0;
  };

  const productById = useMemo(
    () => new Map(productList.map((p) => [p.productId, p])),
    [productList]
  );

  const hasPromotionItemInCart = useMemo(
    () =>
      cartItems.some((item) => {
        const p = productById.get(item.productId);
        return !!p?.promotionSearchResponse;
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
      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const purchasedLines = cartItems.map((item) => ({
        name: item.name,
        qty: item.quantity,
        unit: item.price,
        amount: item.price * item.quantity,
      }));

      const res = await createOrder({
        orderItems,
        applyMembership: paymentOptions.applyMembership,
        takePromotionFreeGift: paymentOptions.takeFreeGift,
      });
      const result = res?.result ?? res;

      setIsPaymentModalOpen(false);
      setReceipt({ lines: purchasedLines, summary: result });
      setIsReceiptOpen(true);
      setCartItemsById({});
    } catch (error) {
      console.error(error);
      alert(error.message || "결제에 실패했습니다.");
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

      <ReceiptModal
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
      />
    </div>
  );
}
