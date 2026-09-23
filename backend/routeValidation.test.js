const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const serverJs = fs.readFileSync('./backend/server.js', 'utf8');
const apiIndexJs = fs.readFileSync('./backend/api/index.js', 'utf8');

test('local backend and Vercel use the same API application', () => {
  assert.match(serverJs, /require\(['"]\.\/api\/index['"]\)/);
  assert.match(apiIndexJs, /app\.get\(['"]\/api\/bookings\/mine['"]/);
});

test('local backend exposes a ping endpoint', () => {
  assert.match(apiIndexJs, /app\.get\(['"]\/api\/ping['"]/);
});

test('local backend exposes a root endpoint for the deployment base URL', () => {
  assert.match(apiIndexJs, /app\.get\(['"]\/['"]/);
});

test('become-host route preserves customer role until approval', () => {
  assert.match(apiIndexJs, /upsert\s*\(|become-host.*upsert|profiles.*upsert/i);
  assert.match(apiIndexJs, /role: 'customer'/);
});

test('host conversion creates a pending request instead of granting immediate access', () => {
  assert.match(apiIndexJs, /host_requests/);
  assert.match(apiIndexJs, /pending/);
  assert.match(apiIndexJs, /driverLicense/);
  assert.match(apiIndexJs, /termsAccepted/);
});

test('host approval endpoints require admin access', () => {
  assert.match(apiIndexJs, /host-requests.*requireAdmin/);
});

test('fleet host migration adds the host listing approval columns', () => {
  const migration = fs.readFileSync('./backend/fleet_host_migration.sql', 'utf8');
  assert.match(migration, /add column if not exists host_id/i);
  assert.match(migration, /add column if not exists approved/i);
});

test('become-host route explains when the profiles table is missing', () => {
  assert.match(apiIndexJs, /profiles table|schema cache|supabase_setup\.sql|Database setup incomplete/i);
});

test('admin-only API routes require a signed admin token', () => {
  assert.match(apiIndexJs, /x-admin-token/);
  assert.match(apiIndexJs, /app\.get\(['"]\/api\/bookings['"], requireAdmin/);
  assert.match(apiIndexJs, /app\.post\(['"]\/api\/fleet['"], requireAdmin/);
  assert.match(apiIndexJs, /app\.get\(['"]\/api\/contacts['"], requireAdmin/);
});

test('payment routes report missing Stripe configuration and keep useful client errors', () => {
  assert.match(apiIndexJs, /STRIPE_WEBHOOK_SECRET/);
  assert.match(apiIndexJs, /Card payments are temporarily unavailable/);
  const paymentJs = fs.readFileSync('./frontend/payment.js', 'utf8');
  assert.match(paymentJs, /server returned \$\{res\.status\}/);
  assert.match(paymentJs, /e\.message/);
});
