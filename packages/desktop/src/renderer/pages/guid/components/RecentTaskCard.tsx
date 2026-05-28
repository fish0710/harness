import type { TChatConversation } from '@/common/config/storage';
import { Robot } from '@icon-park/react';
import React, { useState } from 'react';
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
  const [collapsed, setCollapsed] = useState(false);

  const title = conversation.name || conversation.id.slice(0, 8);
  const timeAgo = isRunning ? '' : formatTimeAgo(conversation.modified_at ?? conversation.created_at);

  // Extract agent info from backend field (ACP conversations) or type field
  const backend =
    (conversation.extra && 'backend' in conversation.extra && (conversation.extra as { backend?: string }).backend) ||
    conversation.type ||
    'claude';

  return (
    <div className={`${styles.card} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.top}>
        <div className={styles.left}>
          <div className={styles.icon}>
            {conversation.type === 'acp' ? (
              <img
                src={`/api/assets/logos/ai-major/${backend}.svg`}
                alt=''
                className={styles.iconImg}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.textContent = '</>';
                }}
              />
            ) : (
              <Robot theme='outline' size={22} fill='currentColor' />
            )}
          </div>
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
          <button
            className={styles.iconBtn}
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '⌃' : '⌄'}
          </button>
        </div>
      </div>

      {/* Running cards get logs + progress */}
      {isRunning && (
        <>
          <div className={styles.logs}>
            <div className={styles.logLine}>
              <span className={styles.logTime}>running</span>
              <span>v1.0.0</span>
              <span className={styles.logOk}>✓</span>
            </div>
            <div className={styles.logLine}>
              <span className={styles.logTime}>streaming</span>
              <span>...</span>
            </div>
          </div>
          <div className={styles.progress}>
            <div className={styles.progressBar} />
          </div>
        </>
      )}
    </div>
  );
};

export default RecentTaskCard;
