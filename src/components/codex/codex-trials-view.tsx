"use client";

import { useState, useEffect } from "react";
import { Card, Divider, Space, Typography, Button, message } from "antd";
import type { PackCard } from "@/components/codex/types";
import { PlayerShell } from "@/components/player/player-shell";
import styles from "./codex-trials-view.module.css";
import PackModal from "@/components/codex/pack-modal/pack-modal";
import CodexHeader from "./header/header";
import CodexRules from "./rules/rules";
import CodexTrialsService from "@/lib/api/services/codex-trials.service";
import LeagueRewards from "./rewards/league-rewards";
import DeckSelection from "./deck-selection/deck-selection";
import FormatSelection from "./format-selection/format-selection";
import { BattleFormat, LeagueRuntime, CodexTrialsViewProps, LeagueSpec } from "./codex-trials-view.interface";
import { LEAGUES, FORMAT_OPTIONS } from "./codex-trials-view.constants";

const { Title, Paragraph } = Typography;

function getLeagueRuntime(leagueId: number, currentLeagueId: number, currentLeaguePercent: number): LeagueRuntime {
  if (leagueId < currentLeagueId) {
    return {
      isActive: false,
      status: "completed",
      label: "Concluída",
      percent: 100,
    };
  }

  if (leagueId === currentLeagueId) {
    return {
      isActive: true,
      status: "active",
      label: "Ativa",
      percent: Math.max(0, Math.min(100, currentLeaguePercent)),
    };
  }

  return {
    isActive: false,
    status: "locked",
    label: "Bloqueada",
    percent: 0,
  };
}

function getLeagueThemeClass(leagueId: number): string {
  const themeMap: Record<number, string> = {
    1: styles.themeBronze,
    2: styles.themeSilver,
    3: styles.themeGold,
    4: styles.themePlatinum,
    5: styles.themeDiamond,
    6: styles.themeEmerald,
    7: styles.themeLegend,
  };

  return themeMap[leagueId] ?? styles.themeBronze;
}

export function CodexTrialsView({
  userName,
  userNickName,
  userImageUrl,
  userRole,
  coins,
  diamonds,
}: CodexTrialsViewProps) {
  const currentLeagueId = 2;
  const currentLeagueProgressPercent = 24;
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<LeagueSpec | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<BattleFormat | null>(null);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [packCards, setPackCards] = useState<PackCard[]>([]);
  const [claimedPacks, setClaimedPacks] = useState<Record<string, boolean>>({});
  const [packRarity, setPackRarity] = useState<string | null>(null);
  const [packImage, setPackImage] = useState<string | null>(null);
  const [packLeagueSlug, setPackLeagueSlug] = useState<string | null>(null);

  const handleStartLeague = (league: LeagueSpec) => {
    setSelectedLeague(league);
    setSelectedFormat(null);
    setIsDeckModalOpen(false);
    setIsFormatModalOpen(true);
  };

  // prefetch pack metadata to determine which leagues are already claimed
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const claimedLeagues = await CodexTrialsService.getClaimedLeagues();
        if (!mounted) return;
        const map: Record<string, boolean> = {};
        for (const league of LEAGUES) {
          const slug = league.imgSymbol ? league.imgSymbol.replace(/\.png$/i, '') : league.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          map[slug] = (claimedLeagues?.claimed ?? []).includes(slug);
        }
        setClaimedPacks(map);
      } catch (e) {
        // ignore errors
        // eslint-disable-next-line no-console
        console.error('Erro ao pré-checar packs:', e);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleSelectFormat = (format: BattleFormat) => {
    setSelectedFormat(format);
    setIsFormatModalOpen(false);
    setIsDeckModalOpen(true);
  };

  const handleOpenPack = async (league: LeagueSpec) => {
    try {
      // decide a liga/slug and request claim from service; cards will be fetched on pack click
      const slug = league.imgSymbol ? league.imgSymbol.replace(/\.png$/i, '') : league.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setPackLeagueSlug(slug);

      try {
        // claim the pack permanently for this user/league
        await CodexTrialsService.claimPack(slug);
        // mark locally immediately so button disables
        setClaimedPacks((value) => ({ ...value, [slug]: true }));
      } catch (e: any) {
        // if already claimed, mark locally and notify
        if (e && typeof e === 'object' && 'status' in e && (e as any).status === 409) {
          setClaimedPacks((value) => ({ ...value, [slug]: true }));
          message.info('Pacote já resgatado para esta liga.');
          return;
        }
        throw e;
      }

      // fetch metadata after successful claim
      const data = await CodexTrialsService.getPackMetadata(slug);
      setPackCards([]);
      setPackRarity(data.packRarity || null);
      setPackImage(data.packImage || null);
      setIsPackModalOpen(true);
    } catch (err) {
      console.error(err);
      setPackCards([]);
      setIsPackModalOpen(false);
    }
  };

  return (
    <PlayerShell
      selectedKey="codex-trials"
      userName={userName}
      userNickName={userNickName}
      userImageUrl={userImageUrl}
      userRole={userRole}
      coins={coins}
      diamonds={diamonds}
    >
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <CodexHeader />

        <CodexRules />

        <Divider style={{ margin: 0 }} />

        <Card className={`${styles.sectionCard} ${styles.flowCard}`}>
          <Space orientation="vertical" size={12} style={{ width: "100%" }}>
            <Title level={4} style={{ margin: 0 }}>Rota de Ascensão</Title>
            <Paragraph style={{ margin: 0 }}>
              As ligas seguem uma trilha progressiva. Vença as fases, enfrente o chefão e avance para o próximo nível.
            </Paragraph>
            <div className={styles.flowTrack}>
              {LEAGUES.map((league, index) => (
                (() => {
                  const leagueRuntime = getLeagueRuntime(league.id, currentLeagueId, currentLeagueProgressPercent);

                  return (
                    <div
                      key={league.name}
                      className={`${styles.flowStepItem} ${index % 2 === 0 ? styles.flowLeft : styles.flowRight} ${getLeagueThemeClass(league.id)}`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className={styles.flowNode}>
                        <img
                          src={`/assets/ligas/symbols/${league.imgSymbol}`}
                          alt={`${league.name} symbol`}
                          className={styles.flowNodeSymbol}
                        />
                      </div>
                      <Card className={styles.leagueCard}>
                        <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                          <div className={styles.leagueTop}>
                            <div className={styles.leagueHeaderRow} />
                            <Title level={4} style={{ margin: 0 }}>{league.name}</Title>
                            <div className={styles.energyBar} aria-hidden>
                              <div className={styles.energyFill} style={{ width: `${leagueRuntime.percent}%` }} />
                            </div>

                            <div className={styles.bossBlock}>
                              <img
                                src={`/assets/ligas/boss/${league.imgBoss}`}
                                alt={`${league.boss} avatar`}
                                className={styles.bossAvatarSmall}
                              />
                              <div className={styles.bossCaption}>{league.boss}</div>
                            </div>

                            <div className={styles.leagueHUD}>
                              {leagueRuntime.percent > 0 && (
                                <div className={styles.powerPill}>Power <strong>{Math.round(leagueRuntime.percent)}</strong></div>
                              )}
                            </div>

                          </div>

                          <div className={styles.deckPreview}>
                            <div className={styles.deckPreviewImage}>
                              /assets/codex-trials/decks/{league.name.toLowerCase().replace(/\s+/g, "-")}.png
                            </div>
                          </div>

                          <LeagueRewards rewards={league.rewardHighlights} />

                          {(() => {
                            const slug = league.imgSymbol ? league.imgSymbol.replace(/\.png$/i, '') : league.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            if (leagueRuntime.status === 'completed') {
                              const disabled = !!claimedPacks[slug];
                              return (
                                <Button block type="primary" className={styles.openPackButton} onClick={() => handleOpenPack(league)} disabled={disabled}>
                                  {disabled ? 'Pacote resgatado' : 'Abrir pacote de 3 cartas'}
                                </Button>
                              );
                            }

                            return (
                              <Button block disabled={!leagueRuntime.isActive} onClick={() => handleStartLeague(league)}>
                                {leagueRuntime.isActive ? `Jogar ${league.name}` : "Liga indisponível"}
                              </Button>
                            );
                          })()}

                        </Space>
                      </Card>
                    </div>
                  );
                })()
              ))}
            </div>
          </Space>
        </Card>

        <PackModal
          open={isPackModalOpen}
          packCards={packCards}
          packImage={packImage}
          packRarity={packRarity}
          league={packLeagueSlug}
          onCancel={() => { setIsPackModalOpen(false); setPackCards([]); setPackRarity(null); setPackImage(null); setPackLeagueSlug(null); }}
          onPick={() => {
            if (packLeagueSlug) {
              setClaimedPacks((s) => ({ ...s, [packLeagueSlug]: true }));
            }

            setIsPackModalOpen(false);
            setPackCards([]);
            setPackRarity(null);
            setPackImage(null);
            setPackLeagueSlug(null);
          }}
        />

        <FormatSelection
          open={isFormatModalOpen}
          onCancel={() => setIsFormatModalOpen(false)}
          selectedLeague={selectedLeague}
          formats={FORMAT_OPTIONS}
          onSelectFormat={handleSelectFormat}
        />

        <DeckSelection
          open={isDeckModalOpen}
          onCancel={() => setIsDeckModalOpen(false)}
          league={selectedLeague}
          format={selectedFormat}
        />
      </Space>
    </PlayerShell>
  );
}
