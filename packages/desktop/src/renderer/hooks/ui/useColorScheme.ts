/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// hooks/useColorScheme.ts - Color Scheme Management Hook
import { configService } from '@/common/config/configService';
import { useCallback, useEffect, useState } from 'react';

// Harness mode — only 'harness' scheme is supported
export type ColorScheme = 'harness';

const DEFAULT_COLOR_SCHEME: ColorScheme = 'harness';
const COLOR_SCHEME_CACHE_KEY = '__aionui_colorScheme';

/** Harness brand CSS variable values — used to override Arco's !important inline CSS. */
const HARNESS_VARS: Record<string, string> = {
  '--brand': '#78ff65',
  '--brand-light': 'rgba(120, 255, 101, 0.08)',
  '--brand-hover': 'rgba(120, 255, 101, 0.16)',
  '--bg-base': '#050505',
  '--bg-hover': '#181818',
  '--bg-active': '#222222',
  '--text-primary': '#f5f5f5',
  '--color-text-1': '#f5f5f5',
  '--primary': '#78ff65',
  '--primary-rgb': '120, 255, 101',
  '--color-primary': '#78ff65',
};

/**
 * Apply harness CSS variables as inline styles on :root.
 * Uses `setProperty` with `'important'` priority — inline !important
 * beats stylesheet !important regardless of injection order, so Arco's
 * dynamic inline CSS cannot override it.
 */
const injectHarnessVars = () => {
  Object.entries(HARNESS_VARS).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val, 'important');
  });
};

const applyColorSchemeToDom = (value: ColorScheme) => {
  document.documentElement.setAttribute('data-color-scheme', value);
  // Force-apply harness CSS vars to beat Arco's dynamic !important inline CSS.
  // Inline !important always wins, but Arco may inject AFTER this call, so
  // we re-apply at staggered intervals to reclaim priority.
  injectHarnessVars();
  setTimeout(injectHarnessVars, 10);
  setTimeout(injectHarnessVars, 100);
  setTimeout(injectHarnessVars, 500);
};

const readCachedColorScheme = (): ColorScheme => {
  try {
    const cached = localStorage.getItem(COLOR_SCHEME_CACHE_KEY);
    if (cached === 'harness') return cached;
  } catch (_e) {
    /* noop */
  }
  return DEFAULT_COLOR_SCHEME;
};

/**
 * Apply localStorage hint synchronously to avoid FOUC, then resolve to the
 * authoritative value from configService once it has loaded from the backend.
 */
const initColorScheme = async (): Promise<ColorScheme> => {
  const hint = readCachedColorScheme();
  applyColorSchemeToDom(hint);
  try {
    await configService.whenReady();
    const scheme = (configService.get('colorScheme') as ColorScheme) || hint;
    applyColorSchemeToDom(scheme);
    try {
      localStorage.setItem(COLOR_SCHEME_CACHE_KEY, scheme);
    } catch (_e) {
      /* noop */
    }
    return scheme;
  } catch (error) {
    console.error('Failed to load initial color scheme:', error);
    return hint;
  }
};

// Run color scheme initialization immediately
let initialColorSchemePromise: Promise<ColorScheme> | null = null;
if (typeof window !== 'undefined') {
  initialColorSchemePromise = initColorScheme();
}

/**
 * Color scheme management hook.
 * Always returns 'harness' — the platform only supports one scheme.
 */
const useColorScheme = (): [ColorScheme, (scheme: ColorScheme) => Promise<void>] => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(DEFAULT_COLOR_SCHEME);

  const applyColorScheme = useCallback((newScheme: ColorScheme) => {
    applyColorSchemeToDom(newScheme);
    try {
      localStorage.setItem(COLOR_SCHEME_CACHE_KEY, newScheme);
    } catch (_e) {
      /* noop */
    }
  }, []);

  const setColorScheme = useCallback(
    async (newScheme: ColorScheme) => {
      try {
        setColorSchemeState(newScheme);
        applyColorScheme(newScheme);
        await configService.set('colorScheme', newScheme);
      } catch (error) {
        console.error('Failed to save color scheme:', error);
        setColorSchemeState(colorScheme);
        applyColorScheme(colorScheme);
      }
    },
    [colorScheme, applyColorScheme]
  );

  useEffect(() => {
    if (initialColorSchemePromise) {
      initialColorSchemePromise
        .then((initialScheme) => {
          setColorSchemeState(initialScheme);
        })
        .catch((error) => {
          console.error('Failed to initialize color scheme:', error);
        });
    }
  }, []);

  return [colorScheme, setColorScheme];
};

export default useColorScheme;
