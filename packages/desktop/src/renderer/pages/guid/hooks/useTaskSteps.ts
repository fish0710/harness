import { ipcBridge } from '@/common';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { useEffect, useRef, useState } from 'react';

export type TaskStepType = 'thinking' | 'done' | 'tool_group';

export interface TaskStepInfo {
  subject: string;
  type: TaskStepType;
}

/**
 * Tracks the latest assistant step for each conversation by subscribing
 * to the WebSocket responseStream.
 *
 * Only captures 'thought'/'thinking' (step descriptions) and 'tool_group'
 * (tool execution) messages — never raw streaming content tokens.
 *
 * Subscribes once on mount and tracks ALL conversations to avoid missing
 * events that arrive before component state updates.
 */
export function useTaskSteps(): Map<string, TaskStepInfo> {
  const [steps, setSteps] = useState<Map<string, TaskStepInfo>>(() => new Map());
  const stepsRef = useRef<Map<string, TaskStepInfo>>(new Map());

  useEffect(() => {
    const unsub = ipcBridge.conversation.responseStream.on((message: IResponseMessage) => {
      if (!message.conversation_id) return;

      const data = message.data as Record<string, unknown> | undefined;
      if (!data) return;

      if (message.type === 'thought' || message.type === 'thinking') {
        // 'thought' (aionrs) / 'thinking' (ACP): step description
        const status = data.status;
        const subject = (data.subject as string) || (data.description as string) || '';
        if (!subject) return;

        const stepType: TaskStepType = status === 'done' ? 'done' : 'thinking';
        stepsRef.current.set(message.conversation_id, { subject, type: stepType });
        setSteps(new Map(stepsRef.current));
      } else if (message.type === 'tool_group') {
        const tools = data as unknown as Array<{ status?: string; name?: string }> | null;
        if (!tools || !Array.isArray(tools)) return;
        const executing = tools.find((t) => t.status === 'Executing');
        if (executing) {
          stepsRef.current.set(message.conversation_id, {
            subject: executing.name || 'tool',
            type: 'tool_group',
          });
          setSteps(new Map(stepsRef.current));
        }
      }
    });

    return () => {
      unsub();
    };
  }, []);

  return steps;
}
