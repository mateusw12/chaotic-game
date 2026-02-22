"use client";

import { Card, Col, Row, Space, Typography } from "antd";
import styles from "../codex-trials-view.module.css";

const { Title, Paragraph } = Typography;

export default function CodexHeader() {
  return (
    <Card className={`${styles.sectionCard} ${styles.heroCard}`}>
      <Space orientation="vertical" size={10} style={{ width: "100%" }}>
        <div className={styles.heroHeader}>
          <div className={styles.heroCrest} aria-hidden />
          <div>
            <Title level={3} className={styles.heroTitle} style={{ margin: 0 }}>Codex Trials</Title>
            <Paragraph className={styles.heroText}>
              Evolua de Bronze até Lendária enfrentando IAs cada vez mais estratégicas. Enfrente desafios únicos em cada liga, derrote chefões e conquiste recompensas épicas.
            </Paragraph>
          </div>
        </div>

        <Row gutter={[10, 10]}>
          <Col xs={24} md={8}>
            <div className={styles.flowStep}>
              <div className={styles.stepIcon}>⚔️</div>
              <div className={styles.stepText}><strong>1.</strong> Vença batalhas de fase contra IA</div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className={styles.flowStep}>
              <div className={styles.stepIcon}>🏆</div>
              <div className={styles.stepText}><strong>2.</strong> Derrote o chefão da liga</div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className={styles.flowStep}>
              <div className={styles.stepIcon}>🚀</div>
              <div className={styles.stepText}><strong>3.</strong> Suba de liga e ganhe recompensas</div>
            </div>
          </Col>
        </Row>
      </Space>
    </Card>
  );
}

