/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { PreviewProvider, usePreviewContext } from '@/renderer/pages/conversation/Preview/context/PreviewContext';

vi.mock('@/common', () => ({
  ipcBridge: {
    fileStream: {
      contentUpdate: { on: vi.fn(() => vi.fn()) },
    },
    preview: {
      open: { on: vi.fn(() => vi.fn()) },
    },
    fs: {
      writeFile: { invoke: vi.fn() },
      getFileMetadata: { invoke: vi.fn() },
      readFile: { invoke: vi.fn() },
      getImageBase64: { invoke: vi.fn() },
    },
  },
}));

vi.mock('@/renderer/utils/emitter', () => ({
  emitter: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en' },
  }),
}));

describe('PreviewContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <PreviewProvider>{children}</PreviewProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes with open panel by default', () => {
    const { result } = renderHook(() => usePreviewContext(), { wrapper });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTabId).toBe(null);
  });

  it('opens preview and creates tab', () => {
    const { result } = renderHook(() => usePreviewContext(), { wrapper });
    act(() => {
      result.current.openPreview('# Hello', 'markdown', { title: 'test.md' });
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].content).toBe('# Hello');
    expect(result.current.tabs[0].content_type).toBe('markdown');
  });

  it('closes preview and clears all tabs', () => {
    const { result } = renderHook(() => usePreviewContext(), { wrapper });
    act(() => {
      result.current.openPreview('content', 'code');
    });
    act(() => {
      result.current.closePreview();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.tabs).toEqual([]);
  });

  it('provides all context API methods', () => {
    const { result } = renderHook(() => usePreviewContext(), { wrapper });
    expect(typeof result.current.openPreview).toBe('function');
    expect(typeof result.current.closePreview).toBe('function');
    expect(typeof result.current.updateContent).toBe('function');
    expect(typeof result.current.findPreviewTab).toBe('function');
  });

  it('updates content and marks tab as dirty', () => {
    const { result } = renderHook(() => usePreviewContext(), { wrapper });
    act(() => {
      result.current.openPreview('original', 'code');
    });
    expect(result.current.activeTab?.isDirty).toBe(false);
    act(() => {
      result.current.updateContent('modified');
    });
    expect(result.current.activeTab?.content).toBe('modified');
    expect(result.current.activeTab?.isDirty).toBe(true);
  });

  it('scopes tabs to the active conversation', () => {
    const { result } = renderHook(() => usePreviewContext(), { wrapper });

    // Activate conversation A and open a tab in it.
    act(() => {
      result.current.setActiveConversationId('conv-a');
    });
    act(() => {
      result.current.openPreview('<html>conv-a</html>', 'html', { title: 'a.html' });
    });
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].metadata?.title).toBe('a.html');

    // Switch to conversation B — should see no tabs, defaults restored.
    act(() => {
      result.current.setActiveConversationId('conv-b');
    });
    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTabId).toBe(null);
    expect(result.current.isOpen).toBe(true);

    // Open a different tab in conversation B.
    act(() => {
      result.current.openPreview('<html>conv-b</html>', 'html', { title: 'b.html' });
    });
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].metadata?.title).toBe('b.html');

    // Switch back to A — should restore A's snapshot, not see B's tab.
    act(() => {
      result.current.setActiveConversationId('conv-a');
    });
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].metadata?.title).toBe('a.html');
    expect(result.current.activeTabId).toBe(result.current.tabs[0].id);
  });

  it('clears visible state when deactivated (id passed as null)', () => {
    const { result } = renderHook(() => usePreviewContext(), { wrapper });
    act(() => {
      result.current.setActiveConversationId('conv-x');
    });
    act(() => {
      result.current.openPreview('payload', 'markdown', { title: 'x.md' });
    });
    expect(result.current.tabs).toHaveLength(1);

    act(() => {
      result.current.setActiveConversationId(null);
    });
    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTabId).toBe(null);
    expect(result.current.isOpen).toBe(true);

    // Returning to the same conversation restores its snapshot.
    act(() => {
      result.current.setActiveConversationId('conv-x');
    });
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].metadata?.title).toBe('x.md');
  });
});
