import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { apiFetch } from '../lib/api';
import { calculateBookingPricing, validateBookingRequirements } from '../lib/bookingValidation';

const FALLBACK_IMG = '/images/fleet-card.png';

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fleet, setFleet] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);

  const [pickupIsHQ, setPickupIsHQ] = useState(true);
  const [pickup, setPickup] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/fleet')
      .then((data) => {
        if (cancelled) return null;
        setFleet(data);
        setLoaded(true);
        const carId = searchParams.get('car');
        if (carId) {
          const car = data.find((c) => String(c.id) === String(carId));
          if (car) selectCar(car, data);
        }
        return null;
      })
      .catch((e) => { if (!cancelled) { setLoadError(e.message); setLoaded(true); } });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCar = async (car) => {
    setSelectedCar(car);
    setBookedRanges([]);
    try {
      const ranges = await apiFetch(`/bookings/availability/${car.id}`);
      setBookedRanges(Array.isArray(ranges) ? ranges : []);
    } catch {
      /* availability is optional */
    }
    setTimeout(() => {
      document.getElementById('dates-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return fleet;
    return fleet.filter((c) => `${c.year} ${c.make} ${c.model} ${c.category}`.toLowerCase().includes(q));
  }, [fleet, query]);

  const pricing = selectedCar && pickupDate && returnDate
    ? calculateBookingPricing({ price: selectedCar.price, pickupDate, returnDate, pickupIsHQ })
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

  const submit = async () => {
    setError('');
    if (!selectedCar) { setError('Please select a vehicle.'); return; }
    const pickupValue = pickupIsHQ ? 'Headquarters' : pickup.trim();
    if (!pickupIsHQ && !pickupValue) { setError('Please enter a delivery address.'); return; }
    if (!pickupDate) { setError('Please select a pick-up date.'); return; }
    if (!returnDate) { setError('Please select a return date.'); return; }
    if (returnDate <= pickupDate) { setError('Return date must be after pick-up date.'); return; }
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return; }
    const validation = validateBookingRequirements({ driverLicense, termsAccepted });
    if (!validation.ok) { setError(validation.message); return; }

    setSubmitting(true);
    try {
      const draft = {
        pickup: pickupValue,
        pickupDate,
        returnDate,
        vehicle: selectedCar.id,
        vehicleName: `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        driverLicense,
        termsAccepted: true,
        paymentMethod: 'card',
        userId: null,
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
    <>
      <Navbar />
      <div className="booking-page">
        <div className="booking-page-inner">
          <div className="booking-page-header">
            <h1>Book Your Car</h1>
            <p>Fill in your details below and we'll confirm your reservation</p>
          </div>

          {/* STEP 1: Choose car */}
          <div className="page-card">
            <h2><i className="fas fa-car" /> Choose Your Vehicle</h2>
            <div className="fleet-search">
              <i className="fas fa-search" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by make, model or category..."
              />
            </div>
            {loadError && <p className="form-msg err">Could not load fleet. Please call 207-245-0080.</p>}
            {!loaded && <p className="muted">Loading fleet...</p>}
            <div className="car-select-grid">
              {loaded && filtered.length === 0 && <p className="no-results">No vehicles match your search.</p>}
              {filtered.map((car) => (
                <div
                  key={car.id}
                  className={`car-select-card ${selectedCar?.id === car.id ? 'selected' : ''}`}
                  onClick={() => selectCar(car)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCar(car); } }}
                >
                  <div className="car-badge">{car.category}</div>
                  <div className="selected-tag">&#10003; Selected</div>
                  <img src={car.image_url || FALLBACK_IMG} alt={`${car.year} ${car.make} ${car.model}`} onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                  <div className="car-select-info">
                    <div className="car-select-year">{car.year}</div>
                    <h4>{car.make} {car.model}</h4>
                    <ul className="car-select-features">
                      {(car.features || []).slice(0, 3).map((f) => (
                        <li key={f}><i className="fas fa-check-circle" /> {f}</li>
                      ))}
                    </ul>
                    <div className="car-select-footer">
                      <div className="car-select-price">From <strong>${car.price}</strong>/day</div>
                      <button type="button" className="car-select-btn">{selectedCar?.id === car.id ? '✓ Selected' : 'Select'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: Dates */}
          <div className="page-card" id="dates-card">
            <h2><i className="fas fa-calendar-alt" /> Dates &amp; Pick-up</h2>
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
                  <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Enter delivery address" style={{ marginTop: 8 }} />
                )}
              </div>
              <div className="bform-group bform-full">
                <label><i className="fas fa-calendar-alt" /> Availability Calendar</label>
                <AvailabilityCalendar bookedRanges={bookedRanges} pickupDate={pickupDate} returnDate={returnDate} onPick={pickDate} />
              </div>
              <div className="bform-group">
                <label><i className="fas fa-calendar-alt" /> Pick-up Date</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
              </div>
              <div className="bform-group">
                <label><i className="fas fa-calendar-check" /> Return Date</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* STEP 3: Details */}
          <div className="page-card">
            <h2><i className="fas fa-user" /> Your Details</h2>
            <div className="bform-grid">
              <div className="bform-group">
                <label><i className="fas fa-user" /> Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
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
                <label><i className="fas fa-id-card" /> Driver's License / ID Number</label>
                <input type="text" value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} placeholder="License or state ID number" />
              </div>
              <div className="bform-group bform-full">
                <div className="terms-box info">
                  <strong><i className="fas fa-shield-alt" /> Secure license verification</strong>
                  <small style={{ display: 'block', color: '#466177', marginTop: 6, lineHeight: 1.5 }}>
                    Before payment, Stripe Identity securely verifies your driver's license and a live selfie.
                    ManuMan Mobility does not receive or store your license image.
                  </small>
                </div>
              </div>
              <div className="bform-group bform-full">
                <div className="terms-box">
                  <label className="terms-checkbox">
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                    <span>I confirm I am at least 21 years old, hold a valid driver's license, and agree to the Terms &amp; Conditions.</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          {pricing?.ok && (
            <div className="page-card">
              <h2><i className="fas fa-receipt" /> Booking Summary</h2>
              <div className="summary-panel">
                <div className="bsummary-row"><span>Vehicle</span><strong>{selectedCar.year} {selectedCar.make} {selectedCar.model}</strong></div>
                <div className="bsummary-row"><span>Duration</span><strong>{pricing.days} day{pricing.days > 1 ? 's' : ''}{pricing.discount ? ' 🏷️ -10%' : ''}</strong></div>
                <div className="bsummary-row"><span>Rate</span><strong>${selectedCar.price}/day</strong></div>
                {pricing.discount > 0 && (
                  <div className="bsummary-row"><span>Weekly discount</span><strong style={{ color: '#2ecc71' }}>-${pricing.discount}</strong></div>
                )}
                {pricing.deliveryFee > 0 && (
                  <div className="bsummary-row"><span>Delivery Fee</span><strong>+${pricing.deliveryFee}</strong></div>
                )}
                <div className="bsummary-row total"><span>Total</span><strong>${pricing.total}</strong></div>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#888', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <i className="fas fa-info-circle" style={{ color: 'var(--gold-dark)', marginTop: 2 }} />
                <span>Security deposit discussed at pickup. See our <a href="/cancellation-policy" style={{ color: 'var(--navy)', fontWeight: 700 }}>Cancellation Policy</a> before booking.</span>
              </div>
            </div>
          )}

          <div className="form-error">{error}</div>
          <button type="button" className="btn btn-primary booking-submit" disabled={submitting} onClick={submit}>
            {submitting
              ? <><i className="fas fa-spinner fa-spin" /> Starting verification...</>
              : <><i className="fas fa-lock" /> Verify License &amp; Continue</>}
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
