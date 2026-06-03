import { useEffect, useRef } from 'react';

type UsePreviewAutoCollapseParams = {
  isPreviewOpen: boolean;
  isDesktop: boolean;
  workspaceEnabled: boolean;
  rightSiderCollapsed: boolean;
  setRightSiderCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * Auto-collapses workspace panel when preview opens,
 * restoring its previous state when preview closes.
 */
export function usePreviewAutoCollapse({
  isPreviewOpen,
  isDesktop,
  workspaceEnabled,
  rightSiderCollapsed,
  setRightSiderCollapsed,
}: UsePreviewAutoCollapseParams): void {
  const previousWorkspaceCollapsedRef = useRef<boolean | null>(null);
  const previousPreviewOpenRef = useRef(false);

  useEffect(() => {
    if (!workspaceEnabled) {
      previousPreviewOpenRef.current = false;
      return;
    }

    if (isPreviewOpen && !previousPreviewOpenRef.current) {
      if (previousWorkspaceCollapsedRef.current === null) {
        previousWorkspaceCollapsedRef.current = rightSiderCollapsed;
      }
      setRightSiderCollapsed(true);
    } else if (!isPreviewOpen && previousPreviewOpenRef.current) {
      if (previousWorkspaceCollapsedRef.current !== null) {
        setRightSiderCollapsed(previousWorkspaceCollapsedRef.current);
        previousWorkspaceCollapsedRef.current = null;
      }
    }

    previousPreviewOpenRef.current = isPreviewOpen;
  }, [isPreviewOpen, isDesktop, rightSiderCollapsed, workspaceEnabled, setRightSiderCollapsed]);
}
