"use client";

import { Space, Button } from "antd";
import Link from "next/link";
import styles from "@/app/page.module.css";

export default function CTAButtons() {
  return (
    <div className={styles.ctaRow}>
      <Space>
        <Link href="/play" legacyBehavior>
          <Button type="primary" size="large" className={styles.starterCtaButton}>Jogar</Button>
        </Link>
        <Link href="/store" legacyBehavior>
          <Button size="large" className={styles.starterCtaButton}>Loja</Button>
        </Link>
        <Link href="/decks" legacyBehavior>
          <Button size="large" className={styles.starterCtaButton}>Construir Deck</Button>
        </Link>
      </Space>
    </div>
  );
}
