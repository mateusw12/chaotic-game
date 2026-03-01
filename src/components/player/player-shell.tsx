"use client";

import { BellOutlined, DollarCircleOutlined, LogoutOutlined, ProfileOutlined, SettingOutlined, ShopOutlined, HomeOutlined, StarOutlined, TrophyOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Space, Typography, message } from "antd";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChallengeActionResponseDto, ChallengeDto, GetChallengesResponseDto } from "@/dto/challenge";
import { useDisplayUserName } from "@/hooks/use-display-user-name";
import { ChallengesModal } from "@/components/player/challenges-modal/challenges-modal";
import styles from "./player-shell.module.css";

type PlayerShellProps = {
  selectedKey: "home" | "decks" | "store" | "codex-trials" | "tournaments";
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
  coins: number;
  diamonds: number;
  userRole: "user" | "admin";
  level?: number;
  children: React.ReactNode;
};

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

export function PlayerShell({
  selectedKey,
  userName,
  userNickName,
  userImageUrl,
  coins,
  diamonds,
  userRole,
  level,
  children,
}: PlayerShellProps) {
  const displayUserName = useDisplayUserName({ name: userName, nickName: userNickName });
  const [apiMessage, messageContextHolder] = message.useMessage();
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [displayDiamonds, setDisplayDiamonds] = useState(diamonds);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isChallengesLoading, setIsChallengesLoading] = useState(false);
  const [actionChallengeId, setActionChallengeId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [challenges, setChallenges] = useState<ChallengeDto[]>([]);
  const [challengeToConfirm, setChallengeToConfirm] = useState<ChallengeDto | null>(null);

  const items = useMemo(() => {
    const baseItems = [
      {
        key: "home",
        icon: <HomeOutlined />,
        label: <Link href="/">Início</Link>,
      },
      {
        key: "decks",
        icon: <AppstoreOutlined />,
        label: <Link href="/decks">Decks</Link>,
      },
      {
        key: "store",
        icon: <ShopOutlined />,
        label: <Link href="/store">Loja</Link>,
      },
      {
        key: "codex-trials",
        icon: <TrophyOutlined />,
        label: <Link href="/codex-trials">Codex Trials</Link>,
      },
      {
        key: "tournaments",
        icon: <TrophyOutlined />,
        label: <Link href="/tournaments">Torneios</Link>,
      },
    ];

    if (userRole === "admin") {
      baseItems.push({
        key: "settings",
        icon: <SettingOutlined />,
        label: <Link href="/admin/permissions">Configurações</Link>,
      });
    }

    return baseItems;
  }, [userRole]);

  const profileMenuItems = useMemo(() => ([
    {
      key: "profile",
      icon: <ProfileOutlined />,
      label: <Link href="/profile">Editar perfil</Link>,
    },
  ]), []);

  useEffect(() => {
    setDisplayCoins(coins);
  }, [coins]);

  useEffect(() => {
    setDisplayDiamonds(diamonds);
  }, [diamonds]);

  const loadChallenges = useCallback(async () => {
    setIsChallengesLoading(true);

    try {
      const response = await fetch("/api/challenges", {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json() as GetChallengesResponseDto;

      if (!response.ok || !payload.success || !payload.overview) {
        throw new Error(payload.message ?? "Não foi possível carregar os desafios.");
      }

      setChallenges(payload.overview.challenges);
      setPendingCount(payload.overview.pendingCount);
    } catch (error) {
      apiMessage.error(error instanceof Error ? error.message : "Erro ao carregar desafios.");
    } finally {
      setIsChallengesLoading(false);
    }
  }, [apiMessage]);

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  const handleOpenChallenges = useCallback(() => {
    setIsChallengesOpen(true);
    void loadChallenges();
  }, [loadChallenges]);

  const handleDeclineChallenge = useCallback(async (challengeId: string) => {
    setActionChallengeId(challengeId);

    try {
      const response = await fetch(`/api/challenges/${challengeId}/decline`, {
        method: "POST",
      });

      const payload = await response.json() as ChallengeActionResponseDto;

      if (!response.ok || !payload.success || !payload.challenge) {
        throw new Error(payload.message ?? "Não foi possível recusar o desafio.");
      }

      if (payload.wallet) {
        setDisplayCoins(payload.wallet.coins);
        setDisplayDiamonds(payload.wallet.diamonds);
      }

      apiMessage.success(payload.message ?? "Desafio recusado.");
      await loadChallenges();
    } catch (error) {
      apiMessage.error(error instanceof Error ? error.message : "Erro ao recusar desafio.");
    } finally {
      setActionChallengeId(null);
    }
  }, [apiMessage, loadChallenges]);

  const handleConfirmAcceptChallenge = useCallback(async () => {
    if (!challengeToConfirm) {
      return;
    }

    setActionChallengeId(challengeToConfirm.id);

    try {
      const response = await fetch(`/api/challenges/${challengeToConfirm.id}/accept`, {
        method: "POST",
      });

      const payload = await response.json() as ChallengeActionResponseDto;

      if (!response.ok || !payload.success || !payload.challenge) {
        throw new Error(payload.message ?? "Não foi possível iniciar o desafio.");
      }

      if (payload.wallet) {
        setDisplayCoins(payload.wallet.coins);
        setDisplayDiamonds(payload.wallet.diamonds);
      }

      if (payload.challenge.status === "won" && payload.awardedCards.length > 0) {
        apiMessage.success({
          content: "Você venceu! Recompensas recebidas no seu inventário.",
          duration: 5,
        });
      } else {
        apiMessage.info(payload.message ?? "Desafio concluído.");
      }

      setChallengeToConfirm(null);
      await loadChallenges();
    } catch (error) {
      apiMessage.error(error instanceof Error ? error.message : "Erro ao aceitar desafio.");
    } finally {
      setActionChallengeId(null);
    }
  }, [apiMessage, challengeToConfirm, loadChallenges]);

  return (
    <Layout className={styles.layout}>
      {messageContextHolder}
      <Sider width={180} breakpoint="lg" collapsedWidth={0} className={styles.sider}>
        <div className={styles.brand}>Chaotic Game</div>
        <Menu
          className={styles.navMenu}
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          style={{ background: "transparent", borderInlineEnd: 0 }}
        />
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <Space className={styles.headerRow} size={12} align="center" wrap>
            <div className={`${styles.resourceTag} ${styles.resourceCoins}`}>
              <DollarCircleOutlined />
              <span className={styles.resourceValue}>{displayCoins}</span>
              <span className={styles.resourceLabel}>moedas</span>
            </div>
            <div className={`${styles.resourceTag} ${styles.resourceDiamonds}`}>
              <StarOutlined />
              <span className={styles.resourceValue}>{displayDiamonds}</span>
              <span className={styles.resourceLabel}>diamantes</span>
            </div>
            {typeof level === "number" ? (
              <div className={`${styles.resourceTag} ${styles.levelTag}`}>
                <div className={styles.levelNumber}>Nível {level}</div>
              </div>
            ) : null}
            <Button
              className={styles.headerButton}
              icon={(
                <Badge count={pendingCount} size="small" overflowCount={99}>
                  <BellOutlined />
                </Badge>
              )}
              onClick={handleOpenChallenges}
            >
              <Space size={6} align="center">
                <span>Desafios</span>
              </Space>
            </Button>
            <Dropdown menu={{ items: profileMenuItems }} trigger={["click"]}>
              <button type="button" className={styles.profileTrigger}>
                <Avatar src={userImageUrl ?? undefined}>
                  {displayUserName.charAt(0).toUpperCase()}
                </Avatar>
                <Text className={styles.userName}>{displayUserName}</Text>
              </button>
            </Dropdown>
            <Button className={styles.headerButton} icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: "/" })}>
              Sair
            </Button>
          </Space>
        </Header>

        <Content className={styles.content}>{children}</Content>

        <ChallengesModal
          open={isChallengesOpen}
          loading={isChallengesLoading}
          challenges={challenges}
          actionChallengeId={actionChallengeId}
          challengeToConfirm={challengeToConfirm}
          onClose={() => setIsChallengesOpen(false)}
          onAccept={setChallengeToConfirm}
          onDecline={(challengeId) => {
            void handleDeclineChallenge(challengeId);
          }}
          onCancelConfirm={() => setChallengeToConfirm(null)}
          onConfirmAccept={() => {
            void handleConfirmAcceptChallenge();
          }}
        />
      </Layout>
    </Layout>
  );
}
