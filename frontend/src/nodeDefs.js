// Node library. `kind` decides handles + colour; `fields` drive the inline editor.
export const NODE_DEFS = {
  sensor: {
    kind: 'source', title: 'Turbine sensor', group: 'Data sources',
    defaults: { sensorId: 'turbine-1' },
    fields: [{ key: 'sensorId', label: 'Sensor ID', type: 'text' }],
  },
  movingAverage: {
    kind: 'filter', title: 'Moving average', group: 'Math operations',
    defaults: { window: 5 },
    fields: [{ key: 'window', label: 'Window (readings)', type: 'number' }],
  },
  math: {
    kind: 'filter', title: 'Math', group: 'Math operations',
    defaults: { op: 'add', value: 0 },
    fields: [
      { key: 'op', label: 'Operation', type: 'select', options: ['add', 'sub', 'mul', 'div'] },
      { key: 'value', label: 'Value', type: 'number' },
    ],
  },
  threshold: {
    kind: 'filter', title: 'Threshold', group: 'Math operations',
    defaults: { operator: '>', value: 80 },
    fields: [
      { key: 'operator', label: 'Pass when', type: 'select', options: ['>', '>=', '<', '<=', '==', '!='] },
      { key: 'value', label: 'Value', type: 'number' },
    ],
  },
  smsAlert: {
    kind: 'sink', title: 'SMS alert', group: 'Action triggers',
    defaults: { phone: '', message: 'Turbine reading is {value}' },
    fields: [
      { key: 'phone', label: 'Phone number', type: 'text' },
      { key: 'message', label: 'Message', type: 'text' },
    ],
  },
};
