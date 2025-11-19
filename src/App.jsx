import { useEffect, useMemo, useState } from "react";
import ProductCard from "./components/ProductCard";
import CartRow from "./components/CartRow";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import { money } from "./utils/money";
import { createOrder } from "./apis/orderApi";
import "./App.css";

const getPromotionConfig = (promotion) => {
  const buyQuantity =
    promotion?.buyQuantity ??
    promotion?.buy ??
    promotion?.requiredQuantity ??
    promotion?.requiredQty ??
    2;
  const freeQuantity =
    promotion?.freeQuantity ??
    promotion?.getQuantity ??
    promotion?.get ??
    promotion?.free ??
    1;
  return { buyQuantity, freeQuantity };
};

export default function App() {
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productList, setProductList] = useState([]);
  const [cartItemsByProductId, setCartItemsByProductId] = useState({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState({
    applyMembership: false,
    acceptAddMore: null,
    acceptNonPromoPurchase: null,
  });
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    (async () => {
      setIsLoadingProducts(true);
      try {
        const response = await fetch("/api/products");
        const json = await response.json();
        const productListFromResponse = Array.isArray(json.result)
          ? json.result
          : json.result?.data ?? [];
        setProductList(productListFromResponse);
      } catch (error) {
        console.error(error);
        alert("상품을 불러오지 못했습니다.");
      } finally {
        setIsLoadingProducts(false);
      }
    })();
  }, []);

  const addToCart = (productToAdd) => {
    setCartItemsByProductId((previousCartItemsByProductId) => {
      const nextCartItemsByProductId = { ...previousCartItemsByProductId };

      const existingCartItem = nextCartItemsByProductId[
        productToAdd.productId
      ] || {
        productId: productToAdd.productId,
        name: productToAdd.name,
        price: productToAdd.price,
        quantity: 0,
      };

      const alreadyInCartQuantity =
        Object.values(previousCartItemsByProductId).find(
          (cartItem) => cartItem.productId === productToAdd.productId
        )?.quantity ?? 0;

      const product = productList.find(
        (product) => product.productId === productToAdd.productId
      );
      const remainingStock = (product?.stock ?? 0) - alreadyInCartQuantity;
      if (remainingStock <= 0) return previousCartItemsByProductId;

      existingCartItem.quantity += 1;
      nextCartItemsByProductId[productToAdd.productId] = existingCartItem;
      return nextCartItemsByProductId;
    });
  };

  const increaseCartItemQuantity = (productId) =>
    setCartItemsByProductId((previousCartItemsByProductId) => {
      const nextCartItemsByProductId = { ...previousCartItemsByProductId };
      const cartRow = nextCartItemsByProductId[productId];
      if (!cartRow) return previousCartItemsByProductId;

      const product = productList.find(
        (product) => product.productId === productId
      );
      const remainingStock = (product?.stock ?? 0) - cartRow.quantity;
      if (remainingStock <= 0) return previousCartItemsByProductId;

      cartRow.quantity += 1;
      return nextCartItemsByProductId;
    });

  const decreaseCartItemQuantity = (productId) =>
    setCartItemsByProductId((previousCartItemsByProductId) => {
      const nextCartItemsByProductId = { ...previousCartItemsByProductId };
      const cartRow = nextCartItemsByProductId[productId];
      if (!cartRow) return previousCartItemsByProductId;

      cartRow.quantity -= 1;
      if (cartRow.quantity <= 0) delete nextCartItemsByProductId[productId];
      return nextCartItemsByProductId;
    });

  const removeCartItem = (productId) =>
    setCartItemsByProductId((previousCartItemsByProductId) => {
      const nextCartItemsByProductId = { ...previousCartItemsByProductId };
      delete nextCartItemsByProductId[productId];
      return nextCartItemsByProductId;
    });

  const cartItems = useMemo(
    () => Object.values(cartItemsByProductId),
    [cartItemsByProductId]
  );

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0),
    [cartItems]
  );

  const subtotalAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, cartItem) => sum + cartItem.price * cartItem.quantity,
        0
      ),
    [cartItems]
  );

  const paymentSummary = useMemo(
    () => ({ totalQuantity, subtotalText: money(subtotalAmount) }),
    [totalQuantity, subtotalAmount]
  );

  const productsByName = useMemo(() => {
    const productsByNameMap = new Map();
    for (const product of productList) {
      const productsWithSameName = productsByNameMap.get(product.name) ?? [];
      productsWithSameName.push(product);
      productsByNameMap.set(product.name, productsWithSameName);
    }
    return productsByNameMap;
  }, [productList]);

  const getQuantityInCart = (productId) =>
    cartItemsByProductId[productId]?.quantity ?? 0;

  const getRemainingStock = (product) =>
    (product.stock ?? 0) - getQuantityInCart(product.productId);

  const isNormalProductLocked = (product) => {
    if (product.promotionSearchResponse) return false;

    const productsWithSameName = productsByName.get(product.name) ?? [];
    const promotionProduct = productsWithSameName.find(
      (candidateProduct) => !!candidateProduct.promotionSearchResponse
    );
    if (!promotionProduct) return false;

    return getRemainingStock(promotionProduct) > 0;
  };

  const productById = useMemo(
    () => new Map(productList.map((product) => [product.productId, product])),
    [productList]
  );

  useEffect(() => {
    setPaymentOptions((previousPaymentOptions) => ({
      ...previousPaymentOptions,
      acceptAddMore: null,
      acceptNonPromoPurchase: null,
    }));
  }, [cartItems]);

  const missingPromotion = useMemo(() => {
    const getRemainingStockForCart = (product) =>
      (product.stock ?? 0) -
      (cartItemsByProductId[product.productId]?.quantity ?? 0);

    for (const cartItem of cartItems) {
      const product = productById.get(cartItem.productId);
      if (!product) continue;

      const promotion = product.promotionSearchResponse;
      if (!promotion) continue;

      const { buyQuantity, freeQuantity } = getPromotionConfig(promotion);
      if (!buyQuantity || !freeQuantity) continue;

      const groupSize = buyQuantity + freeQuantity;
      const quantityInCart = cartItem.quantity;

      if (quantityInCart < buyQuantity) continue;

      const remainder = quantityInCart % groupSize;
      if (remainder === 0) continue;

      const additionalQuantityNeeded = groupSize - remainder;
      if (additionalQuantityNeeded > freeQuantity) continue;

      const remainingStock = getRemainingStockForCart(product);
      if (remainingStock < additionalQuantityNeeded) continue;

      return {
        productName: product.name,
        extraQty: additionalQuantityNeeded,
      };
    }

    return null;
  }, [cartItems, cartItemsByProductId, productById]);

  const partialPromotion = useMemo(() => {
    for (const cartItem of cartItems) {
      const product = productById.get(cartItem.productId);
      if (!product) continue;

      const promotion = product.promotionSearchResponse;
      if (!promotion) continue;

      const { buyQuantity, freeQuantity } = getPromotionConfig(promotion);
      if (!buyQuantity || !freeQuantity) continue;

      const groupSize = buyQuantity + freeQuantity;
      const promotionStock = product.stock ?? 0;
      const quantityInCart = cartItem.quantity;

      if (quantityInCart < buyQuantity) continue;

      const remainder = quantityInCart % groupSize;
      if (remainder === 0) continue;

      const additionalNeededForFullPromotion = groupSize - remainder;
      const requiredPromotionStockForFullPromotion =
        quantityInCart + additionalNeededForFullPromotion;

      if (promotionStock < requiredPromotionStockForFullPromotion) {
        return {
          productName: product.name,
          nonPromoQty: remainder,
        };
      }
    }

    return null;
  }, [cartItems, productById]);

  const handleConfirmPayment = async () => {
    if (partialPromotion && paymentOptions.acceptNonPromoPurchase == null) {
      alert("프로모션 미적용 상품에 대한 동의를 선택해주세요.");
      return;
    }

    if (partialPromotion && paymentOptions.acceptNonPromoPurchase === false) {
      alert(
        "프로모션 할인이 적용되지 않는 상품 구매를 취소했습니다. 장바구니를 수정한 뒤 다시 결제해 주세요."
      );
      setIsPaymentModalOpen(false);
      return;
    }

    try {
      const originalCartItems = cartItems;
      let finalCartItems = cartItems;

      if (missingPromotion && paymentOptions.acceptAddMore === true) {
        finalCartItems = cartItems.map((cartItem) => {
          if (cartItem.name !== missingPromotion.productName) {
            return cartItem;
          }
          return {
            ...cartItem,
            quantity: cartItem.quantity + (missingPromotion.extraQty || 0),
          };
        });
      }

      const freeLines = finalCartItems
        .map((cartItem) => {
          const product = productById.get(cartItem.productId);
          const promotion = product?.promotionSearchResponse;
          if (!promotion) return null;

          const { buyQuantity, freeQuantity } = getPromotionConfig(promotion);
          if (!buyQuantity || !freeQuantity) return null;

          const groupSize = buyQuantity + freeQuantity;
          const groupCount = Math.floor(cartItem.quantity / groupSize);
          const freeCount = groupCount * freeQuantity;
          if (freeCount <= 0) return null;

          return {
            name: cartItem.name,
            qty: freeCount,
          };
        })
        .filter(Boolean);

      const orderItems = finalCartItems.map((cartItem) => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      }));

      const purchasedLines = finalCartItems.map((cartItem) => ({
        name: cartItem.name,
        qty: cartItem.quantity,
        unit: cartItem.price,
        amount: cartItem.price * cartItem.quantity,
      }));

      const response = await createOrder({
        orderItems,
        applyMembership: paymentOptions.applyMembership,
        takePromotionFreeGift: paymentOptions.acceptAddMore === true,
        acceptNonPromotionPurchase:
          paymentOptions.acceptNonPromoPurchase === true,
      });

      const result = response?.result ?? response;

      setIsPaymentModalOpen(false);
      setReceipt({ lines: purchasedLines, freeLines, summary: result });
      setIsReceiptOpen(true);
      setCartItemsByProductId({});
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
                cartItemsByProductId[product.productId]?.quantity ?? 0;
              const selfSoldOut = getRemainingStock(product) <= 0;
              const normalProductLocked = isNormalProductLocked(product);
              return (
                <ProductCard
                  key={product.productId}
                  product={product}
                  cartQty={quantityInCart}
                  onAdd={addToCart}
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

        <aside className="panel cart">
          <h3 className="panel__title">장바구니</h3>
          <div className="cart__rows">
            {cartItems.map((cartItem) => (
              <CartRow
                key={cartItem.productId}
                item={cartItem}
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
        missingPromotion={missingPromotion}
        partialPromotion={partialPromotion}
      />

      <ReceiptModal
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
      />
    </div>
  );
}
