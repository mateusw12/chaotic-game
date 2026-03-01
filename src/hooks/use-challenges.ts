"use client";

import { message } from "antd";
import { useCallback, useEffect, useState } from "react";
import type { ChallengeActionResponseDto, ChallengeDto, GetChallengesResponseDto } from "@/dto/challenge";

type UseChallengesParams = {
  coins: number;
  diamonds: number;
};

export function useChallenges({ coins, diamonds }: UseChallengesParams) {
  const [apiMessage, messageContextHolder] = message.useMessage();
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [displayDiamonds, setDisplayDiamonds] = useState(diamonds);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isChallengesLoading, setIsChallengesLoading] = useState(false);
  const [actionChallengeId, setActionChallengeId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [challenges, setChallenges] = useState<ChallengeDto[]>([]);
  const [challengeToConfirm, setChallengeToConfirm] = useState<ChallengeDto | null>(null);

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

  const handleCloseChallenges = useCallback(() => {
    setIsChallengesOpen(false);
  }, []);

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

  return {
    messageContextHolder,
    displayCoins,
    displayDiamonds,
    pendingCount,
    isChallengesOpen,
    isChallengesLoading,
    actionChallengeId,
    challenges,
    challengeToConfirm,
    setChallengeToConfirm,
    handleOpenChallenges,
    handleCloseChallenges,
    handleDeclineChallenge,
    handleConfirmAcceptChallenge,
  };
}
