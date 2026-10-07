import { Handle, Position, useReactFlow } from 'reactflow';
import { NODE_DEFS } from './nodeDefs.js';

export default function FlowNode({ id, type, data }) {
  const def = NODE_DEFS[type];
  const { setNodes } = useReactFlow();
  const update = (key, value) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, [key]: value } } : n)));

  return (
    <div className={`fnode ${def.kind}`}>
      {def.kind !== 'source' && <Handle type="target" position={Position.Left} />}
      <div className="fnode-title">{def.title}</div>
      {def.fields.map((f) => (
        <label key={f.key} className="fnode-field">
          <span>{f.label}</span>
          {f.type === 'select' ? (
            <select className="nodrag" value={data[f.key]} onChange={(e) => update(f.key, e.target.value)}>
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input className="nodrag" type={f.type} value={data[f.key] ?? ''}
              onChange={(e) => update(f.key, e.target.value)} />
          )}
        </label>
      ))}
      {def.kind !== 'sink' && <Handle type="source" position={Position.Right} />}
    </div>
  );
}
