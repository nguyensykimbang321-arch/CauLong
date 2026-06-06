import {
  Modal,
  List,
  Button,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { PosService } from "../services/sale.api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PendingPaymentOrders({
  open,
  onClose,
}: Props) {
  const [orders, setOrders] =
    useState<unknown[]>([]);

  const loadOrders =
    async () => {
      try {
        const res =
          await PosService.getPendingPaymentOrders();

        setOrders(res.data);
      } catch (error) {
        console.error(error);
      }
    };

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadOrders();
    }
  }, [open]);

  const handlePayCash =
    async (
      orderId: number
    ) => {
      try {
        await PosService.payCash(
          orderId
        );

        message.success(
          "Thanh toán thành công"
        );

        loadOrders();
      } catch (error) {
        console.error(error);

        message.error(
          "Thanh toán thất bại"
        );
      }
    };

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      title="Đơn chờ thanh toán"
    >
      <List
        dataSource={orders}
        renderItem={(order) => (
          <List.Item
            actions={[
              <Button
                type="primary"
                onClick={() =>
                  handlePayCash(
                    order.id
                  )
                }
              >
                Thanh toán
              </Button>,
            ]}
          >
            <div>
              <div>
                Đơn #
                {
                  order.id
                }
              </div>

              <div>
                {Number(
                  order.total_amount
                ).toLocaleString()}
                đ
              </div>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
}