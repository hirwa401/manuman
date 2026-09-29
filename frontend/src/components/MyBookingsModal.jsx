import { useEffect, useState } from 'react';
import Modal from './Modal';
import { authedFetch } from '../lib/api';
import { getAccessToken } from '../lib/supabaseClient';

// "My Bookings" modal from the account menu.
export default function MyBookingsModal({ open, onClose }) {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setBookings(null);
    setError('');
    getAccessToken().then((token) =>
      authedFetch('/bookings/mine', token)
        .then((data) => { if (!cancelled) setBookings(data); })
        .catch((e) => { if (!cancelled) setError(e.message); })
    );
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} maxWidth={640}>
      <h3 style={{ color: 'var(--navy)', marginBottom: 14 }}>My Bookings</h3>
      {error && <p className="form-msg err">{error}</p>}
      {!bookings && !error && <p className="muted">Loading...</p>}
      {bookings && bookings.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>No bookings yet.</p>}
      {bookings && bookings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bookings.map((b) => (
            <div key={b.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 800, color: 'var(--navy)' }}>{b.vehicle_name}</div>
              <div className="muted" style={{ margin: '4px 0 8px' }}>
                <i className="fas fa-calendar" /> {b.pickup_date} &rarr; {b.return_date}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge badge-${b.status} badge-neutral`}>{b.status}</span>
                <strong style={{ color: 'var(--navy)' }}>${b.total_amount}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
