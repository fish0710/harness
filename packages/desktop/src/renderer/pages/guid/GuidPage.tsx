/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { resolveLocaleKey } from '@/common/utils';

import { useConversationHistoryContext } from '@/renderer/hooks/context/ConversationHistoryContext';
import { useInputFocusRing } from '@/renderer/hooks/chat/useInputFocusRing';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { CUSTOM_AVATAR_IMAGE_MAP } from './constants';
import GuidActionRow from './components/GuidActionRow';
import GuidInputCard from './components/GuidInputCard';
import HarnessInputSection from './components/HarnessInputSection';
import HarnessTopBar from './components/HarnessTopBar';
import RecentTaskGrid from './components/RecentTaskGrid';
import MentionDropdown, { MentionSelectorBadge } from './components/MentionDropdown';
import FeedbackReportModal from '@/renderer/components/settings/SettingsModal/contents/FeedbackReportModal';
import { useGuidAgentSelection } from './hooks/useGuidAgentSelection';
import { useGuidInput } from './hooks/useGuidInput';
import { useGuidMention } from './hooks/useGuidMention';
import { useGuidModelSelection } from './hooks/useGuidModelSelection';
import { useGuidSend } from './hooks/useGuidSend';
import { useTypewriterPlaceholder } from './hooks/useTypewriterPlaceholder';
import { Button, ConfigProvider, Dropdown, Menu, Message } from '@arco-design/web-react';
import { Down, Left, Robot, Write } from '@icon-park/react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { mutate as swrMutate } from 'swr';
import type { Assistant } from '@/common/types/agent/assistantTypes';
import styles from './index.module.css';

const TASK_GRID_EXPANDED_KEY = 'aionui_guid_task_grid_expanded';

const loadPersistedTaskGridExpanded = (): boolean => {
  try {
    const stored = localStorage.getItem(TASK_GRID_EXPANDED_KEY);
    if (stored === null) return false;
    return stored === 'true';
  } catch {
    return false;
  }
};

const GuidPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const guidContainerRef = useRef<HTMLDivElement>(null);
  const openAssistantDetailsRef = useRef<(() => void) | null>(null);
  const descriptionTextRef = useRef<HTMLDivElement>(null);
  const { activeBorderColor, inactiveBorderColor, activeShadow } = useInputFocusRing();
  const convCtx = useConversationHistoryContext();
  const activeCount = useMemo(
    () => convCtx.conversations.filter((c) => convCtx.isConversationGenerating(c.id)).length,
    [convCtx.conversations, convCtx.isConversationGenerating]
  );

  const localeKey = resolveLocaleKey(i18n.language);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Task grid expand/collapse — persisted to localStorage so the user's
  // expand/collapse choice survives a page refresh.
  const [taskGridExpanded, setTaskGridExpanded] = useState<boolean>(loadPersistedTaskGridExpanded);
  useEffect(() => {
    try {
      localStorage.setItem(TASK_GRID_EXPANDED_KEY, String(taskGridExpanded));
    } catch {
      // Ignore quota / disabled-storage errors
    }
  }, [taskGridExpanded]);

  // --- Skills state ---
  const [allSkills, setAllSkills] = useState<Array<{ name: string; description: string; isAuto: boolean }>>([]);
  const [guidDisabledBuiltinSkills, setGuidDisabledBuiltinSkills] = useState<string[] | undefined>(undefined);
  const [guidEnabledSkills, setGuidEnabledSkills] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    Promise.all([ipcBridge.fs.listBuiltinAutoSkills.invoke(), ipcBridge.fs.listAvailableSkills.invoke()])
      .then(([autoSkills, availableSkills]) => {
        const autoNames = new Set(autoSkills.map((s) => s.name));
        const merged: Array<{ name: string; description: string; isAuto: boolean }> = [
          ...autoSkills.map((s) => ({ name: s.name, description: s.description, isAuto: true })),
          ...availableSkills
            .filter((s) => !autoNames.has(s.name))
            .map((s) => ({ name: s.name, description: s.description, isAuto: false })),
        ];
        setAllSkills(merged);
      })
      .catch(() => setAllSkills([]));
  }, []);

  const handleToggleSkill = useCallback((skillName: string, isAuto: boolean) => {
    if (isAuto) {
      setGuidDisabledBuiltinSkills((prev) => {
        const list = prev ?? [];
        return list.includes(skillName) ? list.filter((s) => s !== skillName) : [...list, skillName];
      });
    } else {
      setGuidEnabledSkills((prev) => {
        const list = prev ?? [];
        return list.includes(skillName) ? list.filter((s) => s !== skillName) : [...list, skillName];
      });
    }
  }, []);

  // --- Hooks ---
  const modelSelection = useGuidModelSelection('aionrs');

  const navState = location.state as { resetAssistant?: boolean; selectedAgentKey?: string } | null;
  const resetAssistantRequested = navState?.resetAssistant === true;
  const preselectAgentKey = navState?.selectedAgentKey;
  const agentSelection = useGuidAgentSelection({
    modelList: modelSelection.modelList,
    isGoogleAuth: modelSelection.isGoogleAuth,
    localeKey,
    resetAssistant: resetAssistantRequested,
    preselectAgentKey,
    locationKey: location.key,
  });

  const guidInput = useGuidInput({
    locationState: location.state as { workspace?: string } | null,
  });

  const mention = useGuidMention({
    availableAgents: agentSelection.availableAgents,
    customAgentAvatarMap: agentSelection.customAgentAvatarMap,
    selectedAgentKey: agentSelection.selectedAgentKey,
    setSelectedAgentKey: agentSelection.setSelectedAgentKey,
    setInput: guidInput.setInput,
    selectedAgentInfo: agentSelection.selectedAgentInfo,
  });

  const send = useGuidSend({
    input: guidInput.input,
    setInput: guidInput.setInput,
    files: guidInput.files,
    setFiles: guidInput.setFiles,
    dir: guidInput.dir,
    setDir: guidInput.setDir,
    setLoading: guidInput.setLoading,
    loading: guidInput.loading,

    selectedAgent: agentSelection.selectedAgent,
    selectedAgentKey: agentSelection.selectedAgentKey,
    selectedAgentInfo: agentSelection.selectedAgentInfo,
    is_presetAgent: agentSelection.is_presetAgent,
    selectedMode: agentSelection.selectedMode,
    selectedAcpModel: agentSelection.selectedAcpModel,
    currentAcpCachedModelInfo: agentSelection.currentAcpCachedModelInfo,
    current_model: modelSelection.current_model,

    findAgentByKey: agentSelection.findAgentByKey,
    getEffectiveAgentType: agentSelection.getEffectiveAgentType,
    resolvePresetRulesAndSkills: agentSelection.resolvePresetRulesAndSkills,
    resolveEnabledSkills: agentSelection.resolveEnabledSkills,
    resolveDisabledBuiltinSkills: agentSelection.resolveDisabledBuiltinSkills,
    guidDisabledBuiltinSkills,
    guidEnabledSkills,
    currentEffectiveAgentInfo: agentSelection.currentEffectiveAgentInfo,
    isGoogleAuth: modelSelection.isGoogleAuth,

    setMentionOpen: mention.setMentionOpen,
    setMentionQuery: mention.setMentionQuery,
    setMentionSelectorOpen: mention.setMentionSelectorOpen,
    setMentionActiveIndex: mention.setMentionActiveIndex,

    navigate,
    stayOnGuid: true,
    t,
  });

  // --- Coordinated handlers ---
  const handleInputChange = useCallback(
    (value: string) => {
      guidInput.setInput(value);
      const match = value.match(mention.mentionMatchRegex);
      if (match) {
        mention.setMentionQuery(match[1]);
        mention.setMentionOpen(false);
      } else {
        mention.setMentionQuery(null);
        mention.setMentionOpen(false);
      }
    },
    [mention.mentionMatchRegex, guidInput.setInput, mention.setMentionQuery, mention.setMentionOpen]
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (mention.mentionOpen || mention.mentionSelectorOpen) &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        event.preventDefault();
        if (mention.filteredMentionOptions.length === 0) return;
        mention.setMentionActiveIndex((prev) => {
          if (event.key === 'ArrowDown') {
            return (prev + 1) % mention.filteredMentionOptions.length;
          }
          return (prev - 1 + mention.filteredMentionOptions.length) % mention.filteredMentionOptions.length;
        });
        return;
      }
      if ((mention.mentionOpen || mention.mentionSelectorOpen) && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (mention.filteredMentionOptions.length > 0) {
          const query = mention.mentionQuery?.toLowerCase();
          const exactMatch = query
            ? mention.filteredMentionOptions.find(
                (option) => option.label.toLowerCase() === query || option.tokens.has(query)
              )
            : undefined;
          const selected =
            exactMatch ||
            mention.filteredMentionOptions[mention.mentionActiveIndex] ||
            mention.filteredMentionOptions[0];
          if (selected) {
            mention.selectMentionAgent(selected.key);
            return;
          }
        }
        mention.setMentionOpen(false);
        mention.setMentionQuery(null);
        mention.setMentionSelectorOpen(false);
        mention.setMentionActiveIndex(0);
        return;
      }
      if (mention.mentionOpen && (event.key === 'Backspace' || event.key === 'Delete') && !mention.mentionQuery) {
        mention.setMentionOpen(false);
        mention.setMentionQuery(null);
        mention.setMentionActiveIndex(0);
        return;
      }
      if (
        !mention.mentionOpen &&
        mention.mentionSelectorVisible &&
        !guidInput.input.trim() &&
        (event.key === 'Backspace' || event.key === 'Delete')
      ) {
        event.preventDefault();
        mention.setMentionSelectorVisible(false);
        mention.setMentionSelectorOpen(false);
        mention.setMentionActiveIndex(0);
        return;
      }
      if ((mention.mentionOpen || mention.mentionSelectorOpen) && event.key === 'Escape') {
        event.preventDefault();
        mention.setMentionOpen(false);
        mention.setMentionQuery(null);
        mention.setMentionSelectorOpen(false);
        mention.setMentionActiveIndex(0);
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!guidInput.input.trim()) return;
        setTaskGridExpanded(true);
        send.sendMessageHandler();
      }
    },
    [mention, guidInput.input, send, setTaskGridExpanded]
  );

  const handleSelectAgentFromPillBar = useCallback(
    (key: string) => {
      agentSelection.setSelectedAgentKey(key);
      mention.setMentionOpen(false);
      mention.setMentionQuery(null);
      mention.setMentionSelectorOpen(false);
      mention.setMentionActiveIndex(0);
    },
    [
      agentSelection.setSelectedAgentKey,
      mention.setMentionOpen,
      mention.setMentionQuery,
      mention.setMentionSelectorOpen,
      mention.setMentionActiveIndex,
    ]
  );

  // Typewriter placeholder
  const typewriterPlaceholder = useTypewriterPlaceholder(t('conversation.welcome.placeholder'));

  const selectedAssistantRecord = useMemo(() => {
    if (!agentSelection.is_presetAgent || !agentSelection.selectedAgentInfo?.custom_agent_id) return undefined;
    const selectedId = agentSelection.selectedAgentInfo.custom_agent_id;
    const strippedId = selectedId.replace(/^builtin-/, '');
    const candidates = new Set([selectedId, `builtin-${strippedId}`, strippedId]);
    return agentSelection.assistants.find((item) => candidates.has(item.id));
  }, [agentSelection.assistants, agentSelection.is_presetAgent, agentSelection.selectedAgentInfo?.custom_agent_id]);

  // Sync disabledBuiltinSkills + enabledSkills from preset assistant config
  useEffect(() => {
    if (agentSelection.is_presetAgent && selectedAssistantRecord) {
      setGuidDisabledBuiltinSkills(selectedAssistantRecord.disabled_builtin_skills ?? []);
      setGuidEnabledSkills(selectedAssistantRecord.enabled_skills ?? []);
    } else {
      setGuidDisabledBuiltinSkills(undefined);
      setGuidEnabledSkills(undefined);
    }
  }, [agentSelection.is_presetAgent, selectedAssistantRecord]);

  // Reset guid-local UI state before paint
  useLayoutEffect(() => {
    guidInput.setInput('');
    guidInput.setFiles([]);
    guidInput.setLoading(false);
    if (!(location.state as { workspace?: string } | null)?.workspace) {
      guidInput.setDir('');
    }
  }, [guidInput.setDir, guidInput.setFiles, guidInput.setInput, guidInput.setLoading, location.key, location.state]);

  // Clear resetAssistant from location.state
  useEffect(() => {
    if (!resetAssistantRequested && !preselectAgentKey) return;
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
  }, [resetAssistantRequested, preselectAgentKey, location.pathname, location.search, location.hash, navigate]);

  // Build the mention dropdown node
  const mentionDropdownNode = (
    <MentionDropdown
      menuRef={mention.mentionMenuRef}
      options={mention.filteredMentionOptions}
      selectedKey={mention.mentionMenuSelectedKey}
      onSelect={mention.selectMentionAgent}
    />
  );

  // Build the action row
  const actionRowNode = (
    <GuidActionRow
      files={guidInput.files}
      onFilesUploaded={guidInput.handleFilesUploaded}
      modelSelectorNode={null}
      hidePermissionSelector
      selectedAgent={agentSelection.selectedAgent}
      effectiveModeAgent={agentSelection.currentEffectiveAgentInfo.agent_type}
      selectedMode={agentSelection.selectedMode}
      onModeSelect={agentSelection.setSelectedMode}
      is_presetAgent={agentSelection.is_presetAgent}
      selectedAgentInfo={agentSelection.selectedAgentInfo}
      assistants={agentSelection.assistants}
      localeKey={localeKey}
      onClosePresetTag={() => agentSelection.setSelectedAgentKey(agentSelection.defaultAgentKey)}
      agentLogo={undefined}
      agentSwitcherItems={[]}
      onAgentSwitch={() => {}}
      allSkills={allSkills}
      disabledBuiltinSkills={guidDisabledBuiltinSkills ?? []}
      enabledSkills={guidEnabledSkills ?? []}
      onToggleSkill={handleToggleSkill}
      hidePresetTag
      loading={guidInput.loading}
      isButtonDisabled={send.isButtonDisabled}
      onSend={() => {
        setTaskGridExpanded(true);
        send.handleSend().catch((error) => {
          console.error('Failed to send message:', error);
        });
      }}
    />
  );

  // Task detail / stop handlers
  const handleTaskDetail = useCallback(
    (id: string) => {
      if (id) {
        navigate(`/conversation/${id}`);
      }
    },
    [navigate]
  );

  const handleTaskStop = useCallback((id: string) => {
    ipcBridge.conversation.stop.invoke({ conversation_id: id }).catch((error) => {
      console.error('Failed to stop conversation:', error);
    });
  }, []);

  return (
    <ConfigProvider getPopupContainer={() => guidContainerRef.current || document.body}>
      <div ref={guidContainerRef} className={styles.guidContainer}>
        <div className={styles.guidLayout}>
          {/* Harness Top Bar */}
          <HarnessTopBar activeCount={activeCount} />

          {/* Input Section */}
          <HarnessInputSection isActive={guidInput.isInputFocused}>
            <div className={styles.guidInputCard}>
              <GuidInputCard
                input={guidInput.input}
                onInputChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onPaste={guidInput.onPaste}
                onFocus={guidInput.handleTextareaFocus}
                onBlur={guidInput.handleTextareaBlur}
                placeholder={`${mention.selectedAgentLabel}, ${typewriterPlaceholder || t('conversation.welcome.placeholder')}`}
                isInputActive={guidInput.isInputFocused}
                isFileDragging={guidInput.isFileDragging}
                activeBorderColor={activeBorderColor}
                inactiveBorderColor={inactiveBorderColor}
                activeShadow={activeShadow}
                dragHandlers={guidInput.dragHandlers}
                mentionOpen={mention.mentionOpen}
                mentionSelectorBadge={
                  <MentionSelectorBadge
                    visible={mention.mentionSelectorVisible}
                    open={mention.mentionSelectorOpen}
                    onOpenChange={mention.setMentionSelectorOpen}
                    agentLabel={mention.selectedAgentLabel}
                    mentionMenu={mentionDropdownNode}
                    onResetQuery={() => mention.setMentionQuery(null)}
                  />
                }
                mentionDropdown={mentionDropdownNode}
                files={guidInput.files}
                onRemoveFile={guidInput.handleRemoveFile}
                actionRow={actionRowNode}
                workspaceDir={guidInput.dir}
                onSelectWorkspace={(dir) => guidInput.setDir(dir)}
                onClearWorkspace={() => guidInput.setDir('')}
              />
            </div>
          </HarnessInputSection>

          {/* Recent Task Grid */}
          <RecentTaskGrid
            expanded={taskGridExpanded}
            onToggle={() => setTaskGridExpanded((v) => !v)}
            onTaskDetail={handleTaskDetail}
            onTaskStop={handleTaskStop}
          />
        </div>

        {showFeedbackModal && (
          <FeedbackReportModal visible={showFeedbackModal} onCancel={() => setShowFeedbackModal(false)} />
        )}
      </div>
    </ConfigProvider>
  );
};

export default GuidPage;
