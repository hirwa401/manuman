function validateBookingRequirements({ driverLicense, driverLicenseImage, termsAccepted }) {
  const cleanLicense = (driverLicense || '').trim();
  const cleanLicenseImage = typeof driverLicenseImage === 'string'
    ? driverLicenseImage.trim()
    : !!driverLicenseImage;

  if (!cleanLicense) {
    return {
      ok: false,
      message: "Driver's license or ID number is required before booking.",
    };
  }

  if (!cleanLicenseImage) {
    return {
      ok: false,
      message: "A clear photo of your driver's license is required before booking.",
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
