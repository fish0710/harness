import React from 'react';
import styles from './HarnessTopBar.module.css';

interface HarnessTopBarProps {
  /** Number of currently active (generating) conversations */
  activeCount: number;
}

const HarnessTopBar: React.FC<HarnessTopBarProps> = ({ activeCount }) => {
  const hasActive = activeCount > 0;

  return (
    <div className={styles.topbar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>&gt;</div>
        <span>Harness Agent</span>
      </div>

      <div className={styles.right}>
        <div className={styles.status}>
          <span className={`${styles.dot} ${hasActive ? styles.dotActive : ''}`} />
          <span>{hasActive ? `${activeCount} 运行中` : '空闲'}</span>
        </div>
      </div>
    </div>
  );
};

export default HarnessTopBar;
