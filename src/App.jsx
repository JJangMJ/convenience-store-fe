import { useEffect, useMemo, useState } from "react";
import ProductCard from "./components/ProductCard";
import CartRow from "./components/CartRow";
import PaymentModal from "./components/PaymentModal";
import { money } from "./utils/money";
import "./App.css";

export default function App() {
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productList, setProductList] = useState([]);
  const [cartItemsById, setCartItemsById] = useState({});

  useEffect(() => {
    (async () => {
      setIsLoadingProducts(true);
      try {
        const response = await fetch("/api/products");
        const responseJson = await response.json();
        const list = Array.isArray(responseJson.result)
          ? responseJson.result
          : responseJson.result?.data ?? [];
        setProductList(list);
      } catch (error) {
        console.error(error);
        alert("상품을 불러오지 못했습니다.");
      } finally {
        setIsLoadingProducts(false);
      }
    })();
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
              return (
                <ProductCard
                  key={product.productId}
                  product={product}
                  cartQty={quantityInCart}
                  onAdd={addToCart}
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
          <div className="cart__summary"></div>
          <button className="btn btn-fill cart__pay" disabled>
            결제하기
          </button>
        </aside>
      </main>
    </div>
  );
}
