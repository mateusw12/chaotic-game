"use client";

import React from "react";
import { Space, Tag } from "antd";
import styles from "../store-view.module.css";

type Limit = {
  window: string;
  remainingPurchases: number;
  maxPurchases: number;
};

type PackLimitsProps = {
  dailyLimit?: Limit | null;
  weeklyLimit?: Limit | null;
};

export default function PackLimits({ dailyLimit, weeklyLimit }: PackLimitsProps) {
  return (
    <Space wrap className={styles.packLimitsTop}>
      {dailyLimit ? (
        <Tag>
          🔥 HOJE {dailyLimit.remainingPurchases}/{dailyLimit.maxPurchases}
        </Tag>
      ) : null}
      {weeklyLimit ? (
        <Tag>
          ⚡ SEMANA {weeklyLimit.remainingPurchases}/{weeklyLimit.maxPurchases}
        </Tag>
      ) : null}
    </Space>
  );
}
