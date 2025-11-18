import { useEffect, useMemo, useState } from "react";
import "./App.css";

export default function App() {
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productList, setProductList] = useState([]);

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

  return (
    <div className="page">
      <header className="page__header">
        <div className="brand">W 편의점</div>
      </header>

      <main className="layout">
        <section className="panel">
          <h3 className="panel__title">상품</h3>
          {isLoadingProducts && <div className="empty">로딩 중…</div>}
          <div className="grid"></div>
        </section>

        <aside className="panel cart">
          <h3 className="panel__title">장바구니</h3>
          <div className="cart__rows"></div>
          <div className="cart__summary"></div>
          <button className="btn btn-fill cart__pay" disabled>
            결제하기
          </button>
        </aside>
      </main>
    </div>
  );
}
