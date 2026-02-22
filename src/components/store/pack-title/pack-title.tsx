"use client";

import React from "react";
import { Space, Tooltip, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { StorePackDto } from "@/dto/store";
import styles from "../store-view.module.css";
import { getEnumDescription } from "../store-view.helpers";

const { Text } = Typography;

type PackTitleProps = {
  pack: StorePackDto;
};

export default function PackTitle({ pack }: PackTitleProps) {
  return (
    <Space size={6}>
      <span>{pack.name}</span>
      <Tooltip
        title={(
          <Space orientation="vertical" size={2}>
            <Text style={{ color: "white" }}>
              Tipos: {pack.cardTypes.map((item) => getEnumDescription(item)).join(", ")}
            </Text>
            {pack.allowedTribes.length > 0 ? (
              <Text style={{ color: "white" }}>
                Tribos: {pack.allowedTribes.map((tribe) => getEnumDescription(tribe)).join(", ")}
              </Text>
            ) : null}
            {pack.guaranteedMinRarity ? (
              <Text style={{ color: "white" }}>
                Garantia: {pack.guaranteedCount} {getEnumDescription(pack.guaranteedMinRarity)}+
              </Text>
            ) : null}
          </Space>
        )}
      >
        <InfoCircleOutlined className={styles.infoIcon} />
      </Tooltip>
    </Space>
  );
}
