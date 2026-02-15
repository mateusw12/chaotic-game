"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DeleteOutlined } from "@ant-design/icons";
import {
    App as AntdApp,
    Button,
    Card,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Tabs,
    Tag,
    Typography,
} from "antd";
import type { DeckCollectionCardDto, DeckDto } from "@/dto/deck";
import { CARD_RARITY_OPTIONS, CREATURE_TRIBE_OPTIONS, type CardRarity, type CreatureTribe } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";
import { StoreService } from "@/lib/api/services/store.service";
import { PlayerShell } from "@/components/player/player-shell";
import { DecksService } from "@/lib/api/service";
import styles from "./decks-view.module.css";

type DecksViewProps = {
    userName: string | null;
    userNickName: string | null;
    userImageUrl: string | null;
    userRole: "user" | "admin";
    coins: number;
    diamonds: number;
};

type DeckFilters = {
    tribe?: CreatureTribe;
    rarity?: CardRarity;
    cardType?: UserCardType;
    name: string;
    energy?: number;
};

const CARD_TYPE_OPTIONS: Array<{ value: UserCardType; label: string }> = [
    { value: "creature", label: "Criaturas" },
    { value: "mugic", label: "Mugics" },
    { value: "battlegear", label: "Equipamentos" },
    { value: "location", label: "Locais" },
    { value: "attack", label: "Ataques" },
];

const { Title, Text } = Typography;
const EMPTY_VIEWED_GROUPS: Record<UserCardType, Array<DeckCollectionCardDto & { deckQuantity: number }>> = {
    creature: [],
    mugic: [],
    battlegear: [],
    location: [],
    attack: [],
};

function tribeClass(tribe: CreatureTribe | null) {
    switch (tribe) {
        case "overworld": return styles.tribeOverworld;
        case "underworld": return styles.tribeUnderworld;
        case "danian": return styles.tribeDanian;
        case "mipedian": return styles.tribeMipedian;
        case "marrillian": return styles.tribeMarrillian;
        case "ancient": return styles.tribeAncient;
        default: return styles.tribeNeutral;
    }
}

export function DecksView({
    userName,
    userNickName,
    userImageUrl,
    userRole,
    coins,
    diamonds,
}: DecksViewProps) {
    const { message } = AntdApp.useApp();
    const [currentCoins, setCurrentCoins] = useState(coins);
    const [currentDiamonds, setCurrentDiamonds] = useState(diamonds);
    const [filters, setFilters] = useState<DeckFilters>({ name: "" });
    const [newDeckName, setNewDeckName] = useState("");
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [viewDeckId, setViewDeckId] = useState<string | null>(null);
    const [deckCardTypeFilter, setDeckCardTypeFilter] = useState<UserCardType | undefined>(undefined);
    const [selectedCollectionCard, setSelectedCollectionCard] = useState<DeckCollectionCardDto | null>(null);
    const [sellQuantity, setSellQuantity] = useState(1);

    const [modalNameFilter, setModalNameFilter] = useState("");
    const [modalRarityFilter, setModalRarityFilter] = useState<CardRarity | undefined>(undefined);
    const [modalEnergyFilter, setModalEnergyFilter] = useState<number | undefined>(undefined);

    const query = useQuery({
        queryKey: ["decks-overview"],
        queryFn: () => DecksService.getOverview(),
    });

    const createDeckMutation = useMutation({
        mutationFn: (name: string) => DecksService.createDeck({ name }),
        onSuccess: async () => {
            setNewDeckName("");
            await query.refetch();
            message.success("Deck criado com sucesso.");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "Erro ao criar deck.");
        },
    });

    const updateDeckMutation = useMutation({
        mutationFn: ({ deckId, payload }: { deckId: string; payload: { name?: string; cards?: DeckDto["cards"] } }) =>
            DecksService.updateDeck(deckId, payload),
        onSuccess: async () => {
            await query.refetch();
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "Erro ao atualizar deck.");
        },
    });

    const removeDeckMutation = useMutation({
        mutationFn: (deckId: string) => DecksService.removeDeck(deckId),
        onSuccess: async () => {
            setSelectedDeckId(null);
            setViewDeckId(null);
            await query.refetch();
            message.success("Deck removido.");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "Erro ao remover deck.");
        },
    });

    const sellCardMutation = useMutation({
        mutationFn: (payload: { cardType: UserCardType; cardId: string; quantity: number }) =>
            StoreService.sellCards([payload]),
        onSuccess: async (response) => {
            if (!response.wallet) {
                throw new Error("Não foi possível atualizar a carteira após a venda.");
            }

            setCurrentCoins(response.wallet.coins);
            setCurrentDiamonds(response.wallet.diamonds);
            setSelectedCollectionCard(null);
            setSellQuantity(1);
            await query.refetch();
            message.success(`Carta vendida: +${response.coinsEarned} moedas.`);
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "Erro ao vender carta.");
        },
    });

    const overview = query.data;
    const decks = overview?.decks ?? [];
    const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? decks[0] ?? null;
    const viewedDeck = decks.find((deck) => deck.id === viewDeckId) ?? null;

    const collection = overview?.collection ?? [];
    const collectionByKey = useMemo(
        () => new Map(collection.map((card) => [`${card.cardType}:${card.cardId}`, card] as const)),
        [collection],
    );

    const filteredCollection = useMemo(() => {
        return collection.filter((card) => {
            if (filters.tribe && card.primaryTribe !== filters.tribe) {
                return false;
            }

            if (filters.rarity && card.rarity !== filters.rarity) {
                return false;
            }

            if (filters.cardType && card.cardType !== filters.cardType) {
                return false;
            }

            if (filters.energy !== undefined && card.energy !== filters.energy) {
                return false;
            }

            if (filters.name.trim() && !card.name.toLowerCase().includes(filters.name.trim().toLowerCase())) {
                return false;
            }

            return true;
        });
    }, [collection, filters]);

    const repeatedCards = useMemo(() => filteredCollection.filter((card) => card.quantity > 1), [filteredCollection]);
    const repeatedCardsCount = repeatedCards.length;
    const repeatedTotalQuantity = useMemo(
        () => repeatedCards.reduce((sum, card) => sum + card.quantity, 0),
        [repeatedCards],
    );

    const deckCardMap = useMemo(() => {
        if (!selectedDeck) {
            return new Map<string, number>();
        }

        return new Map(selectedDeck.cards.map((entry) => [`${entry.cardType}:${entry.cardId}`, entry.quantity]));
    }, [selectedDeck]);

    const viewedDeckCards = useMemo(() => {
        if (!viewedDeck) {
            return [] as Array<DeckCollectionCardDto & { deckQuantity: number }>;
        }

        return viewedDeck.cards
            .map((entry) => {
                const item = collectionByKey.get(`${entry.cardType}:${entry.cardId}`);

                if (!item) {
                    return null;
                }

                return {
                    ...item,
                    deckQuantity: entry.quantity,
                };
            })
            .filter((item): item is DeckCollectionCardDto & { deckQuantity: number } => Boolean(item));
    }, [collectionByKey, viewedDeck]);

    const viewedDeckCardsFiltered = useMemo(() => {
        return viewedDeckCards.filter((card) => {
            if (modalNameFilter.trim() && !card.name.toLowerCase().includes(modalNameFilter.trim().toLowerCase())) {
                return false;
            }

            if (modalRarityFilter && card.rarity !== modalRarityFilter) {
                return false;
            }

            if (modalEnergyFilter !== undefined && card.energy !== modalEnergyFilter) {
                return false;
            }

            return true;
        });
    }, [modalEnergyFilter, modalNameFilter, modalRarityFilter, viewedDeckCards]);

    const viewedDeckCardsByType = useMemo(() => {
        if (!viewedDeck) {
            return EMPTY_VIEWED_GROUPS;
        }

        return viewedDeckCardsFiltered.reduce<Record<UserCardType, Array<DeckCollectionCardDto & { deckQuantity: number }>>>(
            (groups, card) => {
                groups[card.cardType].push(card);
                return groups;
            },
            {
                creature: [],
                mugic: [],
                battlegear: [],
                location: [],
                attack: [],
            },
        );
    }, [viewedDeck, viewedDeckCardsFiltered]);

    const handleAddCardToDeck = async (card: DeckCollectionCardDto) => {
        if (!selectedDeck) {
            message.warning("Crie ou selecione um deck primeiro.");
            return;
        }

        const key = `${card.cardType}:${card.cardId}`;
        const currentQuantity = deckCardMap.get(key) ?? 0;

        const nextCards = [
            ...(selectedDeck.cards.filter((entry) => `${entry.cardType}:${entry.cardId}` !== key)),
            {
                cardType: card.cardType,
                cardId: card.cardId,
                quantity: currentQuantity + 1,
            },
        ];

        await updateDeckMutation.mutateAsync({
            deckId: selectedDeck.id,
            payload: { cards: nextCards },
        });
    };

    const handleChangeDeckCardQuantity = async (cardKey: string, quantity: number) => {
        if (!selectedDeck) {
            return;
        }

        const [cardType, cardId] = cardKey.split(":");
        const normalizedQuantity = Math.max(0, Math.trunc(quantity));

        const baseCards = selectedDeck.cards.filter((entry) => `${entry.cardType}:${entry.cardId}` !== cardKey);
        const nextCards = normalizedQuantity > 0
            ? [...baseCards, { cardType: cardType as DeckDto["cards"][number]["cardType"], cardId, quantity: normalizedQuantity }]
            : baseCards;

        await updateDeckMutation.mutateAsync({
            deckId: selectedDeck.id,
            payload: { cards: nextCards },
        });
    };

    const handleCardClick = (card: DeckCollectionCardDto) => {
        setSelectedCollectionCard(card);
        setSellQuantity(1);
    };

    const handleSellSelectedCard = async () => {
        if (!selectedCollectionCard) {
            return;
        }

        const quantity = Math.min(selectedCollectionCard.quantity, Math.max(1, Math.trunc(sellQuantity)));

        await sellCardMutation.mutateAsync({
            cardType: selectedCollectionCard.cardType,
            cardId: selectedCollectionCard.cardId,
            quantity,
        });
    };

    const selectedSellUnitValue = selectedCollectionCard
        ? Number.isFinite(Number(selectedCollectionCard.sellValue))
            ? Math.max(0, Math.trunc(Number(selectedCollectionCard.sellValue)))
            : 0
        : 0;

    const selectedSellQuantity = selectedCollectionCard
        ? Math.min(
            Math.max(1, Math.trunc(Number(selectedCollectionCard.quantity) || 1)),
            Math.max(1, Math.trunc(Number(sellQuantity) || 1)),
        )
        : 1;

    const selectedSellTotal = selectedSellUnitValue * selectedSellQuantity;

    const selectedDeckCards = useMemo(
        () => (selectedDeck?.cards ?? []).filter((entry) => !deckCardTypeFilter || entry.cardType === deckCardTypeFilter),
        [deckCardTypeFilter, selectedDeck],
    );

    const collectionTabs = useMemo(
        () => [
            {
                key: "all",
                label: "Coleção",
                children: (
                    <div className={styles.cardsGrid}>
                        {filteredCollection.map((card) => (
                            <div
                                key={`${card.cardType}:${card.cardId}`}
                                className={`${styles.cardButton} ${tribeClass(card.primaryTribe)}`}
                                onClick={() => handleCardClick(card)}
                            >
                                <div className={styles.cardImageWrap}>
                                    <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
                                </div>
                                <Text className={styles.cardName}>{card.name}</Text>
                                <Space style={{ marginTop: 6, width: "100%", justifyContent: "space-between" }}>
                                    <Tag>{card.quantity}x</Tag>
                                    <Button
                                        size="small"
                                        type="primary"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void handleAddCardToDeck(card);
                                        }}
                                    >
                                        Adicionar
                                    </Button>
                                </Space>
                            </div>
                        ))}
                    </div>
                ),
            },
            {
                key: "repeated",
                label: (
                    <Space size={6}>
                        <span>Repetidas</span>
                        {repeatedCardsCount > 0 ? <Tag color="gold">{repeatedCardsCount}</Tag> : null}
                        {repeatedTotalQuantity > 0 ? <Tag>{repeatedTotalQuantity} total</Tag> : null}
                    </Space>
                ),
                children: (
                    <div className={styles.cardsGrid}>
                        {repeatedCards.map((card) => (
                            <div
                                key={`repeated-${card.cardType}:${card.cardId}`}
                                className={`${styles.cardButton} ${tribeClass(card.primaryTribe)}`}
                                onClick={() => handleCardClick(card)}
                            >
                                <div className={styles.cardImageWrap}>
                                    <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
                                </div>
                                <Text className={styles.cardName}>{card.name}</Text>
                                <Space style={{ marginTop: 6, width: "100%", justifyContent: "space-between" }}>
                                    <Tag>{card.quantity}x</Tag>
                                    <Button
                                        size="small"
                                        type="primary"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void handleAddCardToDeck(card);
                                        }}
                                    >
                                        Adicionar
                                    </Button>
                                </Space>
                            </div>
                        ))}
                    </div>
                ),
            },
        ],
        [filteredCollection, repeatedCards, repeatedCardsCount, repeatedTotalQuantity],
    );

    return (
        <PlayerShell
            selectedKey="decks"
            userName={userName}
            userNickName={userNickName}
            userImageUrl={userImageUrl}
            userRole={userRole}
            coins={currentCoins}
            diamonds={currentDiamonds}
        >
            <Space orientation="vertical" size={14} style={{ width: "100%" }}>
                <Title level={3} style={{ margin: 0 }} className={styles.pageTitle}>Meu Deck</Title>
                <div className={styles.root}>
                    <Card className={styles.panel}>
                        <div className={styles.filters}>
                            <Input
                                placeholder="Filtrar por nome"
                                value={filters.name}
                                onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
                            />
                            <Select
                                allowClear
                                placeholder="Tribo"
                                options={CREATURE_TRIBE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                value={filters.tribe}
                                onChange={(value) => setFilters((prev) => ({ ...prev, tribe: value }))}
                            />
                            <InputNumber
                                min={0}
                                placeholder="Energia"
                                value={filters.energy}
                                onChange={(value) => setFilters((prev) => ({ ...prev, energy: value ?? undefined }))}
                                style={{ width: "100%" }}
                            />
                            <Select
                                allowClear
                                placeholder="Raridade"
                                options={CARD_RARITY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                value={filters.rarity}
                                onChange={(value) => setFilters((prev) => ({ ...prev, rarity: value }))}
                            />
                            <Select
                                allowClear
                                placeholder="Tipo de carta"
                                options={CARD_TYPE_OPTIONS}
                                value={filters.cardType}
                                onChange={(value) => setFilters((prev) => ({ ...prev, cardType: value }))}
                            />
                        </div>

                        <Tabs items={collectionTabs} />
                    </Card>

                    <Card className={styles.panel}>
                        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                            <div className={styles.deckHeader}>
                                <Text strong>Gerenciar decks</Text>
                            </div>

                            <Space.Compact style={{ width: "100%" }}>
                                <Input
                                    placeholder="Nome do novo deck"
                                    value={newDeckName}
                                    onChange={(event) => setNewDeckName(event.target.value)}
                                />
                                <Button
                                    type="primary"
                                    loading={createDeckMutation.isPending}
                                    onClick={() => {
                                        if (!newDeckName.trim()) {
                                            message.warning("Informe o nome do deck.");
                                            return;
                                        }

                                        void createDeckMutation.mutateAsync(newDeckName);
                                    }}
                                >
                                    Criar
                                </Button>
                            </Space.Compact>

                            <div className={styles.deckList}>
                                {decks.map((deck) => (
                                    <div key={deck.id} className={styles.deckRow}>
                                        <Space>
                                            <Button type={selectedDeck?.id === deck.id ? "primary" : "default"} onClick={() => setSelectedDeckId(deck.id)}>
                                                {deck.name}
                                            </Button>
                                            <Button onClick={() => setViewDeckId(deck.id)}>Visualizar</Button>
                                        </Space>
                                        <Button danger onClick={() => void removeDeckMutation.mutateAsync(deck.id)} loading={removeDeckMutation.isPending}>
                                            Remover
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                <Text strong>Cartas do deck</Text>
                                <Select
                                    allowClear
                                    placeholder="Filtrar tipo"
                                    options={CARD_TYPE_OPTIONS}
                                    value={deckCardTypeFilter}
                                    onChange={(value) => setDeckCardTypeFilter(value)}
                                    style={{ width: 190 }}
                                />
                            </Space>

                            <div className={styles.deckCards}>
                                {selectedDeckCards
                                    .map((entry) => {
                                        const item = collectionByKey.get(`${entry.cardType}:${entry.cardId}`);
                                        const key = `${entry.cardType}:${entry.cardId}`;

                                        return (
                                            <div key={key} className={styles.deckCardRow}>
                                                <Text>{item?.name ?? `${entry.cardType} ${entry.cardId.slice(0, 6)}`}</Text>
                                                <InputNumber
                                                    min={0}
                                                    value={entry.quantity}
                                                    onChange={(value) => {
                                                        void handleChangeDeckCardQuantity(key, Number(value ?? 0));
                                                    }}
                                                />
                                                <Button danger onClick={() => void handleChangeDeckCardQuantity(key, 0)}>
                                                    X
                                                </Button>
                                            </div>
                                        );
                                    })}
                            </div>
                        </Space>
                    </Card>
                </div>

                <Modal
                    title={viewedDeck ? `Visualizar deck: ${viewedDeck.name}` : "Visualizar deck"}
                    className={styles.viewDeckModal}
                    open={Boolean(viewedDeck)}
                    onCancel={() => setViewDeckId(null)}
                    footer={null}
                    width={1200}
                >
                    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                        <div className={styles.filters}>
                            <Input
                                placeholder="Filtrar por nome"
                                value={modalNameFilter}
                                onChange={(event) => setModalNameFilter(event.target.value)}
                            />
                            <Select
                                allowClear
                                placeholder="Raridade"
                                options={CARD_RARITY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                value={modalRarityFilter}
                                onChange={(value) => setModalRarityFilter(value)}
                            />
                            <InputNumber
                                min={0}
                                placeholder="Energia"
                                value={modalEnergyFilter}
                                onChange={(value) => setModalEnergyFilter(value ?? undefined)}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <Tabs
                            items={CARD_TYPE_OPTIONS.map((tab) => ({
                                key: tab.value,
                                label: tab.label,
                                children: (
                                    <div className={styles.cardsGrid}>
                                        {viewedDeckCardsByType[tab.value].map((card) => {
                                            const cardKey = `${card.cardType}:${card.cardId}`;

                                            return (
                                                <div key={`modal-${cardKey}`} className={`${styles.cardButton} ${tribeClass(card.primaryTribe)}`}>
                                                    <div className={styles.cardImageWrap}>
                                                        <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
                                                    </div>
                                                    <Text className={styles.cardName}>{card.name}</Text>
                                                    <Space style={{ marginTop: 6, width: "100%", justifyContent: "space-between" }}>
                                                        <InputNumber
                                                            min={0}
                                                            value={card.deckQuantity}
                                                            onChange={(value) => {
                                                                void handleChangeDeckCardQuantity(cardKey, Number(value ?? 0));
                                                            }}
                                                        />
                                                        <Button
                                                            danger
                                                            type="text"
                                                            size="small"
                                                            icon={<DeleteOutlined />}
                                                            aria-label="Remover carta"
                                                            title="Remover carta"
                                                            onClick={() => void handleChangeDeckCardQuantity(cardKey, 0)}
                                                        />
                                                    </Space>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ),
                            }))}
                        />
                    </Space>
                </Modal>

                <Modal
                    title={selectedCollectionCard ? `Carta: ${selectedCollectionCard.name}` : "Carta"}
                    className={styles.actionCardModal}
                    open={Boolean(selectedCollectionCard)}
                    onCancel={() => {
                        setSelectedCollectionCard(null);
                        setSellQuantity(1);
                    }}
                    footer={null}
                    width={420}
                >
                    {selectedCollectionCard ? (
                        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                            <Text type="secondary">Gerencie esta carta de forma rápida: adicione ao deck ou venda por moedas.</Text>

                            <div className={styles.actionCardSummary}>
                                <div>
                                    <Text className={styles.actionCardLabel}>Disponível</Text>
                                    <div><Tag>{selectedCollectionCard.quantity}x</Tag></div>
                                </div>
                                <div>
                                    <Text className={styles.actionCardLabel}>Valor unitário</Text>
                                    <div><Tag color="gold">{selectedSellUnitValue} moedas</Tag></div>
                                </div>
                                <div>
                                    <Text className={styles.actionCardLabel}>Total da venda</Text>
                                    <div><Tag color="gold">{selectedSellTotal} moedas</Tag></div>
                                </div>
                            </div>

                            <div className={styles.actionCardQuantity}>
                                <Text className={styles.actionCardLabel}>Quantidade para venda</Text>
                                <InputNumber
                                    min={1}
                                    max={selectedCollectionCard.quantity}
                                    value={sellQuantity}
                                    onChange={(value) => setSellQuantity(Math.max(1, Number(value ?? 1)))}
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div className={styles.actionCardButtons}>
                                <Button block onClick={() => void handleAddCardToDeck(selectedCollectionCard)}>
                                    Adicionar ao deck
                                </Button>
                                <Button
                                    danger
                                    type="primary"
                                    block
                                    loading={sellCardMutation.isPending}
                                    onClick={() => void handleSellSelectedCard()}
                                >
                                    Vender carta
                                </Button>
                            </div>
                        </Space>
                    ) : null}
                </Modal>
            </Space>
        </PlayerShell>
    );
}
