import { NODE_DEFS } from './nodeDefs.js';

// Canvas state -> the JSON contract the backend compiler consumes.
export function serializeGraph(nodes, edges) {
  return {
    nodes: nodes.map((n) => {
      const data = {};
      for (const f of NODE_DEFS[n.type].fields) {
        const raw = n.data?.[f.key];
        data[f.key] = f.type === 'number' && raw !== '' && raw != null ? Number(raw) : raw;
      }
      return { id: n.id, type: n.type, data, position: { x: Math.round(n.position.x), y: Math.round(n.position.y) } };
    }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
}

// JSON -> canvas state (for loading a saved graph).
export function deserializeGraph(graph) {
  return {
    nodes: graph.nodes.map((n) => ({ id: n.id, type: n.type, position: n.position || { x: 0, y: 0 }, data: n.data })),
    edges: graph.edges.map((e) => ({ ...e, animated: true })),
  };
}
