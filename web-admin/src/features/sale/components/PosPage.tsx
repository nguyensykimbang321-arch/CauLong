import { useEffect, useState, useCallback } from "react";
import { Row, Col, Select, Input } from "antd";
import ProductGrid from "./ProductGrid";
import CartSidebar from "./CartSidebar";
import { PosService } from "../services/sale.api";
import type {
  Facility,
  PosProduct,
} from "../types/sale.types";
import { usePosStore } from "../store/sale.store";

const PosPage = () => {
  const setSelectedFacilityId =
    usePosStore(
      (state) => state.setFacilityId
    );

  const addToCart = usePosStore(
    (state) => state.addToCart
  );

  const [facilities, setFacilities] =
    useState<Facility[]>([]);

  const [products, setProducts] =
    useState<PosProduct[]>([]);

  const [facilityId, setFacilityId] =
    useState<number>();

  const [keyword, setKeyword] =
    useState("");

  const loadFacilities = useCallback(
    async () => {
      const res =
        await PosService.getFacilities();

      setFacilities(res.data);
    },
    []
  );

  const loadProducts = useCallback(
    async (
      selectedFacilityId: number
    ) => {
      const res =
        await PosService.getProductsByFacility(
          selectedFacilityId
        );

      setProducts(res.data);
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFacilities();
  }, [loadFacilities]);

  useEffect(() => {
    if (!facilityId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts(facilityId);
  }, [facilityId, loadProducts]);

  const handleFacilityChange = (
    value: number
  ) => {
    setFacilityId(value);

    setSelectedFacilityId(value);
  };

  const filteredProducts = products
    .filter((p) => p.variant?.product)
    .filter((p) =>
      p.variant.product.name
        .toLowerCase()
        .includes(keyword.toLowerCase())
  );

  const handleSelectProduct = (
  product: PosProduct
) => {
  addToCart({
    variantId:
      product.variant.id,

    productId:
      product.variant.product.id,

    productName:
      product.variant.product.name,

    variantName:
      Object.entries(
        product.variant.attributes
      )
        .map(
          ([key, value]) =>
            `${key}: ${value}`
        )
        .join(" | "),

    quantity: 1,

    price:
      product.variant.price_cents,

    stock:
      product.quantity_on_hand,
  });
};

  return (
    <Row gutter={16}>
      <Col span={16}>
        <Select
          style={{ width: 300 }}
          placeholder="Chọn cơ sở"
          value={facilityId}
          onChange={
            handleFacilityChange
          }
        >
          {facilities.map((f) => (
            <Select.Option
              key={f.id}
              value={f.id}
            >
              {f.name}
            </Select.Option>
          ))}
        </Select>

        <Input.Search
          style={{ marginTop: 16 }}
          placeholder="Tìm sản phẩm"
          value={keyword}
          onChange={(e) =>
            setKeyword(
              e.target.value
            )
          }
        />

        <ProductGrid
          products={
            filteredProducts
          }
          onSelectProduct={
            handleSelectProduct
          }
        />
      </Col>

      <Col span={8}>
        <CartSidebar />
      </Col>
    </Row>
  );
};

export default PosPage;