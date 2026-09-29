import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authedFetch } from '../lib/api';
import { uploadImage } from '../lib/api';
import { getAccessToken, sb } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMG = '/images/fleet-card.png';
const CATEGORIES = ['SEDAN', 'SUV', 'MINIVAN', 'TRUCK', 'LUXURY'];

export default function Host() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState('listings');
  const [cars, setCars] = useState(null);
  const [bookings, setBookings] = useState(null);

  const [form, setForm] = useState({ year: '', make: '', model: '', category: 'SEDAN', price: '', features: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (loading) return undefined;
    if (!user) { setChecked(true); return undefined; }
    let cancelled = false;
    getAccessToken().then((token) =>
      authedFetch('/profile', token)
        .then((p) => { if (!cancelled) { setProfile(p); setChecked(true); } })
        .catch(() => { if (!cancelled) setChecked(true); })
    );
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const loadCars = useCallback(() => {
    getAccessToken().then((token) =>
      authedFetch('/host/fleet', token)
        .then(setCars)
        .catch(() => setCars([]))
    );
  }, []);

  const loadBookings = useCallback(() => {
    getAccessToken().then((token) =>
      authedFetch('/host/bookings', token)
        .then(setBookings)
        .catch(() => setBookings([]))
    );
  }, []);

  useEffect(() => {
    if (profile && ['host', 'admin'].includes(profile.role)) {
      loadCars();
      loadBookings();
    }
  }, [profile, loadCars, loadBookings]);

  if (loading || !checked) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.6rem', color: 'var(--gold)' }} />
      </main>
    );
  }

  const isHost = profile && ['host', 'admin'].includes(profile.role);

  if (!user || !isHost) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--navy)' }}>Host Access Required</h2>
          <p style={{ color: '#888', margin: '10px 0 24px' }}>
            You need to be signed in and have host privileges to access this dashboard.
          </p>
          <Link to="/" className="btn btn-navy">Go to Main Site</Link>
        </div>
      </main>
    );
  }

  const displayName = profile?.full_name || user.email.split('@')[0];
  const totalEarnings = (bookings || []).reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  const submitCar = async () => {
    setAddError('');
    setAddSuccess('');
    const { year, make, model, price, features } = form;
    if (!year.trim() || !make.trim() || !model.trim() || !price || !imageFile) {
      setAddError('Please fill all required fields and choose a vehicle image.');
      return;
    }
    setAdding(true);
    try {
      const image_url = await uploadImage(imageFile);
      await authedFetch('/host/fleet', await getAccessToken(), {
        method: 'POST',
        body: JSON.stringify({
          year: year.trim(),
          make: make.trim(),
          model: model.trim(),
          category: form.category,
          price,
          image_url,
          features: features.trim() ? features.split(',').map((f) => f.trim()).filter(Boolean) : [],
        }),
      });
      setAddSuccess('✅ Car submitted! It will appear after admin approval.');
      setForm({ year: '', make: '', model: '', category: 'SEDAN', price: '', features: '' });
      setImageFile(null);
      setImagePreview('');
      loadCars();
    } catch (e) {
      setAddError(e.message || 'Could not submit your car.');
    } finally {
      setAdding(false);
    }
  };

  const removeCar = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this car from your listings?')) return;
    await authedFetch(`/host/fleet/${id}`, await getAccessToken(), { method: 'DELETE' });
    loadCars();
  };

  const signOutAndGoHome = async () => {
    await sb.auth.signOut();
    window.location.assign('/');
  };

  return (
    <div className="host-shell">
      <nav className="host-nav">
        <div className="host-logo">
          <img src="/images/websiteimage.png" alt="logo" />
          <span>Host Dashboard</span>
        </div>
        <div className="host-nav-actions">
          <span className="muted">{displayName}</span>
          <Link to="/"><i className="fas fa-home" /> Main Site</Link>
          <button type="button" onClick={signOutAndGoHome}><i className="fas fa-sign-out-alt" /> Sign Out</button>
        </div>
      </nav>

      <div className="host-wrap">
        <div className="host-header">
          <h2>Welcome, {displayName} 👋</h2>
          <p>Manage your listings and track your bookings</p>
        </div>

        <div className="earnings-box">
          <div className="earn-card">
            <div className="earn-val">${totalEarnings}</div>
            <div className="earn-label">Total Earnings</div>
          </div>
          <div className="earn-card">
            <div className="earn-val">{(bookings || []).length}</div>
            <div className="earn-label">Total Bookings</div>
          </div>
          <div className="earn-card">
            <div className="earn-val">{(cars || []).length}</div>
            <div className="earn-label">Listed Cars</div>
          </div>
        </div>

        <div className="host-tabs">
          <button type="button" className={`host-tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
            <i className="fas fa-car" /> My Listings
          </button>
          <button type="button" className={`host-tab ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
            <i className="fas fa-plus" /> Add Car
          </button>
          <button type="button" className={`host-tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>
            <i className="fas fa-calendar-check" /> Bookings
          </button>
        </div>

        {tab === 'listings' && (
          <div>
            {cars === null && <p className="muted">Loading...</p>}
            {cars && cars.length === 0 && <p className="muted">No cars listed yet. Add your first car!</p>}
            <div className="host-car-grid">
              {(cars || []).map((c) => (
                <div key={c.id} className="host-car-card">
                  <img src={c.image_url || FALLBACK_IMG} alt={`${c.year} ${c.make} ${c.model}`} onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                  <div className="host-car-info">
                    <h4>{c.year} {c.make} {c.model}</h4>
                    <p>${c.price}/day · {c.category}</p>
                    <div style={{ marginBottom: 10 }}>
                      {c.approved
                        ? <span className="badge badge-approved">✓ Approved</span>
                        : <span className="badge badge-pending">⏳ Pending Approval</span>}
                    </div>
                    <div className="host-car-actions">
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCar(c.id)}>
                        <i className="fas fa-trash" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'add' && (
          <div className="page-card">
            <h2><i className="fas fa-plus-circle" /> List a New Car</h2>
            <div className="bform-grid">
              <div className="bform-group">
                <label>Year</label>
                <input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} placeholder="2022" />
              </div>
              <div className="bform-group">
                <label>Make</label>
                <input value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} placeholder="Toyota" />
              </div>
              <div className="bform-group">
                <label>Model</label>
                <input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Camry" />
              </div>
              <div className="bform-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="bform-group">
                <label>Price per Day ($)</label>
                <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="65" />
              </div>
              <div className="bform-group">
                <label>Vehicle Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setImageFile(file || null);
                    setImagePreview(file ? URL.createObjectURL(file) : '');
                  }}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Vehicle preview" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
                )}
              </div>
              <div className="bform-group bform-full">
                <label>Features (comma separated)</label>
                <input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="Bluetooth, Backup Camera, GPS" />
              </div>
            </div>
            {addError && <div className="form-msg err" style={{ marginTop: 8 }}>{addError}</div>}
            {addSuccess && <div className="form-msg ok" style={{ marginTop: 8 }}>{addSuccess}</div>}
            <button type="button" className="btn btn-navy" style={{ marginTop: 16 }} disabled={adding} onClick={submitCar}>
              <i className="fas fa-plus" /> {adding ? 'Submitting...' : 'Submit for Approval'}
            </button>
            <p className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
              Your car will be reviewed by ManuMan Mobility before going live.
            </p>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="page-card">
            <h2><i className="fas fa-calendar-check" /> Bookings on Your Cars</h2>
            {bookings === null && <p className="muted">Loading...</p>}
            {bookings && bookings.length === 0 && <p className="muted">No bookings yet.</p>}
            {(bookings || []).map((b) => (
              <div key={b.id} className="booking-row">
                <div>
                  <strong>{b.vehicle_name}</strong>
                  <div className="muted">{b.customer_name} · {b.pickup_date} → {b.return_date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${b.status} badge-neutral`}>{b.status}</span>
                  <div style={{ fontWeight: 700, color: 'var(--navy)' }}>${b.total_amount}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
