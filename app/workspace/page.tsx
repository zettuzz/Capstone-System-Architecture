'use client';

import { useCallback, useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import IdeaNode from '@/components/nodes/IdeaNode';
import Sidebar from '@/components/Sidebar';
import WorkspaceToolbar from '@/components/workspace/WorkspaceToolbar';
import AddNodeModal from '@/components/workspace/AddNodeModal';
import BlueprintPanel from '@/components/workspace/BlueprintPanel';
import { WorkspaceNodeData, Message, InterviewInstruction, InterviewPhase } from '@/types';

const nodeTypes = { ideaNode: IdeaNode };

const PHASE_ORDER: InterviewPhase[] = ['problem', 'system_design', 'tech_assessment', 'deep_dive', 'research', 'complete'];

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea') || 'AI Study Planner';

  const [nodes, setNodes, onNodesChange] = useNodesState([] as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [blueprintData, setBlueprintData] = useState<{ markdown: string; schedule: { week: number; title: string; tasks: string[]; milestone?: string }[] } | null>(null);
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>('problem');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const initializedRef = useRef(false);

  const updateNodeData = useCallback((nodeId: string, updates: Partial<WorkspaceNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const currentData = node.data as WorkspaceNodeData;
        return {
          ...node,
          data: { ...currentData, ...updates },
        };
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
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const currentData = node.data as WorkspaceNodeData;
        return {
          ...node,
          data: { ...currentData, isExpanded: !currentData.isExpanded },
        };
      })
    );
  }, [setNodes]);

  const handleAddMessage = useCallback((nodeId: string, message: Message) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const currentData = node.data as WorkspaceNodeData;
        return {
          ...node,
          data: { ...currentData, messages: [...currentData.messages, message] },
        };
      })
    );
  }, [setNodes]);

  const handleSuggestNode = useCallback((_parentId: string, title: string) => {
    createNewNode(title, _parentId);
  }, []);

  const calculatePosition = useCallback((parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    const parentPos = parent?.position || { x: 400, y: 300 };

    const children = edges.filter(e => e.source === parentId);
    const existingCount = children.length;
    const maxChildren = 6;
    const angleOffset = -Math.PI / 2;
    const angle = angleOffset + (existingCount * (2 * Math.PI / maxChildren));
    const distance = 280;

    return {
      x: parentPos.x + Math.cos(angle) * distance,
      y: parentPos.y + Math.sin(angle) * distance,
    };
  }, [nodes, edges]);

  const createNewNode = useCallback((title: string, parentId?: string, summary?: string, nodeType?: 'topic' | 'research' | 'idea', phase?: InterviewPhase, initialMessages?: Message[]) => {
    const newNodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const parentIdForPos = parentId || 'idea-hub';
    const position = calculatePosition(parentIdForPos);

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
        onToggleExpand: handleToggleExpand,
        onAddMessage: handleAddMessage,
        onSuggestNode: handleSuggestNode,
        onNodeCreate: handleNodeCreate,
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
    return newNodeId;
  }, [calculatePosition, setNodes, setEdges, fitView, handleToggleExpand, handleAddMessage, handleSuggestNode]);

  const handleNodeCreate = useCallback((instruction: InterviewInstruction) => {
    if (instruction.action === 'create_node' && instruction.nodeTitle) {
      const nextPhase = getNextPhase(interviewPhase);
      if (nextPhase) setInterviewPhase(nextPhase);

      createNewNode(
        instruction.nodeTitle,
        instruction.parentNodeId || 'idea-hub',
        instruction.nodeSummary,
        instruction.nodeType || 'topic',
        nextPhase || undefined
      );
    } else if (instruction.action === 'search_research' && instruction.query) {
      handleSearchResearch(instruction.query);
    } else if (instruction.action === 'grade_project') {
      handleGradeProject();
    }
  }, [interviewPhase, createNewNode]);

  const handleSearchResearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 5 }),
      });
      const data = await res.json();

      const results = data.results?.results || [];
      const summary = results.length > 0
        ? results.map((r: { title: string; url: string; content: string }) => `**${r.title}**: ${r.content}`).join('\n\n')
        : 'No similar systems found via web search.';

      const searchMessages: Message[] = [
        { role: 'assistant', content: `## Research Findings\n\n${summary}` }
      ];

      createNewNode(
        'Research: Similar Systems',
        'idea-hub',
        `Web search for similar systems. Found ${results.length} results.`,
        'research',
        'research',
        searchMessages
      );

      handleAddMessage('idea-hub', {
        role: 'assistant',
        content: `I found ${results.length} similar systems. Check the Research node for details. Would you like me to grade your project now?`
      });
    } catch (err) {
      console.error('Research search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [createNewNode, handleAddMessage]);

  const handleGradeProject = useCallback(async () => {
    setIsGrading(true);
    try {
      const allMessages: { role: string; content: string }[] = [];
      nodes.forEach(node => {
        const data = node.data as WorkspaceNodeData;
        if (data.messages.length > 0) {
          allMessages.push({ role: 'system', content: `--- Topic: ${data.title} ---` });
          data.messages.forEach(m => allMessages.push(m));
        }
      });

      if (allMessages.length === 0) {
        allMessages.push({ role: 'user', content: idea });
      }

      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, title: idea }),
      });
      const evalData = await evalRes.json();
      const evaluation = evalData.evaluation;

      const gradeContent = `## Grade Report\n\n**Score: ${evaluation.score}/10**\n\n**Feasibility:** ${evaluation.feasibility}\n**Timeframe:** ${evaluation.timeframe}\n**Team Size:** ${evaluation.teamSize}\n\n### Suggested Stack\n${evaluation.suggestedStack?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}\n\n### Improvements\n${evaluation.improvements?.map((i: string) => `- ${i}`).join('\n') || 'N/A'}\n\n### Research Gap\n${evaluation.researchGap || 'N/A'}\n\n### Research Questions\n${evaluation.researchQuestions?.map((q: string) => `- ${q}`).join('\n') || 'N/A'}`;

      createNewNode(
        `Grade: ${evaluation.score}/10 — ${evaluation.feasibility}`,
        'idea-hub',
        `Project scored ${evaluation.score}/10. Feasibility: ${evaluation.feasibility}. ${evaluation.timeframe} timeline.`,
        'topic',
        'complete',
        [{ role: 'assistant', content: gradeContent }]
      );

      setInterviewPhase('complete');
    } catch (err) {
      console.error('Grading failed:', err);
    } finally {
      setIsGrading(false);
    }
  }, [nodes, idea, createNewNode]);

  const handleAddNode = useCallback((title: string) => {
    createNewNode(title);
    setShowAddModal(false);
  }, [createNewNode]);

  const handleGenerateBlueprint = useCallback(async () => {
    setShowBlueprint(true);

    const allMessages: { role: string; content: string }[] = [];
    nodes.forEach(node => {
      const data = node.data as WorkspaceNodeData;
      if (data.messages.length > 0) {
        allMessages.push({ role: 'system', content: `--- Topic: ${data.title} ---` });
        data.messages.forEach(m => allMessages.push(m));
      }
    });

    if (allMessages.length === 0) {
      allMessages.push({ role: 'user', content: 'Help me plan my capstone project' });
    }

    try {
      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, title: idea }),
      });
      const evalData = await evalRes.json();

      const exportRes = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluation: evalData.evaluation, messages: allMessages }),
      });
      const exportData = await exportRes.json();

      setBlueprintData({
        markdown: exportData.markdown,
        schedule: exportData.schedule || [],
      });
    } catch (err) {
      console.error('Blueprint generation failed:', err);
      setBlueprintData({
        markdown: '# Blueprint Generation Failed\n\nPlease try again.',
        schedule: [],
      });
    }
  }, [nodes, idea]);

  const handleDownloadBlueprint = useCallback(() => {
    if (!blueprintData) return;
    const blob = new Blob([blueprintData.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.replace(/\s+/g, '_')}_Blueprint.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [blueprintData, idea]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const kickoff = async () => {
      const hubNode = {
        id: 'idea-hub',
        type: 'ideaNode' as const,
        position: { x: 400, y: 300 },
        data: {
          title: idea,
          nodeType: 'idea' as const,
          messages: [],
          isExpanded: true,
          onToggleExpand: handleToggleExpand,
          onAddMessage: handleAddMessage,
          onSuggestNode: handleSuggestNode,
          onNodeCreate: handleNodeCreate,
        },
      };
      setNodes([hubNode]);

      try {
        const kickoffMessages = [
          { role: 'system', content: 'You are CapstoneAI, an expert thesis adviser. You are starting a structured interview with a student.' },
          { role: 'user', content: `I want to create a capstone project: ${idea}` },
        ];

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: kickoffMessages,
            title: idea,
          }),
        });

        if (!response.ok) throw new Error('Kickoff failed');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const data = line.slice(2);
              if (data === '[DONE]') break;
              try {
                const token = JSON.parse(data);
                fullContent += token;
              } catch {}
            }
          }
        }

        if (fullContent) {
          const INSTRUCTION_REGEX = /<!--\s*INTERVIEW_INSTRUCTION\s*([\s\S]*?)\s*-->/;
          const match = fullContent.match(INSTRUCTION_REGEX);
          const clean = fullContent.replace(INSTRUCTION_REGEX, '').trim();

          setNodes((nds) =>
            nds.map((node) => {
              if (node.id !== 'idea-hub') return node;
              const currentData = node.data as WorkspaceNodeData;
              return {
                ...node,
                data: { ...currentData, messages: [{ role: 'assistant', content: clean }] },
              };
            })
          );

          if (match) {
            try {
              const instruction = JSON.parse(match[1]) as InterviewInstruction;
              if (instruction.action === 'create_node' && instruction.nodeTitle) {
                const nextPhase = getNextPhase('problem');
                if (nextPhase) {
                  setInterviewPhase(nextPhase);
                  createNewNode(
                    instruction.nodeTitle,
                    instruction.parentNodeId || 'idea-hub',
                    instruction.nodeSummary,
                    instruction.nodeType || 'topic',
                    nextPhase
                  );
                }
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error('Kickoff failed:', err);
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id !== 'idea-hub') return node;
            const currentData = node.data as WorkspaceNodeData;
            return {
              ...node,
              data: {
                ...currentData,
                messages: [{ role: 'assistant', content: `Let's design your capstone project: **${idea}**\n\nTell me about the problem you want to solve. Who will benefit from this system?` }],
              },
            };
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    kickoff();
  }, [idea]);

  const wiredNodes = useMemo(() =>
    nodes.map(node => ({
      ...node,
      data: {
        ...(node.data as WorkspaceNodeData),
        onToggleExpand: handleToggleExpand,
        onAddMessage: handleAddMessage,
        onSuggestNode: handleSuggestNode,
        onNodeCreate: handleNodeCreate,
      },
    })),
    [nodes, handleToggleExpand, handleAddMessage, handleSuggestNode, handleNodeCreate]
  );

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <WorkspaceToolbar
          onAddNode={() => setShowAddModal(true)}
          onGenerateBlueprint={handleGenerateBlueprint}
          nodeCount={nodes.length}
          phase={interviewPhase}
        />

        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background-dark/80">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <p className="text-text-muted text-[12px] font-mono">Decomposing your idea...</p>
            </div>
          </div>
        )}

        {isSearching && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-surface border border-surface-border px-4 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <p className="text-text-muted text-[11px] font-mono">Searching for similar systems...</p>
          </div>
        )}

        {isGrading && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-surface border border-surface-border px-4 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <p className="text-text-muted text-[11px] font-mono">Grading your project...</p>
          </div>
        )}

        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={wiredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            className="bg-background-dark"
          >
            <Controls
              showInteractive={false}
              className="!border-surface-border !bg-surface"
            />
            <MiniMap
              nodeColor="#333333"
              maskColor="rgba(10, 10, 10, 0.8)"
              className="!border-surface-border !bg-surface"
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="#1A1A1A"
            />
          </ReactFlow>
        </div>
      </div>

      {showAddModal && (
        <AddNodeModal
          onAdd={handleAddNode}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showBlueprint && (
        <BlueprintPanel
          markdown={blueprintData?.markdown || ''}
          schedule={blueprintData?.schedule || []}
          isLoading={!blueprintData}
          onClose={() => setShowBlueprint(false)}
          onDownload={handleDownloadBlueprint}
        />
      )}
    </div>
  );
}

function getNextPhase(current: InterviewPhase): InterviewPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx < 0 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="bg-background-dark h-screen" />}>
      <ReactFlowProvider>
        <WorkspaceContent />
      </ReactFlowProvider>
    </Suspense>
  );
}
