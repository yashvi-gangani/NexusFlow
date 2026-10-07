const express = require('express');
const Telemetry = require('../models/Telemetry');

const router = express.Router();
const MAX_BATCH = 5000;

function toDoc(r) {
  const value = Number(r.value);
  if (!r.sensorId || typeof r.sensorId !== 'string' || !Number.isFinite(value)) return null;
  const ts = r.timestamp ? new Date(r.timestamp) : new Date();
  if (Number.isNaN(ts.getTime())) return null;
  return { timestamp: ts, meta: { sensorId: r.sensorId, unit: r.unit || 'unitless' }, value };
}

// Accepts one reading or an array. Batched, unordered insert = max throughput.
router.post('/', async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];
  if (items.length === 0 || items.length > MAX_BATCH)
    return res.status(400).json({ error: `Send between 1 and ${MAX_BATCH} readings per request` });

  const docs = [];
  let rejected = 0;
  for (const it of items) {
    const d = toDoc(it || {});
    d ? docs.push(d) : rejected++;
  }
  try {
    if (docs.length) await Telemetry.insertMany(docs, { ordered: false, lean: true, rawResult: true });
    // Week 3 hook: compiled RxJS pipelines subscribe to this bus.
    const bus = req.app.get('telemetry$');
    if (bus) docs.forEach((d) => bus.next({ sensorId: d.meta.sensorId, value: d.value, timestamp: d.timestamp }));
    res.status(202).json({ accepted: docs.length, rejected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:sensorId', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 1000);
  const rows = await Telemetry.find({ 'meta.sensorId': req.params.sensorId })
    .sort({ timestamp: -1 }).limit(limit).lean();
  res.json(rows);
});

module.exports = router;
