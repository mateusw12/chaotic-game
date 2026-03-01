"use client";

import { Card, Button, Tag, notification } from "antd";
import styles from "@/app/page.module.css";

const MOCK_MISSIONS = [
  { id: "m1", title: "Vencer 1 partida", reward: "100 moedas" },
  { id: "m2", title: "Abrir 1 pack", reward: "5 diamantes" },
  { id: "m3", title: "Concluir 3 desafios", reward: "300 XP" },
];

export default function DailyMissions() {
  const claim = (m: any) => {
    notification.success({ message: `Missão '${m.title}' concluída! Recompensa: ${m.reward}` });
  };

  return (
    <Card className={styles.missionsCard} title="Missões Diárias">
      <div>
        {MOCK_MISSIONS.map((m) => (
          <div key={m.id} className={styles.missionItem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className={styles.missionTitle}>{m.title}</div>
              <div className={styles.missionReward}><Tag color="gold">{m.reward}</Tag></div>
            </div>
            <div>
              <Button key="claim" type="primary" size="small" onClick={() => claim(m)}>Reivindicar</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
