import { useEffect, useState } from 'react';
import Modal from './Modal';
import AvailabilityCalendar from './AvailabilityCalendar';
import TermsPolicy from './TermsPolicy';
import { apiFetch } from '../lib/api';
import { validateBookingRequirements, calculateBookingPricing } from '../lib/bookingValidation';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMG = '/images/fleet-card.png';

// Step 1 booking modal on the home page: dates + details, then hands off to
// Stripe Identity verification before the payment page.
export default function BookingModal({ open, onClose, car }) {
  const { user } = useAuth();
  const [pickupIsHQ, setPickupIsHQ] = useState(true);
  const [pickup, setPickup] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !car) return undefined;
    // Reset the form each time the modal opens for a car.
    setPickupIsHQ(true);
    setPickup('');
    setPickupDate('');
    setReturnDate('');
    setName(user?.user_metadata?.full_name || '');
    setEmail(user?.email || '');
    setPhone('');
    setDriverLicense('');
    setTermsAccepted(false);
    setShowTerms(false);
    setError('');
    setBookedRanges([]);
    let cancelled = false;
    apiFetch(`/bookings/availability/${car.id}`)
      .then((data) => { if (!cancelled) setBookedRanges(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, car, user]);

  if (!car) return null;

  const pricing = pickupDate && returnDate
    ? calculateBookingPricing({ price: car.price, pickupDate, returnDate, pickupIsHQ })
    : null;

  const pickDate = (dateStr) => {
    if (!pickupDate || (pickupDate && returnDate)) {
      setPickupDate(dateStr);
      setReturnDate('');
    } else if (dateStr <= pickupDate) {
      setPickupDate(dateStr);
      setReturnDate('');
    } else {
      setReturnDate(dateStr);
    }
  };

  const goToPayment = async () => {
    setError('');
    const pickupValue = pickupIsHQ ? 'Headquarters' : pickup.trim();
    if (!pickupIsHQ && !pickupValue) { setError('Please enter a delivery address.'); return; }
    if (!pickupDate) { setError('Please select a pick-up date.'); return; }
    if (!returnDate) { setError('Please select a return date.'); return; }
    if (returnDate <= pickupDate) { setError('Return date must be after pick-up date.'); return; }
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return; }

    const validation = validateBookingRequirements({ driverLicense, termsAccepted });
    if (!validation.ok) { setError(validation.message); return; }

    const calc = calculateBookingPricing({ price: car.price, pickupDate, returnDate, pickupIsHQ });
    if (!calc.ok) { setError(calc.message); return; }

    setSubmitting(true);
    try {
      const draft = {
        pickup: pickupValue,
        pickupDate,
        returnDate,
        days: calc.days,
        vehicle: car.id,
        vehicleName: `${car.year} ${car.make} ${car.model}`,
        vehicleImage: car.image_url || '',
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        driverLicense,
        termsAccepted: true,
        paymentMethod: 'card',
        totalAmount: calc.total,
        deliveryFee: calc.deliveryFee,
        userId: user?.id || null,
      };
      const verification = await apiFetch('/identity/verification-sessions', {
        method: 'POST',
        body: JSON.stringify({
          customerEmail: email.trim(),
          returnUrl: `${window.location.origin}/identity-complete`,
        }),
      });
      if (!verification.url) throw new Error(verification.message || 'Could not start license verification.');
      draft.identityVerificationSessionId = verification.id;
      draft.identityProof = verification.proof;
      sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
      window.location.assign(verification.url);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={720}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
        <div style={{ width: 86, height: 62, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--navy)' }}>
          <img
            src={car.image_url || FALLBACK_IMG}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
          />
        </div>
        <div>
          <span className="badge badge-neutral">{car.category}</span>
          <h3 style={{ color: 'var(--navy)', margin: '4px 0 2px' }}>{car.year} {car.make} {car.model}</h3>
          <div style={{ color: 'var(--gold-dark)', fontWeight: 800 }}>${car.price}/day</div>
        </div>
      </div>

      <div className="bform-grid">
        <div className="bform-group bform-full">
          <label><i className="fas fa-map-marker-alt" /> Pick-up Location</label>
          <div className="pickup-toggle">
            <button type="button" className={`pickup-opt ${pickupIsHQ ? 'active' : ''}`} onClick={() => setPickupIsHQ(true)}>
              <i className="fas fa-building" /> Headquarters <span className="pickup-free">Free</span>
            </button>
            <button type="button" className={`pickup-opt ${!pickupIsHQ ? 'active' : ''}`} onClick={() => setPickupIsHQ(false)}>
              <i className="fas fa-map-marker-alt" /> Custom Location <span className="pickup-fee">+$100</span>
            </button>
          </div>
          {!pickupIsHQ && (
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Enter delivery address"
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div className="bform-group bform-full">
          <label><i className="fas fa-calendar-alt" /> Availability Calendar</label>
          <AvailabilityCalendar
            bookedRanges={bookedRanges}
            pickupDate={pickupDate}
            returnDate={returnDate}
            onPick={pickDate}
          />
        </div>

        <div className="bform-group">
          <label><i className="fas fa-calendar-alt" /> Pick-up Date</label>
          <input type="date" min={new Date().toISOString().split('T')[0]} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
        </div>
        <div className="bform-group">
          <label><i className="fas fa-calendar-check" /> Return Date</label>
          <input type="date" min={new Date().toISOString().split('T')[0]} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        <div className="bform-group">
          <label><i className="fas fa-user" /> Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="bform-group">
          <label><i className="fas fa-envelope" /> Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="bform-group">
          <label><i className="fas fa-phone" /> Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="207-000-0000" />
        </div>
        <div className="bform-group">
          <label><i className="fas fa-id-card" /> Driver's License / Government ID</label>
          <input type="text" value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} placeholder="License or state ID number" />
        </div>

        <div className="bform-group bform-full">
          <div className="terms-box info">
            <strong><i className="fas fa-shield-alt" /> Secure license verification</strong>
            <small style={{ display: 'block', color: '#466177', marginTop: 6, lineHeight: 1.5 }}>
              Before payment, Stripe Identity will securely verify your driver's license and a live selfie.
              ManuMan Mobility does not receive or store your license image.
            </small>
          </div>
        </div>

        <div className="bform-group bform-full">
          <div className="terms-box">
            <label className="terms-checkbox">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span>
                I confirm I am at least 21 years old, hold a valid driver's license or government ID, and agree to the{' '}
                <a href="#terms" onClick={(e) => { e.preventDefault(); setShowTerms((v) => !v); }}>Terms &amp; Conditions</a>{' '}
                and rental policy.
              </span>
            </label>
            {showTerms && <TermsPolicy />}
          </div>
        </div>
      </div>

      {pricing?.ok && (
        <div className="summary-panel" style={{ marginTop: 16 }}>
          <div className="bsummary-row"><span>Duration</span><strong>{pricing.days} day{pricing.days > 1 ? 's' : ''}{pricing.discount ? ' 🏷️ -10%' : ''}</strong></div>
          <div className="bsummary-row"><span>Rate</span><strong>${car.price}/day</strong></div>
          {pricing.deliveryFee > 0 && (
            <div className="bsummary-row"><span>🚗 Delivery Fee</span><strong style={{ color: '#ffb' }}>+${pricing.deliveryFee}</strong></div>
          )}
          <div className="bsummary-row total"><span>Total</span><strong>${pricing.total}</strong></div>
        </div>
      )}

      <div className="form-error" style={{ marginTop: 8 }}>{error}</div>

      <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={submitting} onClick={goToPayment}>
        {submitting
          ? <><i className="fas fa-spinner fa-spin" /> Opening verification...</>
          : <>Continue to Payment <i className="fas fa-arrow-right" /></>}
      </button>
    </Modal>
  );
}
