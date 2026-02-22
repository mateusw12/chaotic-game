"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DeleteOutlined } from "@ant-design/icons";
import {
  App as AntdApp,
  Button,
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
import { CARD_RARITY_OPTIONS, type CardRarity, type CreatureTribe } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";
import { StoreService } from "@/lib/api/services/store.service";
import { PlayerShell } from "@/components/player/player-shell";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { DecksService } from "@/lib/api/service";
import styles from "./decks-view.module.css";
import { DecksViewProps, DeckFilters } from "./decks-view.interface";
import RepeatedCardsGrid from "./repeated-cards-grid/repeated-cards-grid";
import CollectionCardsGrid from "./collection-cards-grid/collection-cards-grid";
import CollectionFilters from "./collection-filters/collection-filters";
import DeckManager from "./deck-manager/deck-manager";
import ActionCardModal from "./action-card-modal/action-card-modal";
import ViewDeckModal from "./view-deck-modal/view-deck-modal";
import { CARD_TYPE_OPTIONS, EMPTY_VIEWED_GROUPS } from "./decks-view.constants";

const { Title, Text } = Typography;

export function DecksView({
  userName,
  userNickName,
  userImageUrl,
  userRole,
  coins,
  diamonds,
}: DecksViewProps) {
  const { notification } = AntdApp.useApp();
  const [currentCoins, setCurrentCoins] = useState(coins);
  const [currentDiamonds, setCurrentDiamonds] = useState(diamonds);
  const [filters, setFilters] = useState<DeckFilters>({ name: "" });
  const [newDeckName, setNewDeckName] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [viewDeckId, setViewDeckId] = useState<string | null>(null);
  const [deckCardTypeFilter, setDeckCardTypeFilter] = useState<UserCardType | undefined>(undefined);
  const [selectedCollectionCard, setSelectedCollectionCard] = useState<DeckCollectionCardDto | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [pendingDeckActionKey, setPendingDeckActionKey] = useState<string | null>(null);

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
      notification.success({ message: "Deck criado com sucesso." });
    },
    onError: (error) => {
      notification.error({ message: error instanceof Error ? error.message : "Erro ao criar deck." });
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: ({ deckId, payload }: { deckId: string; payload: { name?: string; cards?: DeckDto["cards"] } }) =>
      DecksService.updateDeck(deckId, payload),
    onSuccess: async () => {
      await query.refetch();
    },
    onError: (error) => {
      if (error instanceof Error && error.message.toLowerCase().includes("deck não encontrado")) {
        void query.refetch().then((result) => {
          const nextDecks = result.data?.decks ?? [];
          setSelectedDeckId(nextDecks[0]?.id ?? null);
        });
      }

      notification.error({ message: error instanceof Error ? error.message : "Erro ao atualizar deck." });
    },
  });

  const removeDeckMutation = useMutation({
    mutationFn: (deckId: string) => DecksService.removeDeck(deckId),
    onSuccess: async () => {
      setSelectedDeckId(null);
      setViewDeckId(null);
      await query.refetch();
      notification.success({ message: "Deck removido." });
    },
    onError: (error) => {
      notification.error({ message: error instanceof Error ? error.message : "Erro ao remover deck." });
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
      notification.success({ message: `Carta vendida: +${response.coinsEarned} moedas.` });
    },
    onError: (error) => {
      notification.error({ message: error instanceof Error ? error.message : "Erro ao vender carta." });
    },
  });

  const overview = query.data;
  const decks = overview?.decks ?? [];
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? decks[0] ?? null;
  const viewedDeck = decks.find((deck) => deck.id === viewDeckId) ?? null;

  useEffect(() => {
    if (decks.length === 0) {
      if (selectedDeckId !== null) {
        setSelectedDeckId(null);
      }
      return;
    }

    if (!selectedDeckId || !decks.some((deck) => deck.id === selectedDeckId)) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks, selectedDeckId]);

  const collection = overview?.collection ?? [];
  const collectionByKey = useMemo(
    () => new Map(collection.map((card) => [`${card.cardType}:${card.cardId}`, card] as const)),
    [collection],
  );

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
    const activeDeck = selectedDeckId
      ? decks.find((deck) => deck.id === selectedDeckId) ?? decks[0] ?? null
      : decks[0] ?? null;

    if (!activeDeck) {
      notification.warning({ message: "Crie ou selecione um deck primeiro." });
      return;
    }

    const key = `${card.cardType}:${card.cardId}`;
    const activeDeckCardMap = new Map(activeDeck.cards.map((entry) => [`${entry.cardType}:${entry.cardId}`, entry.quantity]));
    const currentQuantity = activeDeckCardMap.get(key) ?? 0;

    if (currentQuantity > 0) {
      notification.warning({ message: "Essa carta já está no deck. Apenas 1 cópia por carta é permitida." });
      return;
    }

    const nextCards = [
      ...(activeDeck.cards.filter((entry) => `${entry.cardType}:${entry.cardId}` !== key)),
      {
        cardType: card.cardType,
        cardId: card.cardId,
        quantity: 1,
      },
    ];

    setPendingDeckActionKey(key);
    try {
      await updateDeckMutation.mutateAsync({
        deckId: activeDeck.id,
        payload: { cards: nextCards },
      });
    } finally {
      setPendingDeckActionKey(null);
    }
  };

  const handleChangeDeckCardQuantity = async (cardKey: string, quantity: number) => {
    const activeDeck = selectedDeckId
      ? decks.find((deck) => deck.id === selectedDeckId) ?? decks[0] ?? null
      : decks[0] ?? null;

    if (!activeDeck) {
      return;
    }

    const [cardType, cardId] = cardKey.split(":");
    const normalizedQuantity = Math.max(0, Math.trunc(quantity));

    const baseCards = activeDeck.cards.filter((entry) => `${entry.cardType}:${entry.cardId}` !== cardKey);
    const nextCards = normalizedQuantity > 0
      ? [...baseCards, { cardType: cardType as DeckDto["cards"][number]["cardType"], cardId, quantity: normalizedQuantity }]
      : baseCards;

    setPendingDeckActionKey(cardKey);
    try {
      await updateDeckMutation.mutateAsync({
        deckId: activeDeck.id,
        payload: { cards: nextCards },
      });
    } finally {
      setPendingDeckActionKey(null);
    }
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

  const isCardDeckActionPending = (cardType: UserCardType, cardId: string) =>
    updateDeckMutation.isPending && pendingDeckActionKey === `${cardType}:${cardId}`;

  const loadingLogoIcon = <LoadingLogo />;

  const cardDeckNamesMap = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const deck of decks) {
      for (const entry of deck.cards) {
        const key = `${entry.cardType}:${entry.cardId}`;
        const list = map.get(key) ?? [];
        if (!list.includes(deck.name)) {
          list.push(deck.name);
        }
        map.set(key, list);
      }
    }

    return map;
  }, [decks]);

  const selectedCardDeckNames = selectedCollectionCard
    ? (cardDeckNamesMap.get(`${selectedCollectionCard.cardType}:${selectedCollectionCard.cardId}`) ?? [])
    : [];

  const collectionTabs = useMemo(
    () => [
      {
        key: "all",
        label: "Coleção",
        children: (
          <CollectionCardsGrid
            cards={filteredCollection}
            tribeClass={tribeClass}
            cardDeckNamesMap={cardDeckNamesMap}
            onCardClick={handleCardClick}
            onAddCard={handleAddCardToDeck}
            isCardDeckActionPending={isCardDeckActionPending}
            updatePending={updateDeckMutation.isPending}
            loadingLogoIcon={loadingLogoIcon}
          />
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
          <RepeatedCardsGrid
            cards={repeatedCards}
            tribeClass={tribeClass}
            cardDeckNamesMap={cardDeckNamesMap}
            onCardClick={handleCardClick}
            onAddCard={handleAddCardToDeck}
            isCardDeckActionPending={isCardDeckActionPending}
            updatePending={updateDeckMutation.isPending}
            loadingLogoIcon={loadingLogoIcon}
          />
        ),
      },
    ],
    [
      cardDeckNamesMap,
      filteredCollection,
      handleAddCardToDeck,
      handleCardClick,
      isCardDeckActionPending,
      repeatedCards,
      repeatedCardsCount,
      repeatedTotalQuantity,
      updateDeckMutation.isPending,
    ],
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
          <CollectionFilters filters={filters} setFilters={setFilters} collectionTabs={collectionTabs} />

          <DeckManager
            newDeckName={newDeckName}
            setNewDeckName={setNewDeckName}
            createDeckMutation={createDeckMutation}
            loadingLogoIcon={loadingLogoIcon}
            notification={notification}
            decks={decks}
            selectedDeck={selectedDeck}
            setSelectedDeckId={setSelectedDeckId}
            setViewDeckId={setViewDeckId}
            removeDeckMutation={removeDeckMutation}
            deckCardTypeFilter={deckCardTypeFilter}
            setDeckCardTypeFilter={setDeckCardTypeFilter}
            selectedDeckCards={selectedDeckCards}
            collectionByKey={collectionByKey}
            updateDeckMutation={updateDeckMutation}
            handleChangeDeckCardQuantity={handleChangeDeckCardQuantity}
            isCardDeckActionPending={isCardDeckActionPending}
          />
        </div>

        <ViewDeckModal
          open={Boolean(viewedDeck)}
          viewedDeck={viewedDeck}
          onClose={() => setViewDeckId(null)}
          modalNameFilter={modalNameFilter}
          setModalNameFilter={setModalNameFilter}
          modalRarityFilter={modalRarityFilter}
          setModalRarityFilter={setModalRarityFilter}
          modalEnergyFilter={modalEnergyFilter}
          setModalEnergyFilter={setModalEnergyFilter}
          viewedDeckCardsByType={viewedDeckCardsByType}
          tribeClass={tribeClass}
          handleChangeDeckCardQuantity={handleChangeDeckCardQuantity}
          isCardDeckActionPending={isCardDeckActionPending}
          updatePending={updateDeckMutation.isPending}
          loadingLogoIcon={loadingLogoIcon}
        />

        <ActionCardModal
          open={Boolean(selectedCollectionCard)}
          selectedCollectionCard={selectedCollectionCard}
          onClose={() => { setSelectedCollectionCard(null); setSellQuantity(1); }}
          selectedCardDeckNames={selectedCardDeckNames}
          selectedSellUnitValue={selectedSellUnitValue}
          selectedSellTotal={selectedSellTotal}
          sellQuantity={sellQuantity}
          setSellQuantity={setSellQuantity}
          isCardDeckActionPending={isCardDeckActionPending}
          loadingLogoIcon={loadingLogoIcon}
          updatePending={updateDeckMutation.isPending}
          handleAddCardToDeck={handleAddCardToDeck}
          sellPending={sellCardMutation.isPending}
          handleSellSelectedCard={handleSellSelectedCard}
        />
      </Space>
    </PlayerShell>
  );
}
