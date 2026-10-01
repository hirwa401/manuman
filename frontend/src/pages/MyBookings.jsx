import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { authedFetch } from '../lib/api';
import { getAccessToken } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[Number(m) - 1]} ${Number(day)}, ${y}`;
}

function statusLabel(status) {
  const map = {
    paid: 'Confirmed',
    confirmed: 'Confirmed',
    pending: 'Pending',
    payment_pending: 'Awaiting Payment',
    cancelled: 'Cancelled',
    failed: 'Payment Failed',
  };
  return map[status] || status;
}

function BookingCard({ booking }) {
  const [expanded, setExpanded] = useState(false);
  const isPast = booking.return_date && new Date(booking.return_date) < new Date();
  const isActive = !isPast && ['paid', 'confirmed'].includes(booking.status);

  return (
    <div className={`my-booking-card ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
      <div className="my-booking-header" onClick={() => setExpanded((v) => !v)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setExpanded((v) => !v); }}>
        <div className="my-booking-vehicle">
          <strong>{booking.vehicle_name || 'Vehicle'}</strong>
          <span className="my-booking-dates">
            <i className="fas fa-calendar" /> {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
          </span>
        </div>
        <div className="my-booking-meta">
          <span className={`badge badge-${booking.status}`}>{statusLabel(booking.status)}</span>
          <strong className="my-booking-amount">${booking.total_amount}</strong>
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} my-booking-toggle`} />
        </div>
      </div>

      {expanded && (
        <div className="my-booking-details">
          <div className="my-booking-grid">
            <div className="my-booking-detail-item">
              <span>Reservation</span>
              <strong>MM-{booking.id?.slice(0, 8).toUpperCase()}</strong>
            </div>
            <div className="my-booking-detail-item">
              <span>Pick-up Location</span>
              <strong>{booking.pickup}</strong>
            </div>
            <div className="my-booking-detail-item">
              <span>Pick-up Date</span>
              <strong>{formatDate(booking.pickup_date)}</strong>
            </div>
            <div className="my-booking-detail-item">
              <span>Return Date</span>
              <strong>{formatDate(booking.return_date)}</strong>
            </div>
            <div className="my-booking-detail-item">
              <span>Payment Method</span>
              <strong>{booking.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash'}</strong>
            </div>
            <div className="my-booking-detail-item">
              <span>Payment Status</span>
              <strong>{booking.payment_status || '—'}</strong>
            </div>
            {booking.delivery_fee > 0 && (
              <div className="my-booking-detail-item">
                <span>Delivery Fee</span>
                <strong>${booking.delivery_fee}</strong>
              </div>
            )}
            <div className="my-booking-detail-item">
              <span>Total Charged</span>
              <strong>${booking.total_amount}</strong>
            </div>
          </div>

          {isActive && (
            <div className="my-booking-instructions">
              <h4><i className="fas fa-info-circle" /> Pickup Instructions</h4>
              <p>
                {booking.pickup === 'Headquarters'
                  ? 'Call or text 207-245-0080 at least 1 hour before pickup to confirm. Bring your driver\'s license.'
                  : 'We\'ll deliver to your location. Call 207-245-0080 to confirm delivery time. For airport pickups, share your flight number.'}
              </p>
            </div>
          )}

          <div className="my-booking-actions">
            <a href="tel:2072450080" className="btn btn-ghost btn-sm">
              <i className="fas fa-phone" /> Contact Support
            </a>
            <Link to="/airport-pickup" className="btn btn-ghost btn-sm">
              <i className="fas fa-plane" /> Pickup Guide
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return undefined;
    if (!user) { navigate('/login'); return undefined; }
    let cancelled = false;
    getAccessToken().then((token) =>
      authedFetch('/bookings/mine', token)
        .then((data) => { if (!cancelled) setBookings(data); })
        .catch((e) => { if (!cancelled) setError(e.message); })
    );
    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  const upcoming = (bookings || []).filter((b) => !b.return_date || new Date(b.return_date) >= new Date());
  const past = (bookings || []).filter((b) => b.return_date && new Date(b.return_date) < new Date());

  return (
    <>
      <Navbar />
      <main className="page-pad my-bookings-page">
        <div className="my-bookings-inner">
          <div className="my-bookings-header">
            <h1><i className="fas fa-calendar-check" /> My Bookings</h1>
            <p>View and manage your reservations</p>
          </div>

          {loading && (
            <div className="my-bookings-loading">
              <i className="fas fa-spinner fa-spin" /> Loading your bookings...
            </div>
          )}

          {error && (
            <div className="my-bookings-error">
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}

          {bookings && bookings.length === 0 && (
            <div className="my-bookings-empty">
              <i className="fas fa-calendar-times" />
              <h2>No bookings yet</h2>
              <p>You don't have any reservations. Ready to hit the road?</p>
              <Link to="/booking" className="btn btn-primary">Book a Vehicle</Link>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="my-bookings-section">
              <h2 className="my-bookings-section-title">
                <span className="badge badge-confirmed">Upcoming</span>
              </h2>
              {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}

          {past.length > 0 && (
            <div className="my-bookings-section">
              <h2 className="my-bookings-section-title">
                <span className="badge badge-neutral">Past Rentals</span>
              </h2>
              {past.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}

          <div className="my-bookings-help">
            <i className="fas fa-headset" />
            <div>
              <strong>Need help with a booking?</strong>
              <p>Call or text <a href="tel:2072450080">207-245-0080</a> or email <a href="mailto:Manumanmobility1@gmail.com">Manumanmobility1@gmail.com</a></p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
