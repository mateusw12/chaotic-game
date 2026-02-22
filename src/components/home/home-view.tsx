"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  notification,
  Modal,
  Tooltip,
} from "antd";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import styles from "@/app/page.module.css";
import StarterModal from "@/components/home/starter-modal/starter-modal";
import { PlayerShell } from "@/components/player/player-shell";
import HeroHeader from "@/components/home/hero-header/hero-header";
import { LoadingLogo } from "@/components/shared/loading-logo/loading-logo";
import { CREATURE_TRIBE_OPTIONS } from "@/dto/creature";
import type {
  StarterSelectableTribe,
} from "@/dto/progression";
import { isValidStarterSelectableTribe } from "@/dto/progression";
import { StarterProgressionService } from "@/lib/api/service";

type HomeViewProps = {
  isAuthenticated: boolean;
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
  userRole: "user" | "admin";
  coins: number;
  diamonds: number;
  level: number;
  xpTotal: number;
  xpCurrentLevel: number;
  xpNextLevel: number;
};

const { Title, Paragraph, Text } = Typography;

const STARTER_TRIBE_SYMBOLS: Record<StarterSelectableTribe, string> = {
  overworld: "/assets/symbols/overWorld.png",
  underworld: "/assets/symbols/underWorld.png",
  mipedian: "/assets/symbols/mipedian.png",
  danian: "/assets/symbols/danian.png",
};

export function HomeView({
  isAuthenticated,
  userName,
  userNickName,
  userImageUrl,
  userRole,
  coins,
  diamonds,
  level,
  xpTotal,
  xpCurrentLevel,
  xpNextLevel,
}: HomeViewProps) {
  const [loadingStarterStatus, setLoadingStarterStatus] = useState(false);
  const [requiresStarterChoice, setRequiresStarterChoice] = useState(false);
  const [starterSelection, setStarterSelection] = useState<StarterSelectableTribe | null>(null);
  const [lockedStarterTribe, setLockedStarterTribe] = useState<StarterSelectableTribe | null>(null);
  const [submittingStarterChoice, setSubmittingStarterChoice] = useState(false);

  const starterTribes = useMemo(() => CREATURE_TRIBE_OPTIONS
    .filter((option): option is typeof option & { value: StarterSelectableTribe } => isValidStarterSelectableTribe(option.value)), []);

  const loadStarterStatus = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoadingStarterStatus(true);

    try {
      const payload = await StarterProgressionService.getStarterStatus();

      setRequiresStarterChoice(payload.requiresChoice);

      const selectedStarterTribe = payload.selectedTribe && isValidStarterSelectableTribe(payload.selectedTribe)
        ? payload.selectedTribe
        : null;

      setLockedStarterTribe(selectedStarterTribe);
      setStarterSelection(selectedStarterTribe);

      if (!payload.requiresChoice) {
        setStarterSelection(null);
        setLockedStarterTribe(null);
      }
    } catch {
      notification.error({ message: "Falha ao consultar status da escolha inicial de tribo." });
    } finally {
      setLoadingStarterStatus(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadStarterStatus();
  }, [loadStarterStatus]);

  const handleConfirmStarterTribe = useCallback(async () => {
    if (!starterSelection) {
      notification.warning({ message: "Selecione uma tribo para continuar." });
      return;
    }

    setSubmittingStarterChoice(true);

    try {
      await StarterProgressionService.chooseStarterTribe(starterSelection);

      notification.success({ message: "Tribo inicial definida e pacotes adicionados ao seu deck." });
      setRequiresStarterChoice(false);
      window.location.reload();
    } catch {
      notification.error({ message: "Falha ao definir tribo inicial." });
    } finally {
      setSubmittingStarterChoice(false);
    }
  }, [starterSelection]);

  const xpPercent = xpNextLevel > 0
    ? Math.min(100, Math.round((xpCurrentLevel / xpNextLevel) * 100))
    : 0;



  // animated values for coins, diamonds and xp percent
  // start from 0 so we animate on first mount
  const [animCoins, setAnimCoins] = useState<number>(0);
  const [animDiamonds, setAnimDiamonds] = useState<number>(0);
  const [animXpPercent, setAnimXpPercent] = useState<number>(0);
  const [coinsUpdating, setCoinsUpdating] = useState(false);
  const [diamondsUpdating, setDiamondsUpdating] = useState(false);
  const [xpUpdating, setXpUpdating] = useState(false);

  const coinRaf = useRef<number | null>(null);
  const diamondsRaf = useRef<number | null>(null);
  const xpRaf = useRef<number | null>(null);

  const animateValue = (
    from: number,
    to: number,
    setter: (v: number) => void,
    rafRef: React.MutableRefObject<number | null>,
    duration = 700,
  ) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setter(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setter(to);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  };

  useEffect(() => {
    setCoinsUpdating(true);
    const cancel = animateValue(animCoins, coins, setAnimCoins, coinRaf);
    const t = setTimeout(() => setCoinsUpdating(false), 800);
    return () => { clearTimeout(t); if (cancel) cancel(); };
  }, [coins]);

  useEffect(() => {
    setDiamondsUpdating(true);
    const cancel = animateValue(animDiamonds, diamonds, setAnimDiamonds, diamondsRaf);
    const t = setTimeout(() => setDiamondsUpdating(false), 800);
    return () => { clearTimeout(t); if (cancel) cancel(); };
  }, [diamonds]);

  useEffect(() => {
    setXpUpdating(true);
    const cancel = animateValue(animXpPercent, xpPercent, setAnimXpPercent, xpRaf);
    const t = setTimeout(() => setXpUpdating(false), 700);
    return () => { clearTimeout(t); if (cancel) cancel(); };
  }, [xpPercent]);

  if (!isAuthenticated) {
    return (
      <main className={styles.guestPage}>
        <Card className={styles.guestCard}>
          <Space orientation="vertical" size={20}>
            <Tag color="purple">Chaotic World</Tag>
            <Title level={2} className={styles.guestTitle}>
              Bem-vindo ao Chaotic Game
            </Title>
            <Paragraph className={styles.guestText}>
              Entre com sua conta Google para acessar sua base de jogador e
              começar sua jornada no mundo caótico.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<GoogleOutlined />}
              onClick={() => signIn("google", { callbackUrl: "/" })}
              block
            >
              Entrar com Google
            </Button>
          </Space>
        </Card>
      </main>
    );
  }

  return (
    <PlayerShell
      selectedKey="home"
      userName={userName}
      userNickName={userNickName}
      userImageUrl={userImageUrl}
      coins={coins}
      diamonds={diamonds}
      userRole={userRole}
    >
      {loadingStarterStatus ? (
        <Card className={styles.heroCard}>
          <Space>
            <LoadingLogo />
            <Text>Carregando configuração inicial...</Text>
          </Space>
        </Card>
      ) : null}

      {requiresStarterChoice ? (
        <StarterModal
          open={requiresStarterChoice}
          starterTribes={starterTribes}
          starterSelection={starterSelection}
          setStarterSelection={(v) => setStarterSelection(v)}
          lockedStarterTribe={lockedStarterTribe}
          submittingStarterChoice={submittingStarterChoice}
          handleConfirmStarterTribe={handleConfirmStarterTribe}
        />
      ) : null}

      {!requiresStarterChoice ? (
        <Card className={styles.heroCard}>
          <HeroHeader userRole={userRole} />

          <div className={styles.dashboardIntro}>
            <Text className={styles.introTitle}>Sua conta está ativa e pronta para explorar o jogo.</Text>
            <Text className={styles.introSubtitle}>Use moedas e diamantes para construir decks, comprar pacotes e melhorar cartas.</Text>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.resourceCard}>
              <div className={styles.resourceIcon}>🪙</div>
              <div>
                <div className={styles.resourceLabel}>Moedas</div>
                <div className={`${styles.resourceValue} ${coinsUpdating ? styles.resourceValueUpdating : ""}`}>{animCoins.toLocaleString()}</div>
              </div>
            </div>

            <div className={styles.resourceCard}>
              <div className={styles.resourceIcon}>💎</div>
              <div>
                <div className={styles.resourceLabel}>Diamantes</div>
                <div className={`${styles.resourceValue} ${diamondsUpdating ? styles.resourceValueUpdating : ""}`}>{animDiamonds.toLocaleString()}</div>
              </div>
            </div>

            <div className={styles.levelCard}>
              <div className={styles.levelHeader}>
                <div className={styles.levelNumber}>Nível {level}</div>
                <div className={styles.levelXpTotal}>(XP total: {xpTotal})</div>
              </div>
              <div className={styles.xpInfo}>
                <div className={styles.xpText}>XP no nível atual: {xpCurrentLevel}/{xpNextLevel}</div>
                <div className={styles.xpBarWrap}>
                  <div className={styles.xpBar} style={{ width: `${animXpPercent}%` }} />
                </div>
              </div>
              <div className={styles.xpPercent}>{Math.round(animXpPercent)}%</div>
            </div>
          </div>
        </Card>
      ) : null}
    </PlayerShell>
  );
}
