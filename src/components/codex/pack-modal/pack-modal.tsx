"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, message } from "antd";
import { DecksService } from "@/lib/api/services/decks.service";
import CodexTrialsService from "@/lib/api/services/codex-trials.service";
import styles from "./pack-modal.module.css";
import type { PackCard } from "../types";
import { CardRarity } from "@/dto/creature/creature.dto";

type PackModalProps = {
  open: boolean;
  packCards: PackCard[];
  packImage?: string | null;
  packRarity?: string | null;
  league?: string | null;
  onCancel: () => void;
  onPick: (card: PackCard) => void;
};

export default function PackModal({ open, packCards, packImage, packRarity, league, onCancel, onPick }: PackModalProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [revealedAll, setRevealedAll] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);
  const [displayCards, setDisplayCards] = useState<PackCard[]>(packCards || []);
  const [bonusLocation, setBonusLocation] = useState<{ id: string; name: string } | null>(null);
  const [bonusMugic, setBonusMugic] = useState<{ id: string; name: string } | null>(null);
  const [chosenPackIndex, setChosenPackIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<"choose-pack" | "choose-card">("choose-pack");
  const hasChosenCardRef = useRef(false);

  // reset internal state when modal opens or pack changes
  useEffect(() => {
    setIsPicking(false);
    setRevealedAll(false);
    setSelectedIndex(null);
    setCloseCountdown(null);
    setDisplayCards(packCards || []);
    setChosenPackIndex(null);
    setPhase("choose-pack");
    hasChosenCardRef.current = false;
  }, [open, packCards]);

  // user selects a pack; reveal cards but do not allow further selection
  const handlePackFrontClick = async (i: number) => {
    if (isPicking || phase !== "choose-pack") return;
    setChosenPackIndex(i);

    try {
      const data = await CodexTrialsService.getPackCards(league ?? undefined);
      const cards = data?.cards || [];
      setDisplayCards(cards);
      setBonusLocation(data?.bonusLocation ?? null);
      setBonusMugic(data?.bonusMugic ?? null);
      // reveal card options
      setRevealedAll(true);
      setPhase("choose-card");

      const chosenCard = cards[i];
      if (!chosenCard) {
        message.error("Erro ao selecionar carta do pacote.");
        setChosenPackIndex(null);
        setRevealedAll(false);
        setPhase("choose-pack");
        return;
      }

      await handleSelectCard(chosenCard as PackCard, i);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      message.error('Erro ao abrir o pacote.');
      // reset choice so user can try again
      setChosenPackIndex(null);
    }
  };

  // after reveal, user selects one of the revealed cards; selection is final
  const handleSelectCard = async (card: PackCard, i: number) => {
    if (hasChosenCardRef.current || isPicking || selectedIndex !== null) return;
    hasChosenCardRef.current = true;
    setIsPicking(true);
    setSelectedIndex(i);
    // small delay so the UI highlights selection
    await new Promise((r) => setTimeout(r, 500));

    try {
      // use DecksService which calls the new /users/decks/award route
      await DecksService.awardCardToDeck({ cardType: "creature", cardId: card.id, rarity: card.rarity as CardRarity, quantity: 1 });
      // award bonus location if present
      if (bonusLocation) {
        try {
          await DecksService.awardCardToDeck({ cardType: "location", cardId: bonusLocation.id, rarity: 'comum', quantity: 1 });
          message.info(`Local recebido: ${bonusLocation.name}`);
        } catch (e) {
          console.error('Erro ao conceder location bonus', e);
        }
      }
      // award bonus mugic if present
      if (bonusMugic) {
        try {
          await DecksService.awardCardToDeck({ cardType: "mugic", cardId: bonusMugic.id, rarity: 'comum', quantity: 1 });
          message.info(`Mugic recebido: ${bonusMugic.name}`);
        } catch (e) {
          console.error('Erro ao conceder mugic bonus', e);
        }
      }
      message.success("Carta enviada ao seu deck.");
      // keep reveal on screen before closing/resetting
      setCloseCountdown(3);
      await new Promise((r) => setTimeout(r, 1000));
      setCloseCountdown(2);
      await new Promise((r) => setTimeout(r, 1000));
      setCloseCountdown(1);
      await new Promise((r) => setTimeout(r, 1000));
      // notify parent with the awarded card so it can update local collection/deck
      onPick(card);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : "Erro ao conceder carta.");
      setIsPicking(false);
    }
  };

  return (
    <Modal
      title={packRarity ? `Pacote · ${packRarity.replace("_", " ")}` : "Pacote: escolha 1 de 3"}
      open={open}
      onCancel={() => { if (!isPicking) onCancel(); }}
      footer={null}
    >
      <div className={styles.packModal}>
        <div className={styles.packHeader}>
          <div className={styles.packSubtitle}>
            {phase === "choose-pack" ? "Escolha um pacote" : "Escolha 1 carta"}
          </div>
          {closeCountdown !== null && (
            <div className={styles.packSubtitle}>Fechando em {closeCountdown}s...</div>
          )}
        </div>

        <div className={styles.packGrid}>
          {phase === "choose-pack" ? (
            // show three pack fronts for the user to choose one
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`pack-${i}`}
                className={`${styles.packTile} ${chosenPackIndex === i ? styles.packSelected : ''}`}
                onClick={() => handlePackFrontClick(i)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.packTileInner}>
                  <div className={styles.packFront}>
                    <img src={packImage || '/assets/codex-trials/bonus/rare.png'} alt={`pack ${i + 1}`} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.22'; }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            // user chose a pack; show the 3 card options for that pack
            (displayCards.length > 0 ? displayCards : [null, null, null]).map((card, idx) => (
              <div
                key={card?.id ?? `option-${idx}`}
                className={`${styles.packTile} ${selectedIndex === idx || (selectedIndex === null && chosenPackIndex === idx) ? styles.packSelected : ''} ${revealedAll ? styles.revealed : ''}`}
                role="button"
                tabIndex={0}
              >
                <div className={styles.packTileInner}>
                  <div className={styles.packBack}>
                    <img
                      src={(card as PackCard)?.imageUrl || '/assets/card/verso.png'}
                      alt={(card as PackCard)?.name || 'Carta'}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/card/verso.png'; }}
                    />
                  </div>
                </div>
                {revealedAll && <div className={styles.packCardName}>{(card as PackCard)?.name}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
