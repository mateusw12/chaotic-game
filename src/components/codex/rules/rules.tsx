"use client";

import { Card, Space, Typography } from "antd";
import styles from "../codex-trials-view.module.css";

const { Title, Text } = Typography;

export default function CodexRules() {
  return (
    <Card className={`${styles.sectionCard} ${styles.rulesCard}`}>
      <Space orientation="vertical" size={8} style={{ width: "100%" }}>
        <div className={styles.rulesHeader}>
          <div className={styles.rulesCrest}>
            <img
              src="/assets/codex-trials/rules/featured.png"
              alt="Ilustração Regras"
              className={styles.rulesCrestImg}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.18'; }}
            />
          </div>
          <div>
            <Title level={4} className={styles.rulesTitle} style={{ margin: 0 }}>Regras & Progressão</Title>
            <Text className={styles.rulesSubtitle}>Guia rápido: subir de liga, ganhar estrelas e desbloquear prêmios exclusivos.</Text>
          </div>
        </div>

        <div className={styles.rulesList}>
          <div className={styles.ruleItem}>
            <div className={styles.ruleIcon}>⚔️</div>
            <div className={styles.ruleText}><strong>Vença fases:</strong> Complete as batalhas da liga para desbloquear o chefão e avançar.</div>
          </div>

          <div className={styles.ruleItem}>
            <div className={styles.ruleIcon}>★</div>
            <div className={styles.ruleText}><strong>Sistema de estrelas:</strong> 3★ (&gt;80%) = vitória impecável e recompensa máxima.</div>
          </div>

          <div className={styles.ruleItem}>
            <div className={styles.ruleIcon}>🛡️</div>
            <div className={styles.ruleText}><strong>Consistência:</strong> Boas sequências aumentam multiplicadores e bônus de progresso.</div>
          </div>

          <div className={styles.ruleItem}>
            <div className={styles.ruleIcon}>🎯</div>
            <div className={styles.ruleText}><strong>Modos & Recompensas:</strong> Cada formato oferece faixas de recompensa (1x1 moedas → 7x7 prêmios raros/promo).</div>
          </div>

          <div className={styles.ruleItem}>
            <div className={styles.ruleIcon}>🏆</div>
            <div className={styles.ruleText}><strong>Chefões:</strong> Derrote-os para prêmios exclusivos — cartas promo, ultra raras e bônus de track.</div>
          </div>
        </div>
      </Space>
    </Card>
  );
}
