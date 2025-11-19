import { useEffect } from "react";

export default function PaymentModal({
  open,
  onClose,
  onConfirm,
  options,
  setOptions,
  summary,
  missingPromotion,
  partialPromotion,
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const hasMissingPromotion =
    Array.isArray(missingPromotion) && missingPromotion.length > 0;

  const handleSelectAddMore = (productId, value) => {
    setOptions((previousOptions) => ({
      ...previousOptions,
      acceptAddMore: {
        ...(previousOptions.acceptAddMore || {}),
        [productId]: value,
      },
    }));
  };

  const isAddMoreSelected = (productId, expectedValue) => {
    const map = options.acceptAddMore || {};
    return map[productId] === expectedValue;
  };

  const handleSelectNonPromotionPurchase = (value) => {
    setOptions((previousOptions) => ({
      ...previousOptions,
      acceptNonPromoPurchase: value,
    }));
  };

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>결제 옵션 선택</h3>
        </div>

        <div className="modal__body">
          {hasMissingPromotion && (
            <div className="notice-box">
              {missingPromotion.map((offer) => (
                <div key={offer.productId} className="notice-box__item">
                  <p>
                    현재 <b>{offer.productName}</b>은(는){" "}
                    <b>{offer.extraQty}</b>개를 무료로 더 받을 수 있습니다.
                    추가하시겠습니까?
                  </p>
                  <div className="notice-box__buttons">
                    <button
                      type="button"
                      className={
                        isAddMoreSelected(offer.productId, true)
                          ? "btn btn-small btn-fill"
                          : "btn btn-small btn-ghost"
                      }
                      onClick={() => handleSelectAddMore(offer.productId, true)}
                    >
                      예
                    </button>
                    <button
                      type="button"
                      className={
                        isAddMoreSelected(offer.productId, false)
                          ? "btn btn-small btn-fill"
                          : "btn btn-small btn-ghost"
                      }
                      onClick={() =>
                        handleSelectAddMore(offer.productId, false)
                      }
                    >
                      아니오
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {partialPromotion && (
            <div className="notice-box">
              <p>
                현재 <b>{partialPromotion.productName}</b>{" "}
                <b>{partialPromotion.nonPromoQty}</b>개는 프로모션 할인이
                적용되지 않습니다. 그래도 구매하시겠습니까?
              </p>
              <div className="notice-box__buttons">
                <button
                  type="button"
                  className={
                    options.acceptNonPromoPurchase === true
                      ? "btn btn-small btn-fill"
                      : "btn btn-small btn-ghost"
                  }
                  onClick={() => handleSelectNonPromotionPurchase(true)}
                >
                  예
                </button>
                <button
                  type="button"
                  className={
                    options.acceptNonPromoPurchase === false
                      ? "btn btn-small btn-fill"
                      : "btn btn-small btn-ghost"
                  }
                  onClick={() => handleSelectNonPromotionPurchase(false)}
                >
                  아니오
                </button>
              </div>
            </div>
          )}

          <div className="membership-box">
            <label className="switch-row">
              <input
                type="checkbox"
                checked={options.applyMembership}
                onChange={(event) =>
                  setOptions((previousOptions) => ({
                    ...previousOptions,
                    applyMembership: event.target.checked,
                  }))
                }
              />
              <span>멤버십 할인 적용</span>
            </label>
            <p className="membership-box__desc"></p>
          </div>

          {summary && (
            <div className="modal__summary">
              <div>
                총 수량: <b>{summary.totalQuantity}</b>
              </div>
              <div>
                상품 금액: <b>{summary.subtotalText}</b>
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn-ghost" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-fill" onClick={onConfirm}>
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
}
