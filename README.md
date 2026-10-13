# NexusFlow - Visual IoT Telemetry (group project)

Scope delivered: Week 1, Week 2 and Mid-Project Review deliverables.

| Plan item | Where |
|---|---|
| W1 MongoDB Time-Series collection | `backend/src/models/Telemetry.js` |
| W1 High-speed Express ingestion | `backend/src/routes/ingest.js` |
| W1 React app + React Flow canvas | `frontend/src/App.jsx` |
| W2 Logic compiler (JSON graph -> RxJS) | `backend/src/compiler/compile.js` |
| W2 Node library (Data Source, Math, Action) | `frontend/src/nodeDefs.js`, `FlowNode.jsx` |
| Review: 5,000 writes/sec + storage footprint | `backend/scripts/audit.js` |
| Review: graph serialization to valid JSON | `frontend/src/serialize.js`, `POST /api/graphs/validate` |

## Run
Requires Node 18+ and MongoDB 5.0+ (local or Atlas).

```bash
# backend
cd backend && cp .env.example .env && npm install && npm run dev      # :4000
# frontend (new terminal)
cd frontend && npm install && npm run dev                              # :5173
```

## API
- `POST /api/telemetry` - one reading or an array `{sensorId, value, unit?, timestamp?}`
- `GET  /api/telemetry/:sensorId?limit=100` - latest readings
- `POST /api/graphs/validate` - validate + compile a graph (returns execution plan)
- `POST /api/graphs/dry-run` - `{graph, readings:[{sensorId,value}]}` -> alerts the graph would fire
- `POST /api/graphs`, `GET /api/graphs`, `GET /api/graphs/:id` - persist graphs
- `WS  /ws` - live telemetry broadcast channel (live rule execution arrives in Week 3)

## Mid-review audit (5,000 writes/sec)
With the backend running: `cd backend && npm run audit`
Prints achieved writes/sec and the time-series collection's storage size vs. raw data size.
Offline compiler test (no MongoDB needed): `cd backend && npm test`

## Graph JSON contract
```json
{"nodes":[{"id":"n1","type":"sensor","data":{"sensorId":"turbine-1"},"position":{"x":0,"y":0}}],
 "edges":[{"id":"e1","source":"n1","target":"n2"}]}
```
Node types: `sensor`, `movingAverage {window}`, `math {op,value}`, `threshold {operator,value}`, `smsAlert {phone,message}`.
