const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const serverJs = fs.readFileSync('./backend/server.js', 'utf8');

test('local backend exposes the user bookings route', () => {
  assert.match(serverJs, /app\.get\(['"]\/api\/bookings\/mine['"]/);
});

test('local backend exposes a ping endpoint', () => {
  assert.match(serverJs, /app\.get\(['"]\/api\/ping['"]/);
});
