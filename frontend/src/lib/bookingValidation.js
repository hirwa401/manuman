// Pure validation helper: returning data instead of touching the DOM makes this easy to test.
export function validateBookingRequirements({ driverLicense, termsAccepted }) {
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

// Pricing mirrors the backend calculation in calculateBookingTotal.
export function calculateBookingPricing({ price, pickupDate, returnDate, pickupIsHQ }) {
  const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000);
  if (!Number.isInteger(days) || days <= 0) {
    return { ok: false, message: 'Return date must be after pick-up date.' };
  }
  const base = days * Number(price);
  const discount = days > 7 ? Math.round(base * 0.1) : 0;
  const deliveryFee = pickupIsHQ ? 0 : 100;
  const total = base - discount + deliveryFee;
  return { ok: true, days, base, discount, deliveryFee, total };
}
