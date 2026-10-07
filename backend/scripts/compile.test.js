// Offline compiler test (no MongoDB needed): npm test
const assert = require('assert');
const { Subject } = require('rxjs');
const { validateGraph, compileGraph } = require('../src/compiler/compile');

const graph = {
  nodes: [
    { id: 'a', type: 'sensor', data: { sensorId: 't1' } },
    { id: 'b', type: 'movingAverage', data: { window: 3 } },
    { id: 'c', type: 'threshold', data: { operator: '>', value: 80 } },
    { id: 'd', type: 'smsAlert', data: { phone: '+910000000000', message: 'Hot: {value}' } },
  ],
  edges: [{ id: 'e1', source: 'a', target: 'b' }, { id: 'e2', source: 'b', target: 'c' }, { id: 'e3', source: 'c', target: 'd' }],
};
assert.deepStrictEqual(validateGraph(graph), []);

const src = new Subject(), alerts = [];
const sub = compileGraph(graph, src, (a) => alerts.push(a));
[70, 75, 79, 90, 95, 100].forEach((v) => src.next({ sensorId: 't1', value: v }));
src.next({ sensorId: 'other', value: 999 });
sub.unsubscribe();
// 3-reading averages: 74.67, 81.33, 88, 95 -> three exceed 80
assert.strictEqual(alerts.length, 3);
assert.ok(alerts[0].message.startsWith('Hot: 81'));

const cyc = { nodes: graph.nodes, edges: [...graph.edges, { id: 'e4', source: 'd', target: 'a' }] };
assert.ok(validateGraph(cyc).length > 0);
console.log('compiler tests passed');
