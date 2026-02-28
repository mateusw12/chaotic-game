"use client";

import { Card, Button, Typography, Tag, Skeleton } from "antd";
import Link from "next/link";
import Image from "next/image";
import styles from "@/app/page.module.css";
import { useEffect, useState } from "react";
import { StoreService } from "@/lib/api/services/store.service";

const { Text } = Typography;

export default function HomeBanner() {
  const [loading, setLoading] = useState(true);
  const [offerPack, setOfferPack] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await StoreService.getPacks();
        const packs = res.packs || [];

        const isOffer = (p: any) => {
          const text = `${p.name} ${p.description ?? ""}`.toLowerCase();
          if (/oferta|offer/.test(text)) return true;
          if (Array.isArray(p.priceOptions) && p.priceOptions.length > 0) {
            const cheapest = Math.min(...p.priceOptions.map((o: any) => o.price));
            if (cheapest < (p.price ?? Number.POSITIVE_INFINITY)) return true;
          }
          return false;
        };

        const found = packs.find(isOffer) ?? packs[0] ?? null;
        if (mounted) setOfferPack(found);
      } catch {
        if (mounted) setOfferPack(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <Card className={styles.homeBanner} styles={{ body: { padding: 8 } }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : offerPack ? (
        <div className={styles.bannerSlide}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(122,92,255,0.18)" }}>
              <Image
                src={offerPack.imageUrl ?? (offerPack.image_url ?? "/assets/packs/promo.png")}
                alt={offerPack.name ?? "pack"}
                width={64}
                height={64}
                style={{ objectFit: "cover", display: "block" }}
                unoptimized
              />
            </div>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Tag className={styles.bannerBadge}>{offerPack.price ? `R$ ${offerPack.price}` : "Oferta"}</Tag>
                <div className={styles.bannerTitle}>{offerPack.name}</div>
              </div>
              <Text style={{ color: "rgba(220,230,255,0.9)" }}>{offerPack.description}</Text>
            </div>
          </div>

          <div>
            <Link href="/store">
              <Button type="primary" size="small" className={styles.starterCtaButton}>Ver</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.bannerSlide}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(122,92,255,0.18)" }}>
              <Image
                src="/assets/packs/promo.png"
                alt="Loja"
                width={64}
                height={64}
                style={{ objectFit: "cover", display: "block" }}
                unoptimized
              />
            </div>
            <div>
              <div className={styles.bannerTitle}>Loja</div>
              <Text style={{ color: "rgba(220,230,255,0.9)" }}>Confira os pacotes em destaque na loja.</Text>
            </div>
          </div>

          <div>
            <Link href="/store">
              <Button type="primary" size="small" className={styles.starterCtaButton}>Ir para loja</Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
