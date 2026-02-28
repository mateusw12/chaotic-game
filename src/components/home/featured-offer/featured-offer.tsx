"use client";

import { Button } from "antd";
import styles from "@/app/page.module.css";
import Link from "next/link";

export default function FeaturedOffer() {
  return (
    <div className={styles.promoCard}>
      <div className={styles.promoInfo}>
        <div style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>Pack Destaque: Lendário Surge</div>
        <div style={{ color: "rgba(200,210,255,0.9)" }}>Inclui 1 lendária garantida + bônus surpresa</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className={styles.promoPrice}>R$ 12,90</div>
        <Link href="/store">
          <Button disabled type="primary" className={styles.starterCtaButton}>Comprar</Button>
        </Link>
      </div>
    </div>
  );
}
