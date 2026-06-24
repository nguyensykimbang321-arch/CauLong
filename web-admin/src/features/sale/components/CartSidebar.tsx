import {
  Button,
  Divider,
  Empty,
  message,
  Radio,
  Modal,
} from "antd";

import { usePosStore } from "../store/sale.store";
import { PosService } from "../services/sale.api";

import {
  useState,
  useEffect,
} from "react";

import { QRCode } from "react-qr-code";

const CartSidebar = () => {
  const {
    cart,
    updateQuantity,
    removeItem,
    clearCart,
    selectedFacilityId,
  } = usePosStore();

  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "vnpay">("cash");

  const [qrVisible, setQrVisible] =
    useState(false);

  const [paymentUrl, setPaymentUrl] =
    useState("");

  const [currentOrderId, setCurrentOrderId] =
    useState<number | null>(null);

  const [isCheckoutLoading, setIsCheckoutLoading] =
    useState(false);

  const total = cart.reduce(
    (sum, item) =>
      sum +
      item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    try {
      if (!selectedFacilityId) {
        message.error(
          "Vui lòng chọn cơ sở"
        );
        return;
      }

      if (cart.length === 0) {
        message.error(
          "Giỏ hàng đang trống"
        );
        return;
      }

      setIsCheckoutLoading(true);

      const res =
        await PosService.createPosOrder({
          facility_id:
            selectedFacilityId,

          payment_method:
            paymentMethod,

          items: cart.map(
            (item) => ({
              variant_id:
                item.variantId,
              quantity:
                item.quantity,
            })
          ),
        });

      const order =
        res.data.order;

      /**
       * CASH
       */
      if (
        paymentMethod === "cash"
      ) {
        await PosService.payCash(
          order.id
        );

        clearCart();

        message.success(
          "Đã thanh toán tiền mặt thành công"
        );

        setTimeout(() => {
          window.location.reload();
        }, 1500);

        return;
      }

      /**
       * VNPAY
       */
      const url = res.data.paymentUrl;

      if (!url) {
        message.error(
          "Không tạo được link thanh toán"
        );
        return;
      }

      setCurrentOrderId(
        order.id
      );

      setPaymentUrl(url);

      setQrVisible(true);

      message.info(
        "Vui lòng quét QR để thanh toán"
      );

    } catch (error) {
      console.error(error);

      message.error(
        "Thanh toán thất bại"
      );

      setIsCheckoutLoading(false);
    }
  };

  /**
   * POLLING CHECK PAYMENT STATUS
   */
  useEffect(() => {
    if (
      !qrVisible ||
      !currentOrderId
    ) {
      return;
    }

    const interval =
      setInterval(
        async () => {
          try {
            const res =
              await PosService.getOrderById(
                currentOrderId
              );

            const order =
              res.data;

            /**
             * VNPay thành công
             * backend sẽ chuyển:
             *
             * pending_payment
             * ->
             * pending_pickup
             */
            if (
              order.status ===
              "pending_pickup"
            ) {
              clearCart();

              setQrVisible(
                false
              );

              setCurrentOrderId(
                null
              );

              setPaymentUrl("");

              message.success(
                "Thanh toán thành công"
              );
              
              setIsCheckoutLoading(false);

              clearInterval(
                interval
              );

              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }
          } catch (error) {
            console.error(
              error
            );
          }
        },
        3000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [
    qrVisible,
    currentOrderId,
    clearCart,
  ]);

  return (
    <>
      <h3>Giỏ hàng</h3>

      {cart.length === 0 ? (
        <Empty description="Chưa có sản phẩm" />
      ) : (
        cart.map((item) => (
          <div
            key={
              item.variantId
            }
            style={{
              marginBottom: 12,
              padding: 8,
              border:
                "1px solid #eee",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontWeight: 600,
              }}
            >
              {
                item.productName
              }
            </div>

            <div
              style={{
                color: "#888",
                fontSize: 12,
              }}
            >
              {
                item.variantName
              }
            </div>

            <div>
              {item.price.toLocaleString()}
              đ
            </div>

            <div
              style={{
                marginTop: 8,
              }}
            >
              <Button
                onClick={() => {
                  if (
                    item.quantity ===
                    1
                  ) {
                    removeItem(
                      item.variantId
                    );
                    return;
                  }

                  updateQuantity(
                    item.variantId,
                    item.quantity -
                    1
                  );
                }}
              >
                -
              </Button>

              <span
                style={{
                  margin:
                    "0 10px",
                }}
              >
                {
                  item.quantity
                }
              </span>

              <Button
                onClick={() => {
                  if (
                    item.quantity >=
                    item.stock
                  ) {
                    message.warning(
                      "Đã đạt số lượng tồn kho"
                    );
                    return;
                  }

                  updateQuantity(
                    item.variantId,
                    item.quantity +
                    1
                  );
                }}
              >
                +
              </Button>

              <Button
                danger
                style={{
                  marginLeft: 10,
                }}
                onClick={() =>
                  removeItem(
                    item.variantId
                  )
                }
              >
                Xóa
              </Button>
            </div>
          </div>
        ))
      )}

      <Divider />

      <Radio.Group
        value={
          paymentMethod
        }
        onChange={(e) =>
          setPaymentMethod(
            e.target.value
          )
        }
      >
        <Radio value="cash">
          Tiền mặt
        </Radio>

        <Radio value="vnpay">
          VNPay
        </Radio>
      </Radio.Group>

      <Divider />

      <h2>
        Tổng tiền:{" "}
        {total.toLocaleString()}
        đ
      </h2>

      <Button
        block
        type="primary"
        size="large"
        loading={isCheckoutLoading}
        disabled={
          cart.length === 0 || isCheckoutLoading
        }
        onClick={
          handleCheckout
        }
      >
        Thanh toán
      </Button>

      <Modal
        open={qrVisible}
        footer={null}
        centered
        destroyOnClose
        onCancel={() => {
          setQrVisible(false);
          setIsCheckoutLoading(false);
        }}
      >
        <div
          style={{
            textAlign:
              "center",
          }}
        >
          <h3>
            Quét mã VNPay để
            thanh toán
          </h3>

          <QRCode
            value={
              paymentUrl
            }
            size={250}
          />

          <p
            style={{
              marginTop: 16,
            }}
          >
            Dùng điện thoại
            quét mã QR
          </p>
        </div>
      </Modal>
    </>
  );
};

export default CartSidebar;