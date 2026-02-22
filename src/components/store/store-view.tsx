"use client";

import { Button, Card, Col, Row, Space, Tag, Typography, notification } from "antd";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  SellStoreCardsResponseDto,
  StorePackDto,
  StoreRevealCardDto,
  StoreSellCardInputDto,
} from "@/dto/store";
import styles from "./store-view.module.css";
import { PlayerShell } from "@/components/player/player-shell";
import { ApiClient } from "@/lib/api/api-client";
import { StoreService } from "@/lib/api/services/store.service";
import { LoadingLogo } from "@/components/shared/loading-logo/loading-logo";
import { ensureDualCurrencyOptions, resolvePackImage, getEnumDescription, getCurrencySymbol } from "./store-view.helpers";
import RevealModal from "./reveal-modal/reveal-modal";
import PackLimits from "./pack-limits/pack-limits";
import PackTitle from "./pack-title/pack-title";

const { Title, Text } = Typography;

type StoreViewProps = {
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
};

export function StoreView({ userName, userNickName, userImageUrl }: StoreViewProps) {
  const [loading, setLoading] = useState(true);
  const [purchasingPackKey, setPurchasingPackKey] = useState<string | null>(null);
  const [packs, setPacks] = useState<StorePackDto[]>([]);
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [revealedCards, setRevealedCards] = useState<StoreRevealCardDto[]>([]);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [recentlyPurchasedPackId, setRecentlyPurchasedPackId] = useState<string | null>(null);
  const [sellingCardKey, setSellingCardKey] = useState<string | null>(null);
  const [sellingAll, setSellingAll] = useState(false);
  const [apiMessage, contextHolder] = notification.useNotification();
  const loadingLogoIcon = <LoadingLogo />;

  useEffect(() => {
    if (!recentlyPurchasedPackId) {
      return;
    }

    const timeout = setTimeout(() => {
      setRecentlyPurchasedPackId(null);
    }, 900);

    return () => clearTimeout(timeout);
  }, [recentlyPurchasedPackId]);

  const loadStore = useCallback(async () => {
    setLoading(true);

    try {
      const payload = await StoreService.getPacks();

      if (!payload.wallet) {
        throw new Error("Carteira não encontrada ao carregar loja.");
      }

      setPacks(payload.packs);
      setCoins(payload.wallet.coins);
      setDiamonds(payload.wallet.diamonds);
    } catch (error) {
      apiMessage.error({ message: error instanceof Error ? error.message : "Erro ao carregar loja." });
    } finally {
      setLoading(false);
    }
  }, [apiMessage]);

  useEffect(() => {
    void loadStore();
  }, [loadStore]);

  const handlePurchase = useCallback(async (packId: string, currency: StorePackDto["currency"]) => {
    const purchaseKey = `${packId}:${currency}`;
    setPurchasingPackKey(purchaseKey);

    try {
      const payload = await StoreService.purchase(packId, currency);

      if (!payload.wallet) {
        throw new Error("Carteira não encontrada após a compra.");
      }

      setCoins(payload.wallet.coins);
      setDiamonds(payload.wallet.diamonds);
      setRevealedCards(payload.cards);
      setIsRevealOpen(true);
      setRecentlyPurchasedPackId(packId);
      apiMessage.success({ title: "Pacote comprado com sucesso!" });
      await loadStore();
    } catch (error) {
      apiMessage.error({ message: error instanceof Error ? error.message : "Erro na compra do pacote." });
    } finally {
      setPurchasingPackKey(null);
    }
  }, [apiMessage, loadStore]);

  const sortedPacks = useMemo(
    () => [...packs].sort((left, right) => {
      const leftMin = Math.min(...ensureDualCurrencyOptions(left).map((item) => item.price));
      const rightMin = Math.min(...ensureDualCurrencyOptions(right).map((item) => item.price));
      return leftMin - rightMin;
    }),
    [packs],
  );

  const sortedRevealedCards = useMemo(
    () => revealedCards
      .map((card, index) => ({ card, index }))
      .sort((left, right) => {
        const duplicateWeightLeft = left.card.isDuplicateInCollection ? 1 : 0;
        const duplicateWeightRight = right.card.isDuplicateInCollection ? 1 : 0;

        if (duplicateWeightLeft !== duplicateWeightRight) {
          return duplicateWeightLeft - duplicateWeightRight;
        }

        return left.index - right.index;
      })
      .map((entry) => entry.card),
    [revealedCards],
  );

  const totalRevealSellValue = useMemo(
    () => sortedRevealedCards.reduce((sum, card) => sum + card.sellValue, 0),
    [sortedRevealedCards],
  );

  const removeSoldCardsFromList = useCallback((source: StoreRevealCardDto[], cards: StoreSellCardInputDto[]) => {
    const quantitiesByKey = new Map<string, number>();

    for (const card of cards) {
      const quantity = Math.max(1, Math.trunc(card.quantity ?? 1));
      const key = `${card.cardType}:${card.cardId}`;
      quantitiesByKey.set(key, (quantitiesByKey.get(key) ?? 0) + quantity);
    }

    return source.filter((card) => {
      const key = `${card.cardType}:${card.cardId}`;
      const remainingToRemove = quantitiesByKey.get(key) ?? 0;

      if (remainingToRemove <= 0) {
        return true;
      }

      quantitiesByKey.set(key, remainingToRemove - 1);
      return false;
    });
  }, []);

  const handleSellCards = useCallback(async (cards: StoreSellCardInputDto[], mode: "single" | "all") => {
    if (cards.length === 0) {
      return;
    }

    let rollbackCards: StoreRevealCardDto[] | null = null;

    if (mode === "all") {
      setSellingAll(true);
    } else {
      const card = cards[0];
      setSellingCardKey(`${card.cardType}:${card.cardId}`);
    }

    try {
      setRevealedCards((previous) => {
        rollbackCards = previous;
        return removeSoldCardsFromList(previous, cards);
      });

      const payload: SellStoreCardsResponseDto = typeof StoreService.sellCards === "function"
        ? await StoreService.sellCards(cards)
        : await ApiClient.post<SellStoreCardsResponseDto, { cards: StoreSellCardInputDto[] }>("/store/sell", { cards });

      if (!payload.success || !payload.wallet) {
        throw new Error(payload.message ?? "Não foi possível vender as cartas.");
      }

      setCoins(payload.wallet.coins);
      setDiamonds(payload.wallet.diamonds);
      apiMessage.success({ title: `Venda concluída: +${payload.coinsEarned} moedas.` });
    } catch (error) {
      if (rollbackCards) {
        setRevealedCards(rollbackCards);
      }
      apiMessage.error({ message: error instanceof Error ? error.message : "Erro ao vender cartas." });
    } finally {
      setSellingAll(false);
      setSellingCardKey(null);
    }
  }, [apiMessage, removeSoldCardsFromList]);

  const handleCloseRevealModal = useCallback(() => {
    setIsRevealOpen(false);

    if (revealedCards.length > 0) {
      apiMessage.success({ title: "Cartas adicionadas ao seu deck com sucesso." });
    }
  }, [apiMessage, revealedCards.length]);

  return (
    <PlayerShell
      selectedKey="store"
      userName={userName}
      userNickName={userNickName}
      userImageUrl={userImageUrl}
      coins={coins}
      diamonds={diamonds}
      userRole="user"
    >
      {contextHolder}
      <section className={styles.storeHero}>
        <Title level={3} className={styles.storeTitle}>Loja de Cards</Title>
      </section>

      {loading ? (
        <Space style={{ width: "100%", justifyContent: "center", paddingTop: 40 }}>
          <LoadingLogo size="large" alt="Carregando loja" />
        </Space>
      ) : (
        <Row gutter={[16, 16]} className={styles.packsGrid}>
          {sortedPacks.map((pack) => {
            const dailyLimit = pack.limits.find((limit) => limit.window === "daily");
            const weeklyLimit = pack.limits.find((limit) => limit.window === "weekly");
            const canPurchase = pack.limits.every((limit) => limit.remainingPurchases > 0);
            const displayPriceOptions = ensureDualCurrencyOptions(pack);
            const packImageUrl = resolvePackImage(pack);

            return (
              <Col key={pack.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                <motion.div
                  className={styles.packMotionWrap}
                  initial={{ opacity: 0, y: 18 }}
                  animate={recentlyPurchasedPackId === pack.id
                    ? {
                      opacity: 1,
                      y: [0, -6, 0],
                      scale: [1, 1.03, 1],
                      rotateZ: [0, -0.8, 0.8, 0],
                      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
                    }
                    : { opacity: 1, y: 0, scale: 1, rotateZ: 0, filter: "brightness(1)" }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.42, ease: "easeOut", delay: 0.02 }}
                >
                  <PackLimits dailyLimit={dailyLimit} weeklyLimit={weeklyLimit} />

                  <Card
                    className={styles.packCard}
                    size="small"
                    title={<PackTitle pack={pack} />}
                  >
                    <div className={styles.packContent}>
                      {packImageUrl ? (
                        <Image
                          src={packImageUrl}
                          alt={pack.name}
                          width={640}
                          height={360}
                          unoptimized
                          className={styles.packImage}
                        />
                      ) : null}
                      <Text className={styles.packDescription}>{pack.description}</Text>

                      <div className={styles.offerBox}>
                        <div className={styles.offerTopRow}>
                          <Tag className={styles.countTag}>{pack.cardsCount} cartas</Tag>
                        </div>


                      </div>

                      <Space orientation="vertical" size={8} style={{ width: "100%", marginTop: "auto" }}>
                        {displayPriceOptions.map((option) => {
                          const purchaseKey = `${pack.id}:${option.currency}`;

                          return (
                            <Button
                              key={purchaseKey}
                              className={styles.buyButton}
                              type="primary"
                              icon={purchasingPackKey === purchaseKey ? loadingLogoIcon : undefined}
                              onClick={() => void handlePurchase(pack.id, option.currency)}
                              disabled={!canPurchase || purchasingPackKey !== null}
                              block
                            >
                              {getCurrencySymbol(option.currency)} {option.price}
                            </Button>
                          );
                        })}
                      </Space>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>
      )}
      <RevealModal
        open={isRevealOpen}
        onClose={handleCloseRevealModal}
        revealedCards={sortedRevealedCards}
        totalSellValue={totalRevealSellValue}
        sellingAll={sellingAll}
        sellingCardKey={sellingCardKey}
        loadingIcon={loadingLogoIcon}
        onSellCards={handleSellCards}
        getEnumDescription={getEnumDescription}
      />
    </PlayerShell>
  );
}
