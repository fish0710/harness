import type { TChatConversation } from '@/common/config/storage';
import { useConversationHistoryContext } from '@/renderer/hooks/context/ConversationHistoryContext';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import RecentTaskCard from './RecentTaskCard';
import styles from './RecentTaskGrid.module.css';

const RECENT_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_CARDS = 12;

interface RecentTaskGridProps {
  expanded: boolean;
  onToggle: () => void;
  onTaskDetail: (id: string) => void;
  onTaskStop: (id: string) => void;
}

const RecentTaskGrid: React.FC<RecentTaskGridProps> = ({ expanded, onToggle, onTaskDetail, onTaskStop }) => {
  const { t } = useTranslation();
  const { conversations, isConversationGenerating } = useConversationHistoryContext();

  // Collect running + recently-completed conversations
  const sorted = useMemo(() => {
    const now = Date.now();
    const running: TChatConversation[] = [];
    const completed: TChatConversation[] = [];

    for (const conv of conversations) {
      if (running.length + completed.length >= MAX_CARDS) break;

      if (isConversationGenerating(conv.id)) {
        running.push(conv);
      } else {
        const modifiedAt = conv.modified_at;
        if (modifiedAt && now - modifiedAt < RECENT_WINDOW_MS) {
          completed.push(conv);
        }
      }
    }

    completed.sort((a, b) => (b.modified_at ?? 0) - (a.modified_at ?? 0));
    return [...running, ...completed];
  }, [conversations, isConversationGenerating]);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>
          {t('harness.task.recentTasks')} <span className={styles.count}>{sorted.length}</span>
        </span>
        <button className={styles.toggleBtn} onClick={onToggle}>
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      {expanded && sorted.length === 0 && (
        <div className={styles.grid}>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>&gt;_</div>
            <div>{t('harness.task.empty')}</div>
          </div>
        </div>
      )}

      {expanded && sorted.length > 0 && (
        <div className={styles.grid}>
          {sorted.map((conv) => (
            <RecentTaskCard
              key={conv.id}
              conversation={conv}
              isRunning={isConversationGenerating(conv.id)}
              onDetail={() => onTaskDetail(conv.id)}
              onStop={() => onTaskStop(conv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTaskGrid;
