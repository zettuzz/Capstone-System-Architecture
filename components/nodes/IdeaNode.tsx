'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { WorkspaceNodeData } from '@/types';
import NodeChat from './NodeChat';

const NODE_HEADER_ACCENT: Record<string, string> = {
  idea: 'node-header-accent-idea',
  topic: 'node-header-accent-topic',
  research: 'node-header-accent-research',
  blueprint: 'node-header-accent-blueprint',
};

function IdeaNode({ id, data }: NodeProps) {
  const nodeData = data as WorkspaceNodeData;
  const { title, nodeType, messages, summary, phase, isExpanded, onToggleExpand, onAddMessage, onSuggestNode, onNodeCreate, onDeleteSubtree, onUndoNode } = nodeData;
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
      onNodeCreate({ ...instruction, sourceNodeId: id });
    }
  }, [onNodeCreate, id]);

  const handleDelete = useCallback(() => {
    if (nodeType === 'idea') {
      onDeleteSubtree?.(id);
    } else {
      onUndoNode?.(id);
    }
  }, [id, nodeType, onDeleteSubtree, onUndoNode]);

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
          className={`flex items-center gap-2 p-3 cursor-grab active:cursor-grabbing select-none ${NODE_HEADER_ACCENT[nodeType] || ''}`}
          onClick={handleToggle}
        >
          <div className={`node-dot node-dot-${nodeType}`} />
          <span className="text-text-main text-sm font-medium flex-1 truncate">{title}</span>
          {phase && (
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${phase === 'complete' ? 'phase-dot-complete' : 'phase-dot-progress'}`}
              title={`Phase: ${phase}`}
            />
          )}
          <div className="flex items-center gap-1 text-text-muted">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title={nodeType === 'idea' ? 'Delete idea and all connected nodes' : 'Undo this node and rewind parent chat'}
              className="hover:text-red-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
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
              nodeId={id}
              messages={messages}
              onAddMessage={handleAddMessage}
              onSuggestNode={handleSuggestNode}
              onNodeCreate={handleNodeCreate}
              nodeTitle={title}
              nodeType={nodeType}
              phase={phase}
              readOnly={nodeType !== 'idea' || phase === 'complete'}
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
