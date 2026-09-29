import { describe, it, expect } from 'vitest';
import { validateBookingRequirements, calculateBookingPricing } from './bookingValidation';

describe('validateBookingRequirements', () => {
  it('rejects a booking when ID or terms are missing', () => {
    const result = validateBookingRequirements({
      driverLicense: '   ',
      termsAccepted: false,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Driver's license|terms/i);
  });

  it('accepts a valid booking with an ID and consent', () => {
    const result = validateBookingRequirements({
      driverLicense: 'D12345678',
      termsAccepted: true,
    });
    expect(result.ok).toBe(true);
  });
});

describe('calculateBookingPricing', () => {
  it('charges delivery fee for custom pickup and gives 10% off stays over 7 days', () => {
    const result = calculateBookingPricing({
      price: 100,
      pickupDate: '2026-09-01',
      returnDate: '2026-09-12',
      pickupIsHQ: false,
    });
    expect(result.ok).toBe(true);
    expect(result.days).toBe(11);
    expect(result.base).toBe(1100);
    expect(result.discount).toBe(110);
    expect(result.deliveryFee).toBe(100);
    expect(result.total).toBe(1090);
  });

  it('has no delivery fee for headquarters pickup', () => {
    const result = calculateBookingPricing({
      price: 100,
      pickupDate: '2026-09-01',
      returnDate: '2026-09-02',
      pickupIsHQ: true,
    });
    expect(result.ok).toBe(true);
    expect(result.deliveryFee).toBe(0);
    expect(result.total).toBe(100);
  });

  it('rejects an inverted date range', () => {
    const result = calculateBookingPricing({
      price: 100,
      pickupDate: '2026-09-10',
      returnDate: '2026-09-01',
      pickupIsHQ: true,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/after pick-up/i);
  });
});
