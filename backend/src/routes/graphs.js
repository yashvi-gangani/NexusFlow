const express = require('express');
const { Subject } = require('rxjs');
const Graph = require('../models/Graph');
const { validateGraph, buildPlan, compileGraph } = require('../compiler/compile');

const router = express.Router();

router.post('/validate', (req, res) => {
  const errors = validateGraph(req.body);
  if (errors.length) return res.status(422).json({ valid: false, errors });
  res.json({ valid: true, plan: buildPlan(req.body) });
});

// Runs a graph against sample readings in memory - proves the compiled streams execute.
router.post('/dry-run', (req, res) => {
  const { graph, readings } = req.body || {};
  const errors = validateGraph(graph);
  if (errors.length) return res.status(422).json({ valid: false, errors });
  if (!Array.isArray(readings)) return res.status(400).json({ error: 'readings must be an array' });
  const source$ = new Subject(), alerts = [];
  const sub = compileGraph(graph, source$, (a) => alerts.push(a));
  readings.forEach((r) => source$.next(r));
  sub.unsubscribe();
  res.json({ alerts });
});

router.post('/', async (req, res) => {
  const { name, nodes, edges } = req.body || {};
  const errors = validateGraph({ nodes, edges });
  if (!name) errors.unshift('Give the graph a name');
  if (errors.length) return res.status(422).json({ errors });
  res.status(201).json(await Graph.create({ name, nodes, edges }));
});

router.get('/', async (_req, res) => res.json(await Graph.find({}, 'name updatedAt').sort({ updatedAt: -1 }).lean()));
router.get('/:id', async (req, res) => {
  const g = await Graph.findById(req.params.id).lean().catch(() => null);
  g ? res.json(g) : res.status(404).json({ error: 'Graph not found' });
});

module.exports = router;
