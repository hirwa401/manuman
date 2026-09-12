const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('./frontend/index.html', 'utf8');
const appJs = fs.readFileSync('./frontend/app.js', 'utf8');

test('continue-to-payment button is wired to the payment action', () => {
  assert.match(html, /id="continueToPaymentBtn"/);
  assert.match(
    appJs,
    /continueToPaymentBtn.*goToPayment|goToPayment.*continueToPaymentBtn|addEventListener\(\s*['"]click['"]\s*,\s*goToPayment/
  );
});
