'use client';

import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
} from '@xyflow/react';
import { WorkspaceNodeData, Message, InterviewInstruction, InterviewPhase } from '@/types';
import { findRootIdea, getNodeDepth, findChainTail, getSubtreeNodes, computeAutoLayout } from '@/lib/workspace-utils';

export function useWorkspaceNodes() {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any);
  const [lastInteractedNode, setLastInteractedNode] = useState<string | null>(null);
  const [chainTails, setChainTails] = useState<Record<string, string | null>>({});
  const { fitView } = useReactFlow();
  const nodesRef = useRef<any[]>([]);
  const edgesRef = useRef<any[]>([]);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const updateNodeData = useCallback((nodeId: string, updates: Partial<WorkspaceNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        return { ...node, data: { ...(node.data as WorkspaceNodeData), ...updates } };
      })
    );
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
    },
    [setEdges]
  );

  const handleToggleExpand = useCallback((nodeId: string) => {
    setLastInteractedNode(nodeId);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const d = node.data as WorkspaceNodeData;
        return { ...node, data: { ...d, isExpanded: !d.isExpanded } };
      })
    );
  }, [setNodes]);

  const handleAddMessage = useCallback((nodeId: string, message: Message) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const d = node.data as WorkspaceNodeData;
        return { ...node, data: { ...d, messages: [...d.messages, message] } };
      })
    );
  }, [setNodes]);

  const removeSubtree = useCallback((rootId: string) => {
    const subtree = getSubtreeNodes(rootId, nodesRef.current, edgesRef.current);
    const ids = new Set(subtree.map((n: any) => n.id));
    setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
    setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
    setChainTails((prev) => {
      const updated = { ...prev };
      for (const id of ids) delete updated[id];
      return updated;
    });
    setLastInteractedNode((curr) => (curr && ids.has(curr) ? null : curr));
  }, [setNodes, setEdges]);

  const handleDeleteSubtree = useCallback((nodeId: string) => {
    if (!nodesRef.current.find((n: any) => n.id === nodeId)) return;
    removeSubtree(nodeId);
  }, [removeSubtree]);

  const handleUndoNode = useCallback((childId: string) => {
    const parentEdge = edgesRef.current.find((e: any) => e.target === childId);
    const parentId = parentEdge?.source || null;
    const childNode = nodesRef.current.find((n: any) => n.id === childId);
    const parentMessageCount = childNode ? (childNode.data as WorkspaceNodeData)?.parentMessageCount : undefined;
    removeSubtree(childId);
    if (parentId && parentMessageCount !== undefined) {
      const parent = nodesRef.current.find((n: any) => n.id === parentId);
      if (parent) {
        const truncated = (parent.data as WorkspaceNodeData).messages.slice(0, parentMessageCount);
        updateNodeData(parentId, { messages: truncated });
      }
    }
  }, [removeSubtree, updateNodeData]);

  const calculatePosition = useCallback((parentId: string | null) => {
    if (!parentId) {
      const existingRoots = nodes.filter(n => (n.data as WorkspaceNodeData).nodeType === 'idea');
      const offset = existingRoots.length * 250;
      return { x: 400 + (existingRoots.length > 2 ? 0 : offset), y: 300 + (existingRoots.length > 2 ? 250 : 0) };
    }
    const parent = nodes.find(n => n.id === parentId);
    const parentPos = parent?.position || { x: 400, y: 300 };
    const children = edges.filter(e => e.source === parentId);
    const maxChildren = 6;
    const angle = Math.PI / 2 + (children.length * (2 * Math.PI / maxChildren));
    return {
      x: parentPos.x + Math.cos(angle) * 280,
      y: parentPos.y + Math.sin(angle) * 280,
    };
  }, [nodes, edges]);

  const handleSuggestNode = useCallback((_parentId: string, title: string) => {
    createNewNode(title, _parentId);
  }, []);

  const createNewNode = useCallback((
    title: string,
    parentId?: string | null,
    summary?: string,
    nodeType?: 'topic' | 'research' | 'idea',
    phase?: InterviewPhase,
    initialMessages?: Message[],
    parentMessageCount?: number
  ) => {
    const newNodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const position = calculatePosition(parentId || null);

    const newNode = {
      id: newNodeId,
      type: 'ideaNode' as const,
      position,
      data: {
        title,
        nodeType: nodeType || 'topic' as const,
        messages: initialMessages || [],
        summary,
        phase,
        isExpanded: false,
        parentMessageCount,
        onToggleExpand: handleToggleExpand,
        onAddMessage: handleAddMessage,
        onSuggestNode: handleSuggestNode,
        onNodeCreate: handleNodeCreate,
        onDeleteSubtree: handleDeleteSubtree,
        onUndoNode: handleUndoNode,
      },
    };

    setNodes((nds) => [...nds, newNode]);

    if (parentId) {
      setEdges((eds) =>
        addEdge(
          { id: `e-${parentId}-${newNodeId}`, source: parentId, target: newNodeId, type: 'smoothstep', animated: true },
          eds
        )
      );
    }

    setTimeout(() => fitView({ padding: 0.3, duration: 500 }), 100);
    setLastInteractedNode(newNodeId);
    return newNodeId;
  }, [calculatePosition, setNodes, setEdges, fitView, handleToggleExpand, handleAddMessage, handleSuggestNode, handleDeleteSubtree, handleUndoNode]);

  // handleNodeCreate needs handleSearchResearch and handleGradeProject from useWorkspaceAI.
  // We wire it via a ref that the AI hook sets.
  const handleNodeCreateRef = useRef<(instruction: InterviewInstruction) => void>(() => {});
  const handleNodeCreate = useCallback((instruction: InterviewInstruction) => {
    handleNodeCreateRef.current(instruction);
  }, []);

  const handleNewIdea = useCallback(() => {
    const nodeId = createNewNode(
      `Idea ${nodes.filter(n => (n.data as WorkspaceNodeData).nodeType === 'idea').length + 1}`,
      null, undefined, 'idea', 'problem'
    );
    setChainTails(prev => ({ ...prev, [nodeId]: null }));
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        return { ...node, data: { ...(node.data as WorkspaceNodeData), isExpanded: true } };
      })
    );
  }, [createNewNode, nodes]);

  const handleAutoLayout = useCallback(() => {
    setNodes((nds) => {
      const positions = computeAutoLayout(nds, edgesRef.current);
      return nds.map((n) => positions[n.id] ? { ...n, position: positions[n.id] } : n);
    });
    setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 50);
  }, [setNodes, fitView]);

  useEffect(() => {
    if (Object.keys(chainTails).length === 0) return;
    setChainTails(prev => {
      const updated = { ...prev };
      let changed = false;
      for (const rootId of Object.keys(updated)) {
        const tail = findChainTail(rootId, edges);
        if (tail !== updated[rootId]) { updated[rootId] = tail; changed = true; }
      }
      return changed ? updated : prev;
    });
  }, [edges]);

  const wiredNodes = useMemo(() =>
    nodes.map(node => ({
      ...node,
      data: {
        ...(node.data as WorkspaceNodeData),
        onToggleExpand: handleToggleExpand,
        onAddMessage: handleAddMessage,
        onSuggestNode: handleSuggestNode,
        onNodeCreate: handleNodeCreate,
        onDeleteSubtree: handleDeleteSubtree,
        onUndoNode: handleUndoNode,
      },
    })),
    [nodes, handleToggleExpand, handleAddMessage, handleSuggestNode, handleNodeCreate, handleDeleteSubtree, handleUndoNode]
  );

  return {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    wiredNodes, setNodes, setEdges,
    lastInteractedNode, setLastInteractedNode,
    chainTails, setChainTails,
    nodesRef, edgesRef,
    createNewNode, handleNewIdea, handleAutoLayout,
    handleToggleExpand, handleAddMessage, handleSuggestNode,
    handleNodeCreate, handleDeleteSubtree, handleUndoNode,
    handleNodeCreateRef,
    updateNodeData,
  };
}
