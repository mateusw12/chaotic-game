"use client";

import { Button, Card, Col, Modal, Row, Space, Spin, Tag, Tooltip, Typography, message } from "antd";
import { InfoCircleOutlined, ShoppingOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GetStorePacksResponseDto, PurchaseStorePackResponseDto, StorePackDto, StoreRevealCardDto } from "@/dto/store";
import styles from "./store-view.module.css";
import { PlayerShell } from "@/components/player/player-shell";
import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";

const { Title, Paragraph, Text } = Typography;

type StoreViewProps = {
    userName: string | null;
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

export function StoreView({ userName, userImageUrl }: StoreViewProps) {
    const [loading, setLoading] = useState(true);
    const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
    const [packs, setPacks] = useState<StorePackDto[]>([]);
    const [coins, setCoins] = useState(0);
    const [diamonds, setDiamonds] = useState(0);
    const [revealedCards, setRevealedCards] = useState<StoreRevealCardDto[]>([]);
    const [isRevealOpen, setIsRevealOpen] = useState(false);
    const [apiMessage, contextHolder] = message.useMessage();

    const loadStore = useCallback(async () => {
        setLoading(true);

        try {
            const response = await fetch("/api/store/packs", {
                method: "GET",
                cache: "no-store",
            });
            const payload = (await response.json()) as GetStorePacksResponseDto;

            if (!response.ok || !payload.success || !payload.wallet) {
                throw new Error(payload.message ?? "Erro ao carregar loja.");
            }

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
            const response = await fetch("/api/store/purchase", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ packId }),
            });

            const payload = (await response.json()) as PurchaseStorePackResponseDto;

            if (!response.ok || !payload.success || !payload.wallet) {
                throw new Error(payload.message ?? "Não foi possível concluir a compra.");
            }

            setCoins(payload.wallet.coins);
            setDiamonds(payload.wallet.diamonds);
            setRevealedCards(payload.cards);
            setIsRevealOpen(true);
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

    return (
        <PlayerShell
            selectedKey="store"
            userName={userName}
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
                            </Col>
                        );
                    })}
                </Row>
            )}
            <Modal
                open={isRevealOpen}
                title="Abertura do Pacote"
                onCancel={() => setIsRevealOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsRevealOpen(false)}>
                        Fechar
                    </Button>,
                ]}
                width={900}
            >
                <div className={styles.revealGrid}>
                    {revealedCards.map((card, index) => (
                        <Card
                            key={`${card.cardType}-${card.cardId}-${index}`}
                            size="small"
                            className={styles.revealCard}
                            style={{ animationDelay: `${index * 120}ms` }}
                        >
                            {card.cardImageUrl ? (
                                <Image
                                    src={card.cardImageUrl}
                                    alt={card.cardName ?? card.cardType}
                                    width={320}
                                    height={180}
                                    unoptimized
                                    className={styles.cardImage}
                                />
                            ) : null}
                            <Space orientation="vertical" size={2} style={{ marginTop: 8 }}>
                                <Text strong>{card.cardName ?? card.cardType}</Text>
                                <Text type="secondary">{getEnumDescription(card.cardType)}</Text>
                                <Text type="secondary">{getEnumDescription(card.rarity)}</Text>
                                {card.isDuplicateInCollection ? <Tag color="gold">Duplicada</Tag> : null}
                            </Space>
                        </Card>
                    ))}
                </div>
            </Modal>
        </PlayerShell>
    );
}
