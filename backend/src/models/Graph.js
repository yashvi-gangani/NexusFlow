const mongoose = require('mongoose');

const graphSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    edges: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Graph', graphSchema);
