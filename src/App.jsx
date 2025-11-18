import { useEffect, useMemo, useState } from "react";
import "./App.css";

export default function App() {
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

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
