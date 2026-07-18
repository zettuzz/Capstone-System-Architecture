'use client';

import { useCallback, useRef, useEffect } from 'react';
import { stripCallbacks } from '@/lib/workspace-utils';

export function useWorkspaceSave(
  projectId: string | null,
  nodesRef: React.MutableRefObject<any[]>,
  edgesRef: React.MutableRefObject<any[]>,
  nodes: any[],
  edges: any[]
) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveToServer = useCallback(async () => {
    if (!projectId) return;
    const cleanNodes = nodesRef.current.map(n => stripCallbacks({ ...n }));
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: cleanNodes, edges: edgesRef.current }),
      });
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [projectId, nodesRef, edgesRef]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveToServer, 3000);
  }, [saveToServer]);

  useEffect(() => {
    if (!projectId || nodes.length === 0) return;
    scheduleSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, projectId, scheduleSave]);

  return { saveToServer };
}
