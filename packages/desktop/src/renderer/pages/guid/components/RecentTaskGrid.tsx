import type { TChatConversation } from '@/common/config/storage';
import { useConversationHistoryContext } from '@/renderer/hooks/context/ConversationHistoryContext';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RecentTaskCard from './RecentTaskCard';
import styles from './RecentTaskGrid.module.css';

const RECENT_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
const PAGE_SIZE = 12;

interface RecentTaskGridProps {
  expanded: boolean;
  onToggle: () => void;
  onTaskDetail: (id: string) => void;
  onTaskStop: (id: string) => void;
}

const RecentTaskGrid: React.FC<RecentTaskGridProps> = ({ expanded, onToggle, onTaskDetail, onTaskStop }) => {
  const { t } = useTranslation();
  const { conversations, isConversationGenerating } = useConversationHistoryContext();
  const [page, setPage] = useState(0);

  // Collect all running + completed conversations (no time limit)
  const sorted = useMemo(() => {
    const running: TChatConversation[] = [];
    const completed: TChatConversation[] = [];

    for (const conv of conversations) {
      if (isConversationGenerating(conv.id)) {
        running.push(conv);
      } else {
        completed.push(conv);
      }
    }

    completed.sort((a, b) => (b.modified_at ?? 0) - (a.modified_at ?? 0));
    return [...running, ...completed];
  }, [conversations, isConversationGenerating]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  // Reset to the first page when the list shrinks below the current page,
  // so the user doesn't get stranded on an empty page after tasks disappear.
  useEffect(() => {
    setPage((prev) => (prev >= totalPages ? 0 : prev));
  }, [totalPages]);
  const pageItems = useMemo(() => sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE), [sorted, safePage]);

  const hasPrev = safePage > 0;
  const hasNext = safePage < totalPages - 1;

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
        <div className={styles.gridWrapper}>
          {totalPages > 1 && (
            <button
              className={`${styles.navBtn} ${styles.navPrev} ${hasPrev ? styles.navActive : styles.navDisabled}`}
              onClick={() => hasPrev && setPage(safePage - 1)}
              disabled={!hasPrev}
              aria-label='Previous page'
            >
              ‹
            </button>
          )}
          <div className={styles.grid}>
            {pageItems.map((conv) => (
              <RecentTaskCard
                key={conv.id}
                conversation={conv}
                isRunning={isConversationGenerating(conv.id)}
                onDetail={() => onTaskDetail(conv.id)}
                onStop={() => onTaskStop(conv.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <button
              className={`${styles.navBtn} ${styles.navNext} ${hasNext ? styles.navActive : styles.navDisabled}`}
              onClick={() => hasNext && setPage(safePage + 1)}
              disabled={!hasNext}
              aria-label='Next page'
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentTaskGrid;
