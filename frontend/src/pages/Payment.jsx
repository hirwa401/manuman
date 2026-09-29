import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '../components/Navbar';
import { apiFetch } from '../lib/api';
import { STRIPE_PUBLISHABLE_KEY } from '../config';

const FALLBACK_IMG = '/images/fleet-card.png';

export default function Payment() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [paying, setPaying] = useState(false);
  const [cardError, setCardError] = useState('');
  const cardRef = useRef(null);
  const stripeRef = useRef(null);
  const cardElementRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingBooking');
    if (!stored) return undefined;

    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch {
      return undefined;
    }
    parsed.idempotencyKey = parsed.idempotencyKey || crypto.randomUUID();
    sessionStorage.setItem('pendingBooking', JSON.stringify(parsed));
    setDraft(parsed);

    let unmount = null;
    loadStripe(STRIPE_PUBLISHABLE_KEY).then((stripe) => {
      if (!stripe || !cardRef.current) return null;
      stripeRef.current = stripe;
      const elements = stripe.elements();
      const card = elements.create('card', { style: { base: { fontSize: '16px', color: '#0d1b2a' } } });
      cardElementRef.current = card;
      card.mount(cardRef.current);
      card.on('change', (e) => setCardError(e.error ? e.error.message : ''));
      unmount = () => card.unmount();
      setReady(true);
      return null;
    });

    return () => {
      if (unmount) unmount();
    };
  }, []);

  const pay = async () => {
    if (!draft || !stripeRef.current || !cardElementRef.current) return;
    setMsg(null);
    setPaying(true);
    try {
      const data = await apiFetch('/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          pickup: draft.pickup,
          pickupDate: draft.pickupDate,
          returnDate: draft.returnDate,
          vehicle: draft.vehicle,
          customerEmail: draft.customerEmail,
          customerName: draft.customerName,
          customerPhone: draft.customerPhone,
          driverLicense: draft.driverLicense,
          termsAccepted: draft.termsAccepted,
          userId: draft.userId,
          idempotencyKey: draft.idempotencyKey,
          identityVerificationSessionId: draft.identityVerificationSessionId,
          identityProof: draft.identityProof,
        }),
      });

      const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElementRef.current,
          billing_details: { name: draft.customerName, email: draft.customerEmail },
        },
      });
      if (error) { setMsg({ ok: false, text: error.message }); setPaying(false); return; }
      if (paymentIntent.status !== 'succeeded') { setMsg({ ok: false, text: 'Payment not completed' }); setPaying(false); return; }

      try {
        await apiFetch('/confirm-payment', {
          method: 'POST',
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        sessionStorage.removeItem('pendingBooking');
        setMsg({ ok: true, text: 'Payment successful! Booking confirmed.' });
        setTimeout(() => navigate('/'), 2000);
      } catch {
        setMsg({ ok: false, warn: true, text: 'Payment received. Your booking is being finalized.' });
        setTimeout(() => navigate('/'), 2500);
      }
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Unable to reach the payment server. Please try again later.' });
      setPaying(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-pad" style={{ maxWidth: 860, margin: '0 auto' }}>
        <div className="section-header">
          <h2>Secure Checkout</h2>
          <p>Complete your payment to confirm the booking</p>
        </div>

        <div className="checkout-card">
          {!draft ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p className="muted">No booking found. Please start a booking from the home page.</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Home</Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {draft.vehicleImage && (
                  <div className="checkout-car-img">
                    <img src={draft.vehicleImage} alt={draft.vehicleName} onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                  </div>
                )}
                <div>
                  <span className="badge badge-neutral">Booking</span>
                  <h3 style={{ color: 'var(--navy)', margin: '4px 0' }}>{draft.vehicleName}</h3>
                  <div style={{ color: 'var(--gold-dark)', fontWeight: 800, fontSize: '1.2rem' }}>${draft.totalAmount}</div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="bsummary-row"><span>Pick-up</span><strong>{draft.pickup} · {draft.pickupDate}</strong></div>
                <div className="bsummary-row"><span>Return</span><strong>{draft.returnDate}</strong></div>
                <div className="bsummary-row total"><span>Total</span><strong>${draft.totalAmount}</strong></div>
              </div>

              <div style={{ marginTop: 20 }}>
                <h3 style={{ color: 'var(--navy)', marginBottom: 8 }}>Payment</h3>
                <div ref={cardRef} className="stripe-card-box" />
                {cardError && <div className="form-error" style={{ marginTop: 6 }}>{cardError}</div>}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
                <button type="button" className="btn btn-primary" disabled={!ready || paying} onClick={pay}>
                  <i className="fas fa-lock" /> {paying ? 'Processing...' : 'Pay Now'}
                </button>
                <span className="muted">Safe &amp; secure payments via Stripe</span>
              </div>
              <div className="secure-note" style={{ marginTop: 12 }}>
                <i className="fas fa-shield-alt" /> Your card information is processed securely by Stripe. We never store card details.
              </div>
              {msg && (
                <div className={`form-msg ${msg.ok ? 'ok' : msg.warn ? 'warn' : 'err'}`} style={{ marginTop: 12, fontSize: '1rem' }}>
                  {msg.text}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
