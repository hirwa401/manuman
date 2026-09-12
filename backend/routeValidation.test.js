const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const serverJs = fs.readFileSync('./backend/server.js', 'utf8');
const apiIndexJs = fs.readFileSync('./backend/api/index.js', 'utf8');

test('local backend exposes the user bookings route', () => {
  assert.match(serverJs, /app\.get\(['"]\/api\/bookings\/mine['"]/);
});

test('local backend exposes a ping endpoint', () => {
  assert.match(serverJs, /app\.get\(['"]\/api\/ping['"]/);
  assert.match(apiIndexJs, /app\.get\(['"]\/api\/ping['"]/);
});

test('local backend exposes a root endpoint for the deployment base URL', () => {
  assert.match(serverJs, /app\.get\(['"]\/['"]/);
});

test('become-host route preserves customer role until approval', () => {
  assert.match(serverJs, /upsert\s*\(|become-host.*upsert|profiles.*upsert/i);
  assert.match(serverJs, /role: 'customer'/);
});

test('host conversion creates a pending request instead of granting immediate access', () => {
  assert.match(serverJs, /host_requests/);
  assert.match(serverJs, /pending/);
  assert.match(serverJs, /driverLicense/);
  assert.match(serverJs, /termsAccepted/);
});

test('host approval endpoints require admin access', () => {
  assert.match(serverJs, /host-requests.*requireAdmin/);
  assert.match(apiIndexJs, /host-requests.*requireAdmin/);
});

test('become-host route explains when the profiles table is missing', () => {
  assert.match(serverJs, /profiles table|schema cache|supabase_setup\.sql|Database setup incomplete/i);
});
