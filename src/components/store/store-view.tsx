"use client";

import { Button, Card, Col, Modal, Row, Space, Spin, Tag, Tooltip, Typography, message } from "antd";
import { InfoCircleOutlined, ShoppingOutlined } from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { StorePackDto, StoreRevealCardDto } from "@/dto/store";
import styles from "./store-view.module.css";
import { PlayerShell } from "@/components/player/player-shell";
import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";
import { StoreService } from "@/lib/api/service";

const { Title, Paragraph, Text } = Typography;
const REVEAL_CARD_FALLBACK_IMAGE = "/assets/card/verso.png";

type StoreViewProps = {
    userName: string | null;
    userNickName: string | null;
    userImageUrl: string | null;
};

function getEnumDescription(value: UserCardType | CreatureTribe | CardRarity): string {
    const map: Record<string, string> = {
        creature: "Criaturas",
        location: "Locais",
        mugic: "Mugic",
        battlegear: "Equipamentos",
        attack: "Ataques",
        overworld: "Outro Mundo",
        underworld: "Submundo",
        mipedian: "Mipedian",
        marrillian: "M'arrillian",
        danian: "Danian",
        ancient: "Antigos",
        comum: "Comum",
        incomum: "Incomum",
        rara: "Rara",
        super_rara: "Super Rara",
        ultra_rara: "Ultra Rara",
    };

    return map[value] ?? value;
}

function getCurrencyLabel(currency: StorePackDto["currency"]) {
    return currency === "coins" ? "moedas" : "diamantes";
}

function getCurrencySymbol(currency: StorePackDto["currency"]) {
    return currency === "coins" ? "🪙" : "💎";
}

export function StoreView({ userName, userNickName, userImageUrl }: StoreViewProps) {
    const [loading, setLoading] = useState(true);
    const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
    const [packs, setPacks] = useState<StorePackDto[]>([]);
    const [coins, setCoins] = useState(0);
    const [diamonds, setDiamonds] = useState(0);
    const [revealedCards, setRevealedCards] = useState<StoreRevealCardDto[]>([]);
    const [isRevealOpen, setIsRevealOpen] = useState(false);
    const [recentlyPurchasedPackId, setRecentlyPurchasedPackId] = useState<string | null>(null);
    const [apiMessage, contextHolder] = message.useMessage();

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

            setPacks(payload.packs);
            setCoins(payload.wallet.coins);
            setDiamonds(payload.wallet.diamonds);
        } catch (error) {
            apiMessage.error(error instanceof Error ? error.message : "Erro ao carregar loja.");
        } finally {
            setLoading(false);
        }
    }, [apiMessage]);

    useEffect(() => {
        void loadStore();
    }, [loadStore]);

    const handlePurchase = useCallback(async (packId: string) => {
        setPurchasingPackId(packId);

        try {
            const payload = await StoreService.purchase(packId);

            setCoins(payload.wallet.coins);
            setDiamonds(payload.wallet.diamonds);
            setRevealedCards(payload.cards);
            setIsRevealOpen(true);
            setRecentlyPurchasedPackId(packId);
            apiMessage.success("Pacote comprado com sucesso!");
            await loadStore();
        } catch (error) {
            apiMessage.error(error instanceof Error ? error.message : "Erro na compra do pacote.");
        } finally {
            setPurchasingPackId(null);
        }
    }, [apiMessage, loadStore]);

    const sortedPacks = useMemo(
        () => [...packs].sort((left, right) => left.price - right.price),
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
            <Title level={3} style={{ marginTop: 0 }}>Loja de Cards</Title>
            <Paragraph>
                Compre pacotes por moedas ou diamantes. Alguns têm limite diário e outros semanal.
            </Paragraph>

            {loading ? (
                <Space style={{ width: "100%", justifyContent: "center", paddingTop: 40 }}>
                    <Spin size="large" />
                </Space>
            ) : (
                <Row gutter={[16, 16]}>
                    {sortedPacks.map((pack) => {
                        const dailyLimit = pack.limits.find((limit) => limit.window === "daily");
                        const weeklyLimit = pack.limits.find((limit) => limit.window === "weekly");
                        const canPurchase = pack.limits.every((limit) => limit.remainingPurchases > 0);

                        return (
                            <Col key={pack.id} xs={24} sm={12} lg={8} xl={6}>
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
                                    <Card
                                        className={styles.packCard}
                                        size="small"
                                        title={(
                                            <Space size={6}>
                                                <span>{pack.name}</span>
                                                <Tooltip
                                                    title={(
                                                        <Space orientation="vertical" size={2}>
                                                            <Text style={{ color: "white" }}>
                                                                Tipos: {pack.cardTypes.map((item) => getEnumDescription(item)).join(", ")}
                                                            </Text>
                                                            {pack.tribeFilter ? (
                                                                <Text style={{ color: "white" }}>
                                                                    Região: {getEnumDescription(pack.tribeFilter)}
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
                                        )}
                                    >
                                        <div className={styles.packContent}>
                                            <Text className={styles.packDescription}>{pack.description}</Text>

                                            <div className={styles.offerBox}>
                                                <div className={styles.offerTopRow}>
                                                    <Tag className={styles.countTag}>{pack.cardsCount} cartas</Tag>
                                                    <Tag color={pack.currency === "coins" ? "gold" : "geekblue"}>
                                                        {pack.currency === "coins" ? "Moedas" : "Diamantes"}
                                                    </Tag>
                                                </div>

                                                <div className={styles.priceLine}>
                                                    <Text className={styles.priceSymbol}>{getCurrencySymbol(pack.currency)}</Text>
                                                    <Text className={styles.priceValue}>{pack.price}</Text>
                                                    <Text className={styles.priceUnit}>{getCurrencyLabel(pack.currency)}</Text>
                                                </div>

                                                <Text className={styles.priceHint}>
                                                    ≈ {Math.max(1, Math.round(pack.price / pack.cardsCount))} {getCurrencyLabel(pack.currency)} por carta
                                                </Text>
                                            </div>

                                            <Space wrap className={styles.limitsRow}>
                                                {dailyLimit ? (
                                                    <Tag>
                                                        Restam hoje: {dailyLimit.remainingPurchases}/{dailyLimit.maxPurchases}
                                                    </Tag>
                                                ) : null}
                                                {weeklyLimit ? (
                                                    <Tag>
                                                        Restam semana: {weeklyLimit.remainingPurchases}/{weeklyLimit.maxPurchases}
                                                    </Tag>
                                                ) : null}
                                            </Space>

                                            <Button
                                                className={styles.buyButton}
                                                type="primary"
                                                icon={<ShoppingOutlined />}
                                                onClick={() => void handlePurchase(pack.id)}
                                                loading={purchasingPackId === pack.id}
                                                disabled={!canPurchase || purchasingPackId !== null}
                                                block
                                            >
                                                Comprar
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                        );
                    })}
                </Row>
            )}
            <Modal
                open={isRevealOpen}
                title="Abertura do Pacote"
                className={styles.revealModal}
                onCancel={() => setIsRevealOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsRevealOpen(false)}>
                        Fechar
                    </Button>,
                ]}
                width={1180}
            >
                <div className={styles.revealHeader}>
                    <Text className={styles.revealTitle}>Cartas Reveladas</Text>
                    <Tag className={styles.revealCountTag}>{sortedRevealedCards.length} cartas</Tag>
                </div>
                <AnimatePresence mode="wait">
                    {isRevealOpen ? (
                        <motion.div
                            key={`reveal-${sortedRevealedCards.length}`}
                            className={styles.revealGrid}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.08,
                                        delayChildren: 0.05,
                                    },
                                },
                            }}
                        >
                            {sortedRevealedCards.map((card, index) => (
                                <motion.div
                                    key={`${card.cardType}-${card.cardId}-${index}`}
                                    variants={{
                                        hidden: { opacity: 0, y: 28, scale: 0.88, rotateY: -70, rotateX: 12 },
                                        visible: {
                                            opacity: 1,
                                            y: 0,
                                            scale: 1,
                                            rotateY: 0,
                                            rotateX: 0,
                                            transition: { type: "spring", stiffness: 180, damping: 18, mass: 0.8 },
                                        },
                                    }}
                                    whileHover={{ y: -8, scale: 1.03, rotateZ: -0.6 }}
                                    className={styles.revealMotionItem}
                                >
                                    <Card
                                        size="small"
                                        className={styles.revealCard}
                                    >
                                        <div className={styles.revealImageWrap}>
                                            {card.isDuplicateInCollection ? (
                                                <Tag color="gold" className={styles.duplicateBadge}>Duplicada</Tag>
                                            ) : null}
                                            <Image
                                                src={card.cardImageUrl ?? REVEAL_CARD_FALLBACK_IMAGE}
                                                alt={card.cardName ?? card.cardType}
                                                width={320}
                                                height={420}
                                                unoptimized
                                                className={styles.cardImage}
                                            />
                                        </div>
                                        <Space orientation="vertical" size={4} style={{ marginTop: 10, width: "100%" }}>
                                            <Text strong className={styles.revealCardName}>{card.cardName ?? card.cardType}</Text>
                                            <Space size={6} wrap className={styles.revealMetaRow}>
                                                <Tag className={styles.revealMetaTag}>{getEnumDescription(card.cardType)}</Tag>
                                                <Tag className={styles.revealMetaTag}>{getEnumDescription(card.rarity)}</Tag>
                                            </Space>
                                        </Space>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </Modal>
        </PlayerShell>
    );
}
