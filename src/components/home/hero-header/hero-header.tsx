"use client";

import Link from "next/link";
import { Button, Space, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import styles from "@/app/page.module.css";

const { Title } = Typography;

type HeroHeaderProps = {
  title?: string;
  userRole: "user" | "admin";
};

export default function HeroHeader({ title = "Mundo Chaotic", userRole }: HeroHeaderProps) {
  return (
    <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
      <Title level={2} style={{ margin: 0 }}>{title}</Title>
      {userRole === "admin" ? (
        <Link href="/admin/permissions">
          <Button icon={<SettingOutlined />}>Administração</Button>
        </Link>
      ) : null}
    </Space>
  );
}
