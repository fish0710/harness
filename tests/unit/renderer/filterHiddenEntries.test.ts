/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IDirOrFile } from '@/common/adapter/ipcBridge';
import { describe, expect, it } from 'vitest';

import { filterHiddenEntries } from '@/renderer/pages/conversation/Workspace/utils/treeHelpers';

const node = (name: string, children?: IDirOrFile[]): IDirOrFile => ({
  name,
  fullPath: `/abs/${name}`,
  relativePath: name,
  isDir: !children,
  isFile: false,
  children,
});

describe('filterHiddenEntries', () => {
  it('removes top-level dotfile entries', () => {
    const input = [node('.claude'), node('src'), node('.gitignore')];
    const out = filterHiddenEntries(input);
    expect(out.map((n) => n.name)).toEqual(['src']);
  });

  it('keeps non-dotfile children inside a kept directory', () => {
    const input = [node('src', [node('index.ts'), node('.DS_Store')])];
    const out = filterHiddenEntries(input);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('src');
    expect(out[0].children?.map((c) => c.name)).toEqual(['index.ts']);
  });

  it('removes a hidden directory and all its descendants', () => {
    const input = [node('.git', [node('HEAD'), node('objects', [node('pack')])])];
    const out = filterHiddenEntries(input);
    expect(out).toEqual([]);
  });

  it('preserves a directory with no children field', () => {
    const input = [node('README.md')];
    const out = filterHiddenEntries(input);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('README.md');
    expect(out[0].children).toBeUndefined();
  });

  it('treats a missing name as non-hidden (does not throw)', () => {
    const broken = { ...node('ok'), name: undefined as unknown as string };
    const out = filterHiddenEntries([broken, node('.secret')]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBeUndefined();
  });

  it('returns a new array (does not mutate input)', () => {
    const child = node('index.ts');
    const input = [node('src', [child])];
    const out = filterHiddenEntries(input);
    expect(out).not.toBe(input);
    expect(input[0].children).toBeDefined();
    expect(input[0].children).toContain(child);
  });
});
