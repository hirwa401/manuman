import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[Number(m) - 1]} ${Number(day)}, ${y}`;
}

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('confirmedBooking');
    if (!stored) {
      // No confirmed booking — redirect to home after a moment
      const t = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(t);
    }
    try {
      setBooking(JSON.parse(stored));
    } catch {
      navigate('/');
    }
    return undefined;
  }, [navigate]);

  if (!booking) {
    return (
      <>
        <Navbar />
        <main className="page-pad" style={{ textAlign: 'center', paddingTop: 140 }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.6rem', color: 'var(--gold)' }} />
          <p style={{ marginTop: 12, color: '#888' }}>Loading your confirmation...</p>
        </main>
        <Footer />
      </>
    );
  }

  const shortId = booking.id ? `MM-${booking.id.slice(0, 8).toUpperCase()}` : 'MM-CONFIRMED';

  return (
    <>
      <Navbar />
      <main className="page-pad confirmation-page">
        <div className="confirmation-inner">
          {/* Success header */}
          <div className="confirmation-hero">
            <div className="confirmation-check">
              <i className="fas fa-check" />
            </div>
            <h1>You're booked!</h1>
            <p>Your reservation is confirmed. We'll be in touch with pickup details.</p>
            <div className="confirmation-ref">Reservation <strong>{shortId}</strong></div>
          </div>

          {/* Booking summary */}
          <div className="confirmation-card">
            <h2><i className="fas fa-car" /> Booking Summary</h2>
            <div className="conf-row"><span>Vehicle</span><strong>{booking.vehicleName || booking.vehicle_name}</strong></div>
            <div className="conf-row"><span>Pick-up Date</span><strong>{formatDate(booking.pickupDate || booking.pickup_date)}</strong></div>
            <div className="conf-row"><span>Return Date</span><strong>{formatDate(booking.returnDate || booking.return_date)}</strong></div>
            <div className="conf-row"><span>Pick-up Location</span><strong>{booking.pickup}</strong></div>
            <div className="conf-row"><span>Customer</span><strong>{booking.customerName || booking.customer_name}</strong></div>
            <div className="conf-row"><span>Email</span><strong>{booking.customerEmail || booking.customer_email}</strong></div>
            {booking.totalAmount != null && (
              <div className="conf-row conf-total"><span>Total Paid</span><strong>${booking.totalAmount || booking.total_amount}</strong></div>
            )}
            <div className="conf-row">
              <span>Status</span>
              <span className="badge badge-confirmed">Confirmed</span>
            </div>
          </div>

          {/* Before pickup checklist */}
          <div className="confirmation-card">
            <h2><i className="fas fa-clipboard-list" /> Before Your Pickup</h2>
            <ul className="checklist">
              <li><i className="fas fa-check-circle" /> Driver's license verified via Stripe Identity</li>
              <li><i className="fas fa-check-circle" /> Terms &amp; Conditions accepted</li>
              <li><i className="fas fa-circle" style={{ color: '#ccc' }} /> Review pickup instructions below</li>
              <li><i className="fas fa-circle" style={{ color: '#ccc' }} /> Save our contact number: <a href="tel:2072450080">207-245-0080</a></li>
              <li><i className="fas fa-circle" style={{ color: '#ccc' }} /> Confirm your arrival time with us</li>
            </ul>
          </div>

          {/* Pickup instructions */}
          <div className="confirmation-card confirmation-pickup">
            <h2><i className="fas fa-plane" /> Pickup Instructions</h2>
            {booking.pickup === 'Headquarters' ? (
              <div className="pickup-steps">
                <div className="pickup-step">
                  <div className="pickup-step-num">1</div>
                  <div>
                    <strong>Contact Us</strong>
                    <p>Call or text <a href="tel:2072450080">207-245-0080</a> at least 1 hour before your pickup time to confirm.</p>
                  </div>
                </div>
                <div className="pickup-step">
                  <div className="pickup-step-num">2</div>
                  <div>
                    <strong>Bring Your ID</strong>
                    <p>Bring the same driver's license you used during verification. We'll do a quick identity check.</p>
                  </div>
                </div>
                <div className="pickup-step">
                  <div className="pickup-step-num">3</div>
                  <div>
                    <strong>Vehicle Inspection</strong>
                    <p>We'll walk through the vehicle together and note any existing condition before you drive away.</p>
                  </div>
                </div>
                <div className="pickup-step">
                  <div className="pickup-step-num">4</div>
                  <div>
                    <strong>Drive Away</strong>
                    <p>Sign the rental agreement, receive the keys, and enjoy your trip!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pickup-steps">
                <div className="pickup-step">
                  <div className="pickup-step-num">1</div>
                  <div>
                    <strong>Confirm Delivery Time</strong>
                    <p>Call or text <a href="tel:2072450080">207-245-0080</a> to confirm your delivery time and exact location.</p>
                  </div>
                </div>
                <div className="pickup-step">
                  <div className="pickup-step-num">2</div>
                  <div>
                    <strong>Airport Delivery (PWM)</strong>
                    <p>For Portland Jetport arrivals, we'll meet you at the designated pickup area. Let us know your flight number so we can track delays.</p>
                  </div>
                </div>
                <div className="pickup-step">
                  <div className="pickup-step-num">3</div>
                  <div>
                    <strong>Identity Verification</strong>
                    <p>Have your driver's license ready. We'll verify your identity before handing over the keys.</p>
                  </div>
                </div>
                <div className="pickup-step">
                  <div className="pickup-step-num">4</div>
                  <div>
                    <strong>Vehicle Handover</strong>
                    <p>We'll walk through the vehicle condition together, sign the rental agreement, and you're on your way.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="pickup-note">
              <i className="fas fa-info-circle" />
              <span>Flight delayed? No problem — call us and we'll adjust. We track flights for airport deliveries.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="confirmation-actions">
            <Link to="/my-bookings" className="btn btn-primary">
              <i className="fas fa-calendar-check" /> View My Bookings
            </Link>
            <Link to="/airport-pickup" className="btn btn-ghost">
              <i className="fas fa-plane" /> Airport Pickup Guide
            </Link>
            <a href="tel:2072450080" className="btn btn-ghost">
              <i className="fas fa-phone" /> Call Us
            </a>
          </div>

          <div className="confirmation-contact-note">
            Questions? Call or text <a href="tel:2072450080">207-245-0080</a> or email <a href="mailto:Manumanmobility1@gmail.com">Manumanmobility1@gmail.com</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
