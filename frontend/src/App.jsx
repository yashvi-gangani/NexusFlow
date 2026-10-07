import { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import FlowNode from './FlowNode.jsx';
import { NODE_DEFS } from './nodeDefs.js';
import { serializeGraph } from './serialize.js';

let seq = 1;
const groups = Object.entries(NODE_DEFS).reduce((acc, [type, d]) => ((acc[d.group] ||= []).push(type), acc), {});

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [name, setName] = useState('Turbine overheat rule');
  const [status, setStatus] = useState(null);   // { ok, lines[] }
  const { screenToFlowPosition } = useReactFlow();
  const nodeTypes = useMemo(() => Object.fromEntries(Object.keys(NODE_DEFS).map((t) => [t, FlowNode])), []);
  const graph = useMemo(() => serializeGraph(nodes, edges), [nodes, edges]);

  const onConnect = useCallback((c) => setEdges((es) => addEdge({ ...c, animated: true }, es)), [setEdges]);
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/nexusflow');
    if (!NODE_DEFS[type]) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes((ns) => ns.concat({ id: `n${seq++}`, type, position, data: { ...NODE_DEFS[type].defaults } }));
  };

  const call = async (path, body) => {
    try {
      const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      return { ok: r.ok, body: await r.json() };
    } catch { return { ok: false, body: { errors: ['Cannot reach the API. Is the backend running on port 4000?'] } }; }
  };
  const validate = async () => {
    const { ok, body } = await call('/api/graphs/validate', graph);
    setStatus(ok
      ? { ok, lines: body.plan.map((p) => `${p.id}: ${p.step}${p.inputs.length ? `  <- ${p.inputs.join(', ')}` : ''}`) }
      : { ok, lines: body.errors || [body.error] });
  };
  const save = async () => {
    const { ok, body } = await call('/api/graphs', { name, ...graph });
    setStatus(ok ? { ok, lines: [`Saved "${name}"`] } : { ok, lines: body.errors || [body.error] });
  };

  return (
    <div className="app">
      <aside className="palette">
        <h1>NexusFlow</h1>
        <p className="hint">Drag blocks onto the canvas, then wire output to input.</p>
        {Object.entries(groups).map(([g, types]) => (
          <section key={g}>
            <h2>{g}</h2>
            {types.map((t) => (
              <div key={t} className={`chip ${NODE_DEFS[t].kind}`} draggable
                onDragStart={(e) => e.dataTransfer.setData('application/nexusflow', t)}>{NODE_DEFS[t].title}</div>
            ))}
          </section>
        ))}
      </aside>

      <main className="canvas">
        <div className="toolbar">
          <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Rule name" />
          <button onClick={validate} disabled={!nodes.length}>Check rule</button>
          <button className="primary" onClick={save} disabled={!nodes.length}>Save rule</button>
        </div>
        {!nodes.length && <div className="empty">Start with a Turbine sensor block from the left.</div>}
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange} onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver}
          fitView deleteKeyCode={['Backspace', 'Delete']}>
          <Background gap={24} color="#c5ced6" />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </main>

      <aside className="json">
        <h2>Result</h2>
        {status && <ul className={status.ok ? 'ok' : 'bad'}>{status.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
        <h2>Graph JSON</h2>
        <pre>{JSON.stringify(graph, null, 2)}</pre>
      </aside>
    </div>
  );
}
