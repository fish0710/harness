import { useMemo } from 'react';
import { useConversationHistoryContext } from '@/renderer/hooks/context/ConversationHistoryContext';
import { buildVisibleConversationIds } from '../utils/visibleConversationOrder';
import { useWorkspaceExpansionState } from './useWorkspaceExpansionState';

export const useVisibleConversationIds = (): string[] => {
  const { groupedHistory } = useConversationHistoryContext();
  const expandedWorkspaces = useWorkspaceExpansionState();

  return useMemo(() => {
    return buildVisibleConversationIds({
      ...groupedHistory,
      expandedWorkspaces,
      siderCollapsed: true, // sidebar removed, always collapsed
    });
  }, [groupedHistory, expandedWorkspaces]);
};
