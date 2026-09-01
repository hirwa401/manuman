const test = require('node:test');
const assert = require('node:assert/strict');

const { validateBookingRequirements } = require('./bookingValidation');

test('rejects a booking when ID, photo, or terms are missing', () => {
  const result = validateBookingRequirements({
    driverLicense: '   ',
    driverLicenseImage: '',
    termsAccepted: false,
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /Driver's license|photo|terms/i);
});

test('accepts a valid booking with an ID, photo, and consent', () => {
  const result = validateBookingRequirements({
    driverLicense: 'D12345678',
    driverLicenseImage: 'https://example.com/license.jpg',
    termsAccepted: true,
  });

  assert.equal(result.ok, true);
});
