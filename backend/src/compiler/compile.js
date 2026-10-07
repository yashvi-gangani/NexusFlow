/**
 * Stream compiler: React Flow JSON graph -> RxJS Observables.
 * validateGraph() checks structure; buildPlan() returns a readable execution plan;
 * compileGraph() wires real Observables to a source stream and an alert callback.
 */
const { merge, EMPTY } = require('rxjs');
const { filter, map, tap, scan } = require('rxjs/operators');

const MATH = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b };
const CMP = {
  '>': (a, b) => a > b, '>=': (a, b) => a >= b, '<': (a, b) => a < b,
  '<=': (a, b) => a <= b, '==': (a, b) => a === b, '!=': (a, b) => a !== b,
};
const SOURCES = ['sensor'];
const SINKS = ['smsAlert'];
const KNOWN = [...SOURCES, 'movingAverage', 'math', 'threshold', ...SINKS];

function validateGraph(graph) {
  const errors = [];
  const nodes = Array.isArray(graph && graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph && graph.edges) ? graph.edges : [];
  if (!nodes.length) return ['Graph has no nodes'];

  const byId = new Map();
  for (const n of nodes) {
    if (!n.id) errors.push('A node is missing its id');
    else if (byId.has(n.id)) errors.push(`Duplicate node id "${n.id}"`);
    else byId.set(n.id, n);
    if (!KNOWN.includes(n.type)) errors.push(`Node "${n.id}" has unknown type "${n.type}"`);
  }
  const incoming = new Map(), outgoing = new Map();
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) { errors.push(`Edge "${e.id}" points to a missing node`); continue; }
    incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
    outgoing.set(e.source, (outgoing.get(e.source) || 0) + 1);
  }
  for (const n of byId.values()) {
    const d = n.data || {};
    if (SOURCES.includes(n.type)) {
      if (!d.sensorId) errors.push(`Sensor node "${n.id}" needs a sensor ID`);
      if (incoming.get(n.id)) errors.push(`Sensor node "${n.id}" cannot have inputs`);
    } else if (!incoming.get(n.id)) errors.push(`Node "${n.id}" (${n.type}) has no input connection`);
    if (SINKS.includes(n.type) && outgoing.get(n.id)) errors.push(`Action node "${n.id}" cannot have outputs`);
    if (n.type === 'movingAverage' && !(Number(d.window) >= 1)) errors.push(`Moving average "${n.id}" needs a window of at least 1`);
    if (n.type === 'math' && (!MATH[d.op] || !Number.isFinite(Number(d.value)))) errors.push(`Math node "${n.id}" needs an operation and a number`);
    if (n.type === 'threshold' && (!CMP[d.operator] || !Number.isFinite(Number(d.value)))) errors.push(`Threshold node "${n.id}" needs a comparison and a number`);
  }
  // Cycle detection (Kahn's algorithm)
  const indeg = new Map([...byId.keys()].map((k) => [k, incoming.get(k) || 0]));
  const queue = [...indeg].filter(([, v]) => v === 0).map(([k]) => k);
  let seen = 0;
  while (queue.length) {
    const id = queue.shift(); seen++;
    for (const e of edges) if (e.source === id && indeg.has(e.target)) {
      indeg.set(e.target, indeg.get(e.target) - 1);
      if (indeg.get(e.target) === 0) queue.push(e.target);
    }
  }
  if (seen !== byId.size) errors.push('Graph contains a cycle; connections must flow one way');
  if (!nodes.some((n) => SINKS.includes(n.type))) errors.push('Add at least one action node so the rule can do something');
  return errors;
}

function buildPlan(graph) {
  const edges = graph.edges || [];
  const label = (n) => ({
    sensor: `sensor(${n.data.sensorId})`, movingAverage: `movingAverage(${n.data.window})`,
    math: `math(${n.data.op} ${n.data.value})`, threshold: `threshold(${n.data.operator} ${n.data.value})`,
    smsAlert: `smsAlert(${n.data.phone || 'no number'})`,
  }[n.type]);
  return graph.nodes.map((n) => ({ id: n.id, step: label(n), inputs: edges.filter((e) => e.target === n.id).map((e) => e.source) }));
}

/** Returns an rxjs Subscription; unsubscribe() tears the whole pipeline down. */
function compileGraph(graph, source$, onAlert) {
  const errors = validateGraph(graph);
  if (errors.length) throw Object.assign(new Error('Invalid graph'), { details: errors });

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const memo = new Map();

  const stream = (id) => {
    if (memo.has(id)) return memo.get(id);
    const n = byId.get(id), d = n.data || {};
    let out$;
    if (n.type === 'sensor') {
      out$ = source$.pipe(filter((r) => r.sensorId === d.sensorId), map((r) => r.value));
    } else {
      const ins = graph.edges.filter((e) => e.target === id).map((e) => stream(e.source));
      const in$ = ins.length > 1 ? merge(...ins) : ins[0] || EMPTY;
      if (n.type === 'movingAverage') {
        const w = Math.floor(Number(d.window));
        out$ = in$.pipe(
          scan((buf, v) => [...buf, v].slice(-w), []),
          filter((buf) => buf.length === w),
          map((buf) => buf.reduce((a, b) => a + b, 0) / w));
      } else if (n.type === 'math') {
        out$ = in$.pipe(map((v) => MATH[d.op](v, Number(d.value))));
      } else if (n.type === 'threshold') {
        out$ = in$.pipe(filter((v) => CMP[d.operator](v, Number(d.value))));
      } else if (n.type === 'smsAlert') {
        out$ = in$.pipe(tap((v) => onAlert({
          nodeId: id, type: 'sms', to: d.phone, value: v,
          message: (d.message || 'Rule triggered: {value}').replace('{value}', Number(v).toFixed(2)), at: new Date(),
        })));
      }
    }
    memo.set(id, out$);
    return out$;
  };

  const sinks = graph.nodes.filter((n) => SINKS.includes(n.type)).map((n) => stream(n.id));
  return merge(...sinks).subscribe();
}

module.exports = { validateGraph, buildPlan, compileGraph };
