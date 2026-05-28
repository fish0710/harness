import type { TChatConversation } from '@/common/config/storage';
import React from 'react';
import styles from './RecentTaskCard.module.css';

interface RecentTaskCardProps {
  conversation: TChatConversation;
  isRunning: boolean;
  onDetail: () => void;
  onStop: () => void;
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const RecentTaskCard: React.FC<RecentTaskCardProps> = ({ conversation, isRunning, onDetail, onStop }) => {
  const title = conversation.name || conversation.id.slice(0, 8);
  const timeAgo = isRunning ? '' : formatTimeAgo(conversation.modified_at ?? conversation.created_at);

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.left}>
          <div className={styles.icon}>&gt;</div>
          <div className={styles.meta}>
            <div className={styles.title}>{title}</div>
            <div className={`${styles.status} ${isRunning ? styles.running : styles.completed}`}>
              <span className={`${styles.statusDot} ${isRunning ? styles.runningDot : styles.completedDot}`} />
              {isRunning ? 'running' : 'completed'}
              {timeAgo && <span className={styles.timeAgo}>· {timeAgo}</span>}
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={onDetail} title='View details'>
            i
          </button>
          {isRunning && (
            <button className={styles.iconBtn} onClick={onStop} title='Stop'>
              ■
            </button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className={styles.progress}>
          <div className={styles.progressBar} />
        </div>
      )}
    </div>
  );
};

export default RecentTaskCard;
