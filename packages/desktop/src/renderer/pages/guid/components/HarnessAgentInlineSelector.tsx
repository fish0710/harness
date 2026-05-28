import { Select } from '@arco-design/web-react';
import { Robot } from '@icon-park/react';
import React, { useMemo } from 'react';

interface AgentOption {
  key: string;
  label: string;
  logo?: string;
}

interface HarnessAgentInlineSelectorProps {
  agents: AgentOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

const HarnessAgentInlineSelector: React.FC<HarnessAgentInlineSelectorProps> = ({ agents, selectedKey, onSelect }) => {
  const value = useMemo(() => {
    // If the selected key is not in the list, use the first agent
    const exists = agents.some((a) => a.key === selectedKey);
    if (exists) return selectedKey;
    return agents[0]?.key || '';
  }, [agents, selectedKey]);

  if (agents.length === 0) return null;

  return (
    <Select
      value={value}
      onChange={(val) => onSelect(String(val))}
      triggerProps={{
        autoAlignPopupWidth: false,
      }}
      style={{ width: 140 }}
      size='small'
      bordered={false}
      className='!bg-transparent !text-13px'
    >
      {agents.map((agent) => (
        <Select.Option key={agent.key} value={agent.key}>
          <div className='flex items-center gap-6px'>
            {agent.logo ? (
              <img src={agent.logo} alt='' width={14} height={14} style={{ objectFit: 'contain', flexShrink: 0 }} />
            ) : (
              <Robot theme='outline' size={14} fill='currentColor' />
            )}
            <span className='text-13px'>{agent.label}</span>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default HarnessAgentInlineSelector;
