/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import { IconMoonFill } from '@arco-design/web-react/icon';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Theme indicator — always dark (Harness mode only).
 * Kept as a passive indicator rather than a switch.
 */
export const ThemeSwitcher = () => {
  const { theme } = useThemeContext();
  const { t } = useTranslation();

  return (
    <div
      className='inline-flex items-center gap-8px p-6px rd-full border border-solid border-[var(--color-border-2)] bg-1'
      role='radio'
      aria-checked={theme === 'dark'}
    >
      <span className='inline-flex items-center justify-center gap-6px px-10px h-33px rd-full text-13px font-500'>
        <IconMoonFill style={{ fontSize: 14, color: 'var(--color-text-2)' }} />
        {t('settings.darkMode')}
      </span>
    </div>
  );
};
