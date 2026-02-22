"use client";

import { Typography } from "antd";
import styles from "../codex-trials-view.module.css";

const { Text } = Typography;

type LeagueRewardsProps = {
  rewards: string[];
};

export default function LeagueRewards({ rewards }: LeagueRewardsProps) {
  return (
    <div className={styles.rewardPanel}>
      <div className={styles.rewardHeader}>
        <Text className={styles.rewardTitle}>Recompensas da Liga</Text>
      </div>
      <div className={styles.rewardGrid}>
        {rewards.map((reward) => {
          const imgSlug = reward.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return (
            <div key={reward} className={styles.rewardItem}>
              <div className={styles.rewardImage}>
                <img
                  src={`/assets/codex-trials/rewards/${imgSlug}.png`}
                  alt={reward}
                  className={styles.rewardImg}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.12'; }}
                />
              </div>
              <div className={styles.rewardTextWrap}>
                <Text className={styles.rewardItemText}>{reward}</Text>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
