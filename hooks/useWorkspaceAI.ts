'use client';

import { useCallback, useState } from 'react';
import { WorkspaceNodeData, Message, InterviewInstruction } from '@/types';
import { useLLMProvider } from '@/components/LLMProviderContext';
import { readSSEStream } from '@/lib/stream';
import { findRootIdea, getSubtreeNodes } from '@/lib/workspace-utils';
import { estimateTokensFromMessages } from '@/lib/user-keys';

interface UseWorkspaceAIParams {
  nodesRef: React.MutableRefObject<any[]>;
  edgesRef: React.MutableRefObject<any[]>;
  lastInteractedNode: string | null;
  chainTails: Record<string, string | null>;
  setChainTails: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  setLastInteractedNode: (id: string | null) => void;
  setNodes: any;
  createNewNode: (
    title: string,
    parentId?: string | null,
    summary?: string,
    nodeType?: 'topic' | 'research' | 'idea',
    phase?: any,
    initialMessages?: Message[],
    parentMessageCount?: number
  ) => string;
  handleAddMessage: (nodeId: string, message: Message) => void;
  handleNodeCreateRef: React.MutableRefObject<(instruction: InterviewInstruction) => void>;
  projectTitle: string;
  setProjectTitle: (title: string) => void;
}

export function useWorkspaceAI({
  nodesRef,
  edgesRef,
  lastInteractedNode,
  chainTails,
  setChainTails,
  setLastInteractedNode,
  setNodes,
  createNewNode,
  handleAddMessage,
  handleNodeCreateRef,
  projectTitle,
  setProjectTitle,
}: UseWorkspaceAIParams) {
  const { provider, userKeys, canMakeRequest, consumeTokensBudget } = useLLMProvider();
  const [isSearching, setIsSearching] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  const prepareRequest = useCallback(() => {
    return !!userKeys[provider] ? userKeys[provider] : undefined;
  }, [provider, userKeys]);

  const checkBudgetAndTrack = useCallback(async (
    messages: { role: string; content: string }[],
    responseFn: () => Promise<Response>
  ): Promise<Response> => {
    const hasUserKey = !!userKeys[provider];
    if (!hasUserKey && !canMakeRequest()) {
      throw new Error('BUDGET_EXHAUSTED');
    }
    const response = await responseFn();
    if (!hasUserKey && response.ok) {
      const inputTokens = estimateTokensFromMessages(messages);
      const clone = response.clone();
      try {
        const body = await clone.json();
        const outputText = body?.evaluation ? JSON.stringify(body.evaluation)
          : body?.markdown ? body.markdown
          : body?.suggestions?.join(' ') || '';
        const outputTokens = Math.ceil((outputText.split(/\s+/).filter(Boolean).length) * 1.3);
        consumeTokensBudget(inputTokens, outputTokens);
      } catch {
        consumeTokensBudget(inputTokens, 200);
      }
    }
    return response;
  }, [provider, userKeys, canMakeRequest, consumeTokensBudget]);

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

      createNewNode(
        'Research: Similar Systems',
        lastInteractedNode,
        `Web search for similar systems. Found ${results.length} results.`,
        'research',
        'research',
        [{ role: 'assistant', content: `## Research Findings\n\n${summary}` }]
      );

      if (lastInteractedNode) {
        handleAddMessage(lastInteractedNode, {
          role: 'assistant',
          content: `I found ${results.length} similar systems. Check the Research node for details. Would you like me to grade your project now?`
        });
      }
    } catch (err) {
      console.error('Research search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [createNewNode, handleAddMessage, lastInteractedNode]);

  const handleGradeProject = useCallback(async (sourceNodeId?: string | null) => {
    setIsGrading(true);
    try {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      const rootIdeaId = sourceNodeId
        ? findRootIdea(sourceNodeId, currentNodes, currentEdges)
        : currentNodes.find((n: any) => n.data?.nodeType === 'idea')?.id || null;

      const relevantNodes = rootIdeaId
        ? getSubtreeNodes(rootIdeaId, currentNodes, currentEdges)
        : currentNodes;

      const allMessages: { role: string; content: string }[] = [];
      relevantNodes.forEach((node: any) => {
        const data = node.data as WorkspaceNodeData;
        if (data.messages.length > 0) {
          allMessages.push({ role: 'system', content: `--- Topic: ${data.title} ---` });
          data.messages.forEach(m => allMessages.push(m));
        }
      });

      if (allMessages.length === 0) {
        allMessages.push({ role: 'user', content: projectTitle });
      }

      const userApiKey = prepareRequest();

      const evalRes = await checkBudgetAndTrack(
        allMessages,
        () => fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages, title: projectTitle, provider, userApiKey }),
        })
      );
      const evalData = await evalRes.json();
      const evaluation = evalData.evaluation;

      const gradeContent = `## Grade Report\n\n**Score: ${evaluation.score}/10**\n\n**Feasibility:** ${evaluation.feasibility}\n**Timeframe:** ${evaluation.timeframe}\n**Team Size:** ${evaluation.teamSize}\n\n### Suggested Stack\n${evaluation.suggestedStack?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}\n\n### Improvements\n${evaluation.improvements?.map((i: string) => `- ${i}`).join('\n') || 'N/A'}\n\n### Research Gap\n${evaluation.researchGap || 'N/A'}\n\n### Research Questions\n${evaluation.researchQuestions?.map((q: string) => `- ${q}`).join('\n') || 'N/A'}`;

      createNewNode(
        `Grade: ${evaluation.score}/10 — ${evaluation.feasibility}`,
        rootIdeaId,
        `Project scored ${evaluation.score}/10. Feasibility: ${evaluation.feasibility}. ${evaluation.timeframe} timeline.`,
        'topic',
        'complete',
        [{ role: 'assistant', content: gradeContent }]
      );
    } catch (err) {
      console.error('Grading failed:', err);
    } finally {
      setIsGrading(false);
    }
  }, [projectTitle, createNewNode, nodesRef, edgesRef, provider, prepareRequest, checkBudgetAndTrack]);

  const handleCompleteProjectReview = useCallback(async (sourceNodeId?: string | null, finalGrade?: string, feedback?: string) => {
    setIsGrading(true);
    try {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      const rootIdeaId = sourceNodeId
        ? findRootIdea(sourceNodeId, currentNodes, currentEdges)
        : currentNodes.find((n: any) => n.data?.nodeType === 'idea')?.id || null;

      if (!rootIdeaId) return;

      const relevantNodes = getSubtreeNodes(rootIdeaId, currentNodes, currentEdges);

      const allMessages: { role: string; content: string }[] = [];
      relevantNodes.forEach((node: any) => {
        const data = node.data as WorkspaceNodeData;
        if (data.messages.length > 0) {
          allMessages.push({ role: 'system', content: `--- Topic: ${data.title} ---` });
          data.messages.forEach(m => allMessages.push(m));
        }
      });

      if (allMessages.length === 0) {
        allMessages.push({ role: 'user', content: projectTitle });
      }

      const userApiKey = prepareRequest();

      const evalRes = await checkBudgetAndTrack(
        allMessages,
        () => fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages, title: projectTitle, provider, userApiKey }),
        })
      );
      const evalData = await evalRes.json();
      const evaluation = evalData.evaluation;

      const score = finalGrade || evaluation.score;
      const reviewFeedback = feedback || '';

      const gradeContent = `## Project Complete — Grade Report\n\n**Score: ${score}/10**\n\n${reviewFeedback ? `> ${reviewFeedback}\n\n` : ''}**Feasibility:** ${evaluation.feasibility}\n**Timeframe:** ${evaluation.timeframe}\n**Team Size:** ${evaluation.teamSize}\n\n### Suggested Stack\n${evaluation.suggestedStack?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}\n\n### Improvements\n${evaluation.improvements?.map((i: string) => `- ${i}`).join('\n') || 'N/A'}\n\n### Research Gap\n${evaluation.researchGap || 'N/A'}\n\n### Research Questions\n${evaluation.researchQuestions?.map((q: string) => `- ${q}`).join('\n') || 'N/A'}\n\n---\n*This project has been graded and is now complete. The interview is finished.*`;

      handleAddMessage(rootIdeaId, { role: 'assistant', content: gradeContent });

      setNodes((nds: any[]) =>
        nds.map((node) => {
          if (node.id !== rootIdeaId) return node;
          return { ...node, data: { ...(node.data as WorkspaceNodeData), phase: 'complete' as const } };
        })
      );
    } catch (err) {
      console.error('Project review failed:', err);
    } finally {
      setIsGrading(false);
    }
  }, [projectTitle, setNodes, handleAddMessage, nodesRef, edgesRef, provider, prepareRequest, checkBudgetAndTrack]);

  const handleNodeCreate = useCallback((instruction: InterviewInstruction) => {
    if (instruction.action === 'create_node' && instruction.nodeTitle) {
      const sourceId = instruction.parentNodeId || lastInteractedNode;
      const rootIdeaId = findRootIdea(sourceId, nodesRef.current, edgesRef.current);
      const parentId = (rootIdeaId && chainTails[rootIdeaId]) || sourceId;
      const parentNode = nodesRef.current.find((n: any) => n.id === parentId);
      const parentMessageCount = parentNode ? (parentNode.data as WorkspaceNodeData).messages.length : undefined;

      let phase = instruction.phase;
      if (!phase && rootIdeaId && sourceId) {
        const depth = getSubtreeNodes(sourceId, nodesRef.current, edgesRef.current).length;
        if (depth <= 2) phase = 'problem';
        else if (depth <= 4) phase = 'system_design';
        else phase = 'tech_assessment';
      }

      const newNodeId = createNewNode(
        instruction.nodeTitle, parentId, instruction.nodeSummary,
        instruction.nodeType || 'topic', phase, undefined, parentMessageCount
      );

      if (rootIdeaId) {
        setChainTails(prev => ({ ...prev, [rootIdeaId]: newNodeId }));
      }
    } else if (instruction.action === 'search_research' && instruction.query) {
      handleSearchResearch(instruction.query);
    } else if (instruction.action === 'grade_project') {
      handleGradeProject(instruction.sourceNodeId || lastInteractedNode);
    } else if (instruction.action === 'complete_project_review') {
      handleCompleteProjectReview(
        instruction.sourceNodeId || lastInteractedNode,
        instruction.finalGrade,
        instruction.feedback
      );
    }
  }, [lastInteractedNode, chainTails, createNewNode, nodesRef, handleSearchResearch, handleGradeProject, handleCompleteProjectReview]);

  handleNodeCreateRef.current = handleNodeCreate;

  const handleGenerateBlueprint = useCallback(async (
    setShowBlueprint: (v: boolean) => void,
    setBlueprintLoadingRoot: (v: string | null) => void,
    setActiveBlueprintRoot: (v: string | null) => void,
    setBlueprintData: React.Dispatch<React.SetStateAction<Record<string, { markdown: string; schedule: any[] }>>>,
    activeBlueprintRoot: string | null,
  ): Promise<void | 'needs_key'> => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const selected = currentNodes.filter((n: any) => n.selected);
    if (selected.length === 0) return;

    const rootSet = new Set<string>();
    for (const node of selected) {
      const root = findRootIdea(node.id, currentNodes, currentEdges);
      if (!root) continue;
      const subtree = getSubtreeNodes(root, currentNodes, currentEdges);
      const isComplete = subtree.some((sn: any) => (sn.data as WorkspaceNodeData)?.phase === 'complete');
      if (isComplete) rootSet.add(root);
    }
    if (rootSet.size === 0) return;

    const hasUserKey = !!userKeys[provider];
    if (!hasUserKey && !canMakeRequest()) {
      return 'needs_key';
    }

    const rootIds = Array.from(rootSet);
    setShowBlueprint(true);

    try {
      for (const rootId of rootIds) {
        setBlueprintLoadingRoot(rootId);
        setActiveBlueprintRoot(rootId);

        const subtree = getSubtreeNodes(rootId, currentNodes, currentEdges);
        const allMessages: { role: string; content: string }[] = [];
        subtree.forEach((node: any) => {
          const data = node.data as WorkspaceNodeData;
          if (data.messages.length > 0) {
            allMessages.push({ role: 'system', content: `--- Topic: ${data.title} ---` });
            data.messages.forEach(m => allMessages.push(m));
          }
        });
        if (allMessages.length === 0) {
          allMessages.push({ role: 'user', content: 'Help me plan my capstone project' });
        }

        const rootTitle = (currentNodes.find((n: any) => n.id === rootId)?.data as WorkspaceNodeData)?.title || projectTitle;
        const userApiKey = prepareRequest();

        const evalRes = await checkBudgetAndTrack(
          allMessages,
          () => fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: allMessages, title: rootTitle, provider, userApiKey }),
          })
        );
        const evalData = await evalRes.json();

        const exportRes = await checkBudgetAndTrack(
          allMessages,
          () => fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evaluation: evalData.evaluation, messages: allMessages, provider, userApiKey }),
          })
        );
        const exportData = await exportRes.json();

        setBlueprintData((prev) => ({
          ...prev,
          [rootId]: { markdown: exportData.markdown, schedule: exportData.schedule || [] },
        }));
        setBlueprintLoadingRoot(null);
      }
    } catch (err) {
      console.error('Blueprint generation failed:', err);
      setBlueprintLoadingRoot(null);
      if (activeBlueprintRoot) {
        setBlueprintData((prev) => ({
          ...prev,
          [activeBlueprintRoot]: { markdown: '# Blueprint Generation Failed\n\nPlease try again.', schedule: [] },
        }));
      }
    }
  }, [projectTitle, nodesRef, edgesRef, provider, userKeys, canMakeRequest, prepareRequest, checkBudgetAndTrack]);

  const kickoffNewProject = useCallback(async (
    projectId: string | null,
    initialTitle?: string
  ) => {
    if (!projectId) return;
    const effectiveTitle = initialTitle || projectTitle;

    const hubId = createNewNode(effectiveTitle, null, undefined, 'idea', 'problem');
    setNodes((nds: any[]) =>
      nds.map((node: any) => {
        if (node.id !== hubId) return node;
        return { ...node, data: { ...(node.data as WorkspaceNodeData), isExpanded: true } };
      })
    );
    setLastInteractedNode(hubId);
    setChainTails((prev) => ({ ...prev, [hubId]: null }));

    const userApiKey = prepareRequest();
    const hasUserKey = !!userKeys[provider];

    const kickoffMessages = [
      { role: 'system', content: 'You are CapstoneAI, an expert thesis adviser. You are starting a structured interview with a student.' },
      { role: 'user', content: `I want to create a capstone project: ${effectiveTitle}` },
    ];

    if (!hasUserKey && !canMakeRequest()) {
      setNodes((nds: any[]) =>
        nds.map((node: any) => {
          if (node.id !== hubId) return node;
          return {
            ...node,
            data: { ...(node.data as WorkspaceNodeData), messages: [{ role: 'assistant', content: `Let's design your capstone project: **${effectiveTitle}**\n\nTell me about the problem you want to solve. Who will benefit from this system?\n\n> ⚠️ Configure an API key in the sidebar to enable AI-powered interviews.` }] },
          };
        })
      );
      return;
    }

    try {
      let response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: kickoffMessages, title: effectiveTitle, nodeId: hubId, provider, userApiKey }),
      });

      if (!response.ok) {
        const retryAfter = Number(response.headers.get('retry-after')) || null;
        if (response.status === 429) {
          await new Promise((r) => setTimeout(r, (retryAfter || 3) * 1000));
          response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: kickoffMessages, title: effectiveTitle, nodeId: hubId, provider, userApiKey }),
          });
        }
        if (!response.ok) {
          let message = 'Kickoff failed. Please try again.';
          try { const body = await response.json(); if (body?.error) message = body.error; } catch {}
          if (response.status === 429) message = `Rate limit reached — please retry in ${retryAfter ?? 30}s.`;
          throw new Error(message);
        }
      }

      let fullContent = '';
      for await (const event of readSSEStream(response)) {
        if (event.type === 'error') throw new Error(event.data || 'Stream error');
        if (event.type === 'done') break;
        if (event.type === 'token') fullContent += event.data;
      }

      if (fullContent) {
        if (!hasUserKey) {
          const inputTokens = estimateTokensFromMessages(kickoffMessages);
          const outputTokens = Math.ceil((fullContent.split(/\s+/).filter(Boolean).length) * 1.3);
          consumeTokensBudget(inputTokens, outputTokens);
        }

        const INSTRUCTION_REGEX = /<!--\s*INTERVIEW_INSTRUCTION\s*([\s\S]*?)\s*-->/;
        const match = fullContent.match(INSTRUCTION_REGEX);
        const clean = fullContent.replace(INSTRUCTION_REGEX, '').trim();

        setNodes((nds: any[]) =>
          nds.map((node: any) => {
            if (node.id !== hubId) return node;
            return { ...node, data: { ...(node.data as WorkspaceNodeData), messages: [{ role: 'assistant', content: clean }] } };
          })
        );

        if (match) {
          try {
            const instruction = JSON.parse(match[1]) as InterviewInstruction;
            if (instruction.action === 'create_node' && instruction.nodeTitle) {
              createNewNode(instruction.nodeTitle, instruction.parentNodeId || hubId, instruction.nodeSummary, instruction.nodeType || 'topic', 'system_design');
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Kickoff failed:', err);
      setNodes((nds: any[]) =>
        nds.map((node: any) => {
          if (node.id !== hubId) return node;
          return {
            ...node,
            data: { ...(node.data as WorkspaceNodeData), messages: [{ role: 'assistant', content: `Let's design your capstone project: **${effectiveTitle}**\n\nTell me about the problem you want to solve. Who will benefit from this system?` }] },
          };
        })
      );
    }
  }, [projectTitle, createNewNode, setNodes, setLastInteractedNode, setChainTails, provider, userKeys, canMakeRequest, prepareRequest, consumeTokensBudget]);

  return {
    isSearching, isGrading,
    handleSearchResearch, handleGradeProject, handleNodeCreate,
    handleGenerateBlueprint, kickoffNewProject, prepareRequest,
  };
}
