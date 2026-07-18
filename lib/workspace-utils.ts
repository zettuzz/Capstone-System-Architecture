import type { WorkspaceNodeData } from '@/types';

export function stripCallbacks(node: Record<string, unknown>): Record<string, unknown> {
  if (!node.data || typeof node.data !== 'object') return node;
  const data = { ...node.data as Record<string, unknown> };
  for (const key of ['onToggleExpand', 'onAddMessage', 'onSuggestNode', 'onNodeCreate', 'onDeleteSubtree', 'onUndoNode'] as const) {
    delete data[key];
  }
  return { ...node, data };
}

export function findRootIdea(nodeId: string | null, allNodes: any[], allEdges: any[]): string | null {
  if (!nodeId) return null;
  const node = allNodes.find((n: any) => n.id === nodeId);
  if (node && (node.data as WorkspaceNodeData).nodeType === 'idea') return nodeId;
  const incomingEdge = allEdges.find((e: any) => e.target === nodeId);
  if (!incomingEdge) return nodeId;
  return findRootIdea(incomingEdge.source, allNodes, allEdges);
}

export function getNodeDepth(nodeId: string | null, allNodes: any[], allEdges: any[]): number {
  if (!nodeId) return 0;
  let depth = 0;
  let current = nodeId;
  while (true) {
    const incomingEdge = allEdges.find((e: any) => e.target === current);
    if (!incomingEdge) break;
    current = incomingEdge.source;
    depth++;
  }
  return depth;
}

export function findChainTail(rootId: string, allEdges: any[]): string | null {
  const children = allEdges.filter((e: any) => e.source === rootId);
  if (children.length === 0) return null;
  let tail = rootId;
  while (true) {
    const nextEdges = allEdges.filter((e: any) => e.source === tail);
    if (nextEdges.length === 0) break;
    tail = nextEdges[nextEdges.length - 1].target;
  }
  return tail;
}

export function getSubtreeNodes(rootId: string, allNodes: any[], allEdges: any[]): any[] {
  const result: any[] = [];
  const visited = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const node = allNodes.find((n: any) => n.id === curr);
    if (node) result.push(node);
    const children = allEdges.filter((e: any) => e.source === curr);
    for (const child of children) {
      if (!visited.has(child.target)) queue.push(child.target);
    }
  }
  return result;
}

const LAYOUT_COL_GAP = 300;
const LAYOUT_ROW_GAP = 200;
const LAYOUT_BAND_GAP = 400;

export function computeAutoLayout(allNodes: any[], allEdges: any[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  const outgoing = new Map<string, string[]>();
  const incoming = new Set<string>();
  for (const n of allNodes) outgoing.set(n.id, []);
  for (const e of allEdges) {
    if (outgoing.has(e.source)) outgoing.get(e.source)!.push(e.target);
    incoming.add(e.target);
  }

  const isIdea = (n: any) => (n.data as WorkspaceNodeData)?.nodeType === 'idea';

  let roots = allNodes.filter((n) => isIdea(n) && !incoming.has(n.id));
  if (roots.length === 0) {
    roots = allNodes.filter((n) => !incoming.has(n.id));
  }

  const nodeRoot = new Map<string, number>();

  let bandIndex = 0;
  for (let r = 0; r < roots.length; r++) {
    const root = roots[r];
    const reachable = getSubtreeNodes(root.id, allNodes, allEdges);
    const reachableIds = new Set(reachable.map((n: any) => n.id));
    reachable.forEach((n: any) => nodeRoot.set(n.id, r));

    const rowOf = new Map<string, number>();
    let bandRow = 0;
    const queue: { id: string; depth: number }[] = [{ id: root.id, depth: 0 }];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const { id } = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      rowOf.set(id, bandRow);
      bandRow += 1;
      const children = (outgoing.get(id) || []).filter((c) => reachableIds.has(c));
      children.forEach((childId) => {
        if (!seen.has(childId)) queue.push({ id: childId, depth: 0 });
      });
    }

    reachable.forEach((n: any) => {
      const depth = computeDepth(n.id, root.id, outgoing);
      positions[n.id] = {
        x: depth * LAYOUT_COL_GAP,
        y: bandIndex * LAYOUT_BAND_GAP + (rowOf.get(n.id) || 0) * LAYOUT_ROW_GAP,
      };
    });

    bandIndex += 1;
  }

  let orphanRow = 0;
  for (const n of allNodes) {
    if (nodeRoot.has(n.id) || positions[n.id]) continue;
    positions[n.id] = {
      x: 0,
      y: bandIndex * LAYOUT_BAND_GAP + orphanRow * LAYOUT_ROW_GAP,
    };
    orphanRow += 1;
  }

  return positions;
}

function computeDepth(
  id: string,
  rootId: string,
  outgoing: Map<string, string[]>
): number {
  if (id === rootId) return 0;
  const visited = new Set<string>([rootId]);
  const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];
  while (queue.length > 0) {
    const { id: curr, depth } = queue.shift()!;
    for (const child of outgoing.get(curr) || []) {
      if (visited.has(child)) continue;
      visited.add(child);
      if (child === id) return depth + 1;
      queue.push({ id: child, depth: depth + 1 });
    }
  }
  return 1;
}
