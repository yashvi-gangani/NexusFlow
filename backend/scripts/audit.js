// Mid-review ingestion audit. Run with the API up: npm run audit
// Env: TARGET (writes/sec, default 5000), SECONDS (default 10), BATCH (default 500), API
require('dotenv').config();
const mongoose = require('mongoose');

const API = process.env.API || 'http://127.0.0.1:4000';
const TARGET = Number(process.env.TARGET) || 5000;
const SECONDS = Number(process.env.SECONDS) || 10;
const BATCH = Number(process.env.BATCH) || 500;
const WORKERS = 4;
const sensors = ['turbine-1', 'turbine-2', 'turbine-3', 'turbine-4'];

const batch = () => Array.from({ length: BATCH }, () => ({
  sensorId: sensors[Math.floor(Math.random() * sensors.length)],
  value: 60 + Math.random() * 40, unit: 'C', timestamp: new Date().toISOString(),
}));

async function main() {
  let sent = 0, failed = 0;
  const start = Date.now(), end = start + SECONDS * 1000;
  const worker = async () => {
    while (Date.now() < end) {
      const t0 = Date.now();
      const r = await fetch(`${API}/api/telemetry`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(batch()) });
      r.ok ? (sent += BATCH) : failed++;
      const wait = (BATCH / (TARGET / WORKERS)) * 1000 - (Date.now() - t0);   // pace to target
      if (wait > 0) await new Promise((s) => setTimeout(s, wait));
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));
  const secs = (Date.now() - start) / 1000;
  const rate = Math.round(sent / secs);

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexusflow');
  const s = await mongoose.connection.db.command({ collStats: 'telemetry' });
  const ts = s.timeseries || {};
  const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
  console.log('\n=== NexusFlow ingestion audit ===');
  console.log(`Target:            ${TARGET} writes/sec`);
  console.log(`Achieved:          ${rate} writes/sec (${sent} docs in ${secs.toFixed(1)}s, ${failed} failed requests)`);
  console.log(`Buckets:           ${ts.bucketCount ?? 'n/a'}`);
  console.log(`Uncompressed size: ${mb(s.size)}`);
  console.log(`Storage on disk:   ${mb(s.storageSize)}`);
  console.log(`Result:            ${rate >= TARGET * 0.98 ? 'PASS' : 'BELOW TARGET'}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
