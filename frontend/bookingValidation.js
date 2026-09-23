// Pure validation helper: returning data instead of touching the DOM makes this easy to test.
function validateBookingRequirements({ driverLicense, termsAccepted }) {
  const cleanLicense = (driverLicense || '').trim();

  if (!cleanLicense) {
    return {
      ok: false,
      message: "Driver's license or ID number is required before booking.",
    };
  }

  if (!termsAccepted) {
    return {
      ok: false,
      message: 'You must agree to the terms and conditions before booking.',
    };
  }

  return { ok: true };
}

if (typeof module !== 'undefined') {
  module.exports = { validateBookingRequirements };
}
