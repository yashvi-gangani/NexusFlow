const mongoose = require('mongoose');

// Native MongoDB 5.0+ time-series collection: append-only, bucketed & compressed.
const telemetrySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },          // timeField
    meta: {                                              // metaField (low-cardinality, drives bucketing)
      sensorId: { type: String, required: true },
      unit: { type: String, default: 'unitless' },
    },
    value: { type: Number, required: true },
  },
  {
    versionKey: false,
    autoIndex: false,
    timeseries: { timeField: 'timestamp', metaField: 'meta', granularity: 'seconds' },
  }
);

// Query pattern: latest readings for one sensor.
telemetrySchema.index({ 'meta.sensorId': 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema, 'telemetry');
