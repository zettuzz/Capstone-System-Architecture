'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { WorkspaceNodeData, InterviewPhase } from '@/types';
import NodeChat from './NodeChat';

const PHASE_COLORS: Record<InterviewPhase, string> = {
  problem: '#ffffff',
  system_design: '#aaaaaa',
  tech_assessment: '#888888',
  deep_dive: '#666666',
  research: '#444444',
  complete: '#222222',
};

function IdeaNode({ id, data }: NodeProps) {
  const nodeData = data as WorkspaceNodeData;
  const { title, nodeType, messages, summary, phase, isExpanded, onToggleExpand, onAddMessage, onSuggestNode, onNodeCreate } = nodeData;
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = useCallback(() => {
    onToggleExpand(id);
  }, [id, onToggleExpand]);

  const handleAddMessage = useCallback((msg: { role: 'user' | 'assistant'; content: string }) => {
    onAddMessage(id, msg);
  }, [id, onAddMessage]);

  const handleSuggestNode = useCallback((nodeTitle: string) => {
    onSuggestNode(id, nodeTitle);
  }, [id, onSuggestNode]);

  const handleNodeCreate = useCallback((instruction: import('@/types').InterviewInstruction) => {
    if (onNodeCreate) {
      onNodeCreate(instruction);
    }
  }, [onNodeCreate]);

  const userMessages = messages.filter(m => m.role === 'user').length;
  const aiMessages = messages.filter(m => m.role === 'assistant').length;

  return (
    <div
      className={`workspace-node ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-none" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-none" />

      <div className={`workspace-node-card ${isExpanded ? 'active' : ''}`}>
        {/* Compact Header */}
        <div
          className="flex items-center gap-2 p-3 cursor-pointer select-none"
          onClick={handleToggle}
        >
          <div className={`node-dot node-dot-${nodeType}`} />
          <span className="text-text-main text-sm font-medium flex-1 truncate">{title}</span>
          {phase && (
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: PHASE_COLORS[phase] || '#888888' }}
              title={`Phase: ${phase}`}
            />
          )}
          <div className="flex items-center gap-1 text-text-muted">
            <span className="text-[10px] font-mono">{messages.length}</span>
            <span className="material-symbols-outlined text-[14px]">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </div>

        {/* Expanded Chat Area */}
        {isExpanded && (
          <div className="border-t border-surface-border">
            <NodeChat
              messages={messages}
              onAddMessage={handleAddMessage}
              onSuggestNode={handleSuggestNode}
              onNodeCreate={handleNodeCreate}
              nodeTitle={title}
              nodeType={nodeType}
              phase={phase}
            />
          </div>
        )}

        {/* Compact Preview (when collapsed) */}
        {!isExpanded && (
          <div className="px-3 pb-2">
            {summary ? (
              <p className="text-text-muted text-[11px] leading-snug line-clamp-2">
                {summary}
              </p>
            ) : messages.length > 0 ? (
              <p className="text-text-muted text-[11px] font-mono truncate">
                {messages[messages.length - 1].content.slice(0, 60)}...
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(IdeaNode);
