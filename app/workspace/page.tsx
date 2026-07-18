'use client';

import { useCallback, useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  SelectionMode,
} from '@xyflow/react';
import IdeaNode from '@/components/nodes/IdeaNode';
import Sidebar from '@/components/Sidebar';
import WorkspaceToolbar from '@/components/workspace/WorkspaceToolbar';
import BlueprintPanel from '@/components/workspace/BlueprintPanel';
import { WorkspaceNodeData, Message } from '@/types';
import { useWorkspaceNodes } from '@/hooks/useWorkspaceNodes';
import { useWorkspaceAI } from '@/hooks/useWorkspaceAI';
import { useWorkspaceSave } from '@/hooks/useWorkspaceSave';
import { findRootIdea, getSubtreeNodes, findChainTail } from '@/lib/workspace-utils';

const nodeTypes = { ideaNode: IdeaNode };

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    wiredNodes, setNodes, setEdges,
    lastInteractedNode, setLastInteractedNode,
    chainTails, setChainTails,
    nodesRef, edgesRef,
    createNewNode, handleNewIdea, handleAutoLayout,
    handleToggleExpand, handleAddMessage,
    handleDeleteSubtree, handleUndoNode,
    handleNodeCreate: nodeCreateFromNodes,
    handleNodeCreateRef,
  } = useWorkspaceNodes();

  const [projectTitle, setProjectTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [blueprintData, setBlueprintData] = useState<Record<string, { markdown: string; schedule: any[] }>>({});
  const [activeBlueprintRoot, setActiveBlueprintRoot] = useState<string | null>(null);
  const [blueprintLoadingRoot, setBlueprintLoadingRoot] = useState<string | null>(null);
  const [blueprintReady, setBlueprintReady] = useState(false);

  const {
    isSearching, isGrading,
    handleGradeProject, handleGenerateBlueprint, kickoffNewProject,
  } = useWorkspaceAI({
    nodesRef, edgesRef,
    lastInteractedNode, chainTails, setChainTails, setLastInteractedNode,
    setNodes, createNewNode, handleAddMessage,
    handleNodeCreateRef,
    projectTitle, setProjectTitle,
  });

  useWorkspaceSave(projectId, nodesRef, edgesRef, nodes, edges);

  const initializedRef = useRef(false);

  useEffect(() => {
    const selected = nodes.filter((n) => (n as any).selected);
    const ready = selected.some((n) => {
      const rootId = findRootIdea(n.id, nodes, edges);
      if (!rootId) return false;
      return getSubtreeNodes(rootId, nodes, edges).some((sn: any) => (sn.data as WorkspaceNodeData)?.phase === 'complete');
    });
    setBlueprintReady(ready);
  }, [nodes, edges]);

  const handleDownloadBlueprint = useCallback(() => {
    if (!activeBlueprintRoot) return;
    const data = blueprintData[activeBlueprintRoot];
    if (!data) return;
    const rootTitle = (nodesRef.current.find((n: any) => n.id === activeBlueprintRoot)?.data as WorkspaceNodeData)?.title || projectTitle;
    const blob = new Blob([data.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rootTitle.replace(/\s+/g, '_')}_Blueprint.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeBlueprintRoot, blueprintData, projectTitle, nodesRef]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!projectId) { router.push('/'); return; }

    const loadProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error('Failed to load project');
        const data = await res.json();
        const project = data.project;
        setProjectTitle(project.title);

        if (project.nodes && project.nodes.length > 0) {
          const hydratedNodes = project.nodes.map((n: any) => ({
            ...n,
            data: {
              ...n.data,
              isExpanded: n.data?.isExpanded ?? false,
              onToggleExpand: handleToggleExpand,
              onAddMessage: handleAddMessage,
              onSuggestNode: (pid: string, title: string) => createNewNode(title, pid),
              onNodeCreate: nodeCreateFromNodes,
              onDeleteSubtree: handleDeleteSubtree,
              onUndoNode: handleUndoNode,
            },
          }));
          const savedEdges = project.edges || [];
          setNodes(hydratedNodes);
          setEdges(savedEdges);

          const tails: Record<string, string | null> = {};
          const ideaNodes = hydratedNodes.filter((n: any) => n.data?.nodeType === 'idea');
          for (const idea of ideaNodes) {
            tails[idea.id] = findChainTail(idea.id, savedEdges);
          }
          setChainTails(tails);

          const firstIdea = ideaNodes[0];
          if (firstIdea) setLastInteractedNode(firstIdea.id);
          setIsLoading(false);
        } else {
          kickoffNewProject(projectId, project.title).then(() => setIsLoading(false));
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const rootTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    for (const node of nodes) {
      const data = node.data as WorkspaceNodeData;
      if (data.nodeType === 'idea') titles[node.id] = data.title || 'Idea';
    }
    return titles;
  }, [nodes]);

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar currentProjectId={projectId || undefined} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <WorkspaceToolbar
          onGenerateBlueprint={() => handleGenerateBlueprint(setShowBlueprint, setBlueprintLoadingRoot, setActiveBlueprintRoot, setBlueprintData, activeBlueprintRoot)}
          onNewIdea={handleNewIdea}
          onAutoLayout={handleAutoLayout}
          nodeCount={nodes.length}
          blueprintReady={blueprintReady}
          projectTitle={projectTitle}
        />

        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background-dark/80">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
              <p className="text-text-muted text-[12px] font-mono">Decomposing your idea...</p>
            </div>
          </div>
        )}

        {isSearching && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-surface border border-surface-border px-4 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
            <p className="text-text-muted text-[11px] font-mono">Searching for similar systems...</p>
          </div>
        )}

        {isGrading && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-surface border border-surface-border px-4 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
            <p className="text-text-muted text-[11px] font-mono">Grading your project...</p>
          </div>
        )}

        <div className="flex-1 relative">
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
            selectionMode={SelectionMode.Partial}
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
            onNodeClick={(_, node) => setLastInteractedNode(node.id)}
          >
            <Controls showInteractive={false} className="!border-surface-border !bg-surface" />
            <MiniMap nodeColor="#333333" maskColor="rgba(10, 10, 10, 0.8)" className="!border-surface-border !bg-surface" />
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1A1A1A" />
          </ReactFlow>
        </div>
      </div>

      {showBlueprint && (
        <BlueprintPanel
          blueprints={blueprintData}
          rootTitles={rootTitles}
          activeRoot={activeBlueprintRoot}
          onSelectRoot={setActiveBlueprintRoot}
          loadingRoot={blueprintLoadingRoot}
          isLoading={!activeBlueprintRoot || blueprintLoadingRoot === activeBlueprintRoot}
          onClose={() => setShowBlueprint(false)}
          onDownload={handleDownloadBlueprint}
        />
      )}
    </div>
  );
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
