"use client";

import { Card, Button, Typography, Tag } from "antd";
import Link from "next/link";
import styles from "@/app/page.module.css";

const { Title, Text } = Typography;

export default function HomeBanner() {
  const slides = [
    { title: "Oferta especial: Pack Radical", subtitle: "+3 cartas raras", link: "/store", badge: "-30%" },
    { title: "Torneio semanal", subtitle: "Inscrições abertas", link: "/tournaments", badge: "Inscreva-se" },
  ];

  const s = slides[0];

  return (
    <Card className={styles.homeBanner} styles={{ body: { padding: 8 } }}>
      <div className={styles.bannerSlide}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: "linear-gradient(135deg,#7a5cff,#00c0ff)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 900, boxShadow: "0 8px 24px rgba(122,92,255,0.18)" }}>⚡</div>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tag className={styles.bannerBadge}>{s.badge}</Tag>
              <div className={styles.bannerTitle}>{s.title}</div>
            </div>
            <Text style={{ color: "rgba(220,230,255,0.9)" }}>{s.subtitle}</Text>
          </div>
        </div>

        <div>
          <Link href={s.link} legacyBehavior>
            <Button type="primary" size="small" className={styles.starterCtaButton}>Ver</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
