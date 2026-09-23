// These tests document the booking rules and protect them from accidental UI changes.
const test = require('node:test');
const assert = require('node:assert/strict');

const { validateBookingRequirements } = require('./bookingValidation');

test('rejects a booking when ID or terms are missing', () => {
  const result = validateBookingRequirements({
    driverLicense: '   ',
    termsAccepted: false,
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /Driver's license|photo|terms/i);
});

test('accepts a valid booking with an ID and consent', () => {
  const result = validateBookingRequirements({
    driverLicense: 'D12345678',
    termsAccepted: true,
  });

  assert.equal(result.ok, true);
});
