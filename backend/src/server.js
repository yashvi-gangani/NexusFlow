require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const { Subject } = require('rxjs');
const Telemetry = require('./models/Telemetry');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const telemetry$ = new Subject();           // in-memory bus; Week 3 attaches compiled pipelines here
app.set('telemetry$', telemetry$);

app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use('/api/telemetry', require('./routes/ingest'));
app.use('/api/graphs', require('./routes/graphs'));
app.use((err, _req, res, _next) => res.status(500).json({ error: err.message }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
telemetry$.subscribe((r) => {
  if (!wss.clients.size) return;
  const msg = JSON.stringify({ kind: 'telemetry', ...r });
  wss.clients.forEach((c) => c.readyState === 1 && c.send(msg));
});

async function start() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexusflow');
  await Telemetry.createCollection().catch((e) => { if (e.codeName !== 'NamespaceExists') throw e; });
  await Telemetry.syncIndexes();
  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`NexusFlow API on :${port}`));
}
start().catch((e) => { console.error(e); process.exit(1); });
