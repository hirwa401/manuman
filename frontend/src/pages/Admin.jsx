import { useCallback, useEffect, useState } from 'react';
import '../styles/admin.css';
import { apiFetch } from '../lib/api';
import { uploadImage } from '../lib/api';

const FALLBACK_IMG = '/images/fleet-card.png';
const CATEGORIES = ['SEDAN', 'SUV', 'MINIVAN', 'TRUCK', 'LUXURY'];
const TITLES = {
  overview: 'Overview',
  bookings: 'Bookings',
  contacts: 'Messages',
  fleet: 'Fleet Management',
  ratings: 'Customer Ratings',
  hosts: 'Host Approvals',
};

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getAdminToken() {
  return sessionStorage.getItem('adminToken') || '';
}

function adminFetch(path, options = {}) {
  return apiFetch(path, {
    ...options,
    headers: { 'X-Admin-Token': getAdminToken(), ...(options.headers || {}) },
  });
}

// ── FLEET MODAL ───────────────────────────────────────────
function CarModal({ open, car, allFleet, onClose, onSaved }) {
  const [form, setForm] = useState({
    year: '', make: '', model: '', category: 'SEDAN', price: '', imageUrl: '', features: '',
    seats: '', doors: '', transmission: '', fuel_type: '', mpg: '', mileage: '',
    luggage_capacity: '', mileage_allowance: '', deposit: '', cancellation_policy: '',
  });
  const [existingGallery, setExistingGallery] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setError('');
    setImageFile(null);
    setPreview('');
    setNewFiles([]);
    if (car) {
      setForm({
        year: car.year || '',
        make: car.make || '',
        model: car.model || '',
        category: car.category || 'SEDAN',
        price: car.price ?? '',
        imageUrl: car.image_url || '',
        features: (car.features || []).join('\n'),
        seats: car.seats || '',
        doors: car.doors || '',
        transmission: car.transmission || '',
        fuel_type: car.fuel_type || '',
        mpg: car.mpg || '',
        mileage: car.mileage || '',
        luggage_capacity: car.luggage_capacity || '',
        mileage_allowance: car.mileage_allowance || '',
        deposit: car.deposit || '',
        cancellation_policy: car.cancellation_policy || '',
      });
      setExistingGallery([...(car.interior_images || [])]);
    } else {
      setForm({
        year: '', make: '', model: '', category: 'SEDAN', price: '', imageUrl: '', features: '',
        seats: '', doors: '', transmission: '', fuel_type: '', mpg: '', mileage: '',
        luggage_capacity: '', mileage_allowance: '', deposit: '', cancellation_policy: '',
      });
      setExistingGallery([]);
    }
    return undefined;
  }, [open, car]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setError('');
    if (!form.year.trim() || !form.make.trim() || !form.model.trim() || !form.price) {
      setError('Please fill in year, make, model and price.');
      return;
    }
    setSaving(true);
    try {
      let image_url = form.imageUrl.trim();
      if (imageFile) image_url = await uploadImage(imageFile);

      const images = [...existingGallery];
      for (const file of newFiles) {
        // eslint-disable-next-line no-await-in-loop
        images.push(await uploadImage(file));
      }

      const payload = {
        year: form.year.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        category: form.category,
        price: form.price,
        image_url,
        interior_images: images,
        features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
        seats: form.seats ? Number(form.seats) : undefined,
        doors: form.doors ? Number(form.doors) : undefined,
        transmission: form.transmission.trim() || undefined,
        fuel_type: form.fuel_type.trim() || undefined,
        mpg: form.mpg.trim() || undefined,
        mileage: form.mileage.trim() || undefined,
        luggage_capacity: form.luggage_capacity.trim() || undefined,
        mileage_allowance: form.mileage_allowance.trim() || undefined,
        deposit: form.deposit ? Number(form.deposit) : undefined,
        cancellation_policy: form.cancellation_policy.trim() || undefined,
      };
      await adminFetch(car ? `/fleet/${car.id}` : '/fleet', {
        method: car ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (e) {
      setError(e.message || 'Error saving car.');
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal">
        <h3>{car ? 'Edit Car' : 'Add New Car'}</h3>
        <label>Year</label>
        <input value={form.year} onChange={set('year')} placeholder="e.g. 2023" />
        <label>Make</label>
        <input value={form.make} onChange={set('make')} placeholder="e.g. Toyota" />
        <label>Model</label>
        <input value={form.model} onChange={set('model')} placeholder="e.g. Camry" />
        <label>Category</label>
        <select value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
        </select>
        <label>Price per Day ($)</label>
        <input type="number" min="1" value={form.price} onChange={set('price')} placeholder="e.g. 65" />
        <label>Car Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            setImageFile(file || null);
            setPreview(file ? URL.createObjectURL(file) : '');
            if (file) setForm((f) => ({ ...f, imageUrl: '' }));
          }}
        />
        {(preview || form.imageUrl) && (
          <img src={preview || form.imageUrl} alt="preview" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee', marginBottom: 14 }} />
        )}
        <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="Or paste an image URL" />
        <label>Interior / Gallery Images</label>
        <input type="file" accept="image/*" multiple onChange={(e) => setNewFiles(Array.from(e.target.files || []))} />
        {existingGallery.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {existingGallery.map((url, idx) => (
              <div key={url} className="pending-list-thumb">
                <img src={url} alt="" />
                <button type="button" onClick={() => setExistingGallery((g) => g.filter((_, i) => i !== idx))}>×</button>
              </div>
            ))}
          </div>
        )}
        {newFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {newFiles.map((file) => (
              <div key={file.name} className="pending-list-thumb">
                <img src={URL.createObjectURL(file)} alt="" />
              </div>
            ))}
          </div>
        )}
        <small className="muted" style={{ display: 'block', marginBottom: 10 }}>
          You can upload multiple images. Remove an existing image by clicking the × on its thumbnail.
        </small>
        <label>Features (one per line)</label>
        <textarea rows="4" value={form.features} onChange={set('features')} placeholder={'Fuel Efficient\nAll-Wheel Drive\nSpacious Interior'} />
        <details style={{ marginBottom: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--navy)', fontSize: '0.88rem', marginBottom: 8 }}>Vehicle Specs (optional)</summary>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div><label>Seats</label><input type="number" value={form.seats} onChange={set('seats')} placeholder="5" /></div>
            <div><label>Doors</label><input type="number" value={form.doors} onChange={set('doors')} placeholder="4" /></div>
            <div><label>Transmission</label><input value={form.transmission} onChange={set('transmission')} placeholder="Automatic" /></div>
            <div><label>Fuel Type</label><input value={form.fuel_type} onChange={set('fuel_type')} placeholder="Gasoline" /></div>
            <div><label>MPG</label><input value={form.mpg} onChange={set('mpg')} placeholder="28 city / 36 hwy" /></div>
            <div><label>Mileage (odometer)</label><input value={form.mileage} onChange={set('mileage')} placeholder="32000" /></div>
            <div><label>Luggage Capacity</label><input value={form.luggage_capacity} onChange={set('luggage_capacity')} placeholder="2 large bags" /></div>
            <div><label>Security Deposit ($)</label><input type="number" value={form.deposit} onChange={set('deposit')} placeholder="500" /></div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label>Mileage Allowance</label>
            <input value={form.mileage_allowance} onChange={set('mileage_allowance')} placeholder="Unlimited mileage included" />
          </div>
          <div style={{ marginTop: 8 }}>
            <label>Cancellation Policy</label>
            <input value={form.cancellation_policy} onChange={set('cancellation_policy')} placeholder="Free cancellation 24h before pickup" />
          </div>
        </details>
        {error && <div className="form-error" style={{ marginBottom: 8 }}>{error}</div>}
        <div className="admin-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save Car'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ADMIN PAGE ───────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [section, setSection] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [hostRequests, setHostRequests] = useState([]);
  const [pendingCars, setPendingCars] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const login = async () => {
    setLoginError('');
    if (!password) { setLoginError('Please enter a password.'); return; }
    try {
      const data = await apiFetch('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (data.success && data.token) {
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminToken', data.token);
        setToken(data.token);
      } else {
        setLoginError('❌ Wrong password. Try again.');
      }
    } catch {
      setLoginError('❌ Cannot connect to server. Is it running?');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminToken');
    setToken('');
  };

  const loadBookings = useCallback(() => adminFetch('/bookings').then(setBookings).catch(() => {}), []);
  const loadContacts = useCallback(() => adminFetch('/contacts').then(setContacts).catch(() => {}), []);
  const loadFleet = useCallback(() => adminFetch('/fleet').then(setFleet).catch(() => {}), []);
  const loadRatings = useCallback(() => adminFetch('/ratings').then(setRatings).catch(() => {}), []);
  const loadHosts = useCallback(async () => {
    try {
      const requests = await adminFetch('/host-requests');
      setHostRequests(Array.isArray(requests) ? requests : []);
    } catch {
      setHostRequests([]);
    }
    try {
      const cars = await adminFetch('/fleet/pending');
      setPendingCars(Array.isArray(cars) ? cars : []);
    } catch {
      setPendingCars([]);
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    loadBookings();
    loadContacts();
    return undefined;
  }, [token, loadBookings, loadContacts]);

  useEffect(() => {
    if (!token) return undefined;
    if (section === 'fleet') loadFleet();
    if (section === 'ratings') loadRatings();
    if (section === 'hosts') loadHosts();
    return undefined;
  }, [section, token, loadFleet, loadRatings, loadHosts]);

  if (!token) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <img src="/images/websiteimage.png" alt="ManuMan Mobility" />
          <h2>Admin Dashboard</h2>
          <p>Enter your password to continue</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') login(); }}
          />
          <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={login}>
            <i className="fas fa-lock" /> Login
          </button>
          {loginError && <div className="form-error" style={{ marginTop: 10 }}>{loginError}</div>}
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const paidCount = bookings.filter((b) => b.status === 'paid').length;
  const totalRevenue = bookings
    .filter((b) => ['paid', 'confirmed'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  const updateStatus = async (id, status) => {
    await adminFetch(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadBookings();
  };

  const deleteBooking = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this booking?')) return;
    await adminFetch(`/bookings/${id}`, { method: 'DELETE' });
    loadBookings();
  };

  const deleteContact = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this message?')) return;
    await adminFetch(`/contacts/${id}`, { method: 'DELETE' });
    loadContacts();
  };

  const deleteRating = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this rating?')) return;
    await adminFetch(`/ratings/${id}`, { method: 'DELETE' });
    loadRatings();
  };

  const deleteCar = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this car from the fleet?')) return;
    await adminFetch(`/fleet/${id}`, { method: 'DELETE' });
    loadFleet();
  };

  const approveCar = async (id) => {
    await adminFetch(`/fleet/${id}/approve`, { method: 'PATCH' });
    loadHosts();
  };

  const approveHostRequest = async (id) => {
    try {
      await adminFetch(`/host-requests/${id}/approve`, { method: 'PATCH' });
      loadHosts();
    } catch {
      window.alert('Could not approve host application.');
    }
  };

  const rejectHostRequest = async (id) => {
    if (!window.confirm('Reject this host application?')) return;
    try {
      await adminFetch(`/host-requests/${id}/reject`, { method: 'PATCH' });
      loadHosts();
    } catch {
      window.alert('Could not reject host application.');
    }
  };

  const navItems = [
    { key: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
    { key: 'bookings', icon: 'fa-calendar-check', label: 'Bookings' },
    { key: 'contacts', icon: 'fa-envelope', label: 'Messages' },
    { key: 'fleet', icon: 'fa-car', label: 'Fleet' },
    { key: 'ratings', icon: 'fa-star', label: 'Ratings' },
    { key: 'hosts', icon: 'fa-users', label: 'Host Approvals' },
  ];

  return (
    <div className="admin-shell">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <img src="/images/websiteimage.png" alt="ManuMan Mobility" />
          <strong>ManuMan Mobility</strong>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={section === item.key ? 'active' : ''}
              onClick={() => { setSection(item.key); setMenuOpen(false); }}
            >
              <i className={`fas ${item.icon}`} /> {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="admin-logout" onClick={logout}>
          <i className="fas fa-sign-out-alt" /> Sign out
        </button>
      </div>

      <div className="admin-main">
        <div className="admin-topbar">
          <h1>{TITLES[section]}</h1>
          <span className="muted">{today}</span>
        </div>

        {section === 'overview' && (
          <>
            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-dollar-sign" /></div>
                <div className="stat-info"><strong>${totalRevenue.toLocaleString()}</strong><span>Total Revenue</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-calendar-check" /></div>
                <div className="stat-info"><strong>{bookings.length}</strong><span>Total Bookings</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-clock" /></div>
                <div className="stat-info"><strong>{pendingCount}</strong><span>Pending</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-check-circle" /></div>
                <div className="stat-info"><strong>{confirmedCount + paidCount}</strong><span>Confirmed / Paid</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-envelope" /></div>
                <div className="stat-info"><strong>{contacts.length}</strong><span>Messages</span></div>
              </div>
            </div>

            <div className="table-card">
              <div className="table-header">
                <h3>Recent Bookings</h3>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { loadBookings(); loadContacts(); }}>
                  <i className="fas fa-sync-alt" /> Refresh
                </button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Vehicle</th><th>Pick-up</th><th>Dates</th><th>Status</th></tr></thead>
                  <tbody>
                    {bookings.length === 0 && <tr><td colSpan="4" className="empty-cell">No bookings yet.</td></tr>}
                    {bookings.slice(0, 5).map((b) => (
                      <tr key={b.id}>
                        <td><strong>{b.vehicle_name || b.vehicle}</strong></td>
                        <td>{b.pickup}</td>
                        <td>{formatDate(b.pickup_date)} → {formatDate(b.return_date)}</td>
                        <td><span className={`badge badge-${b.status} badge-neutral`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {section === 'bookings' && (
          <div className="table-card">
            <div className="table-header">
              <h3>All Bookings</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={loadBookings}>
                <i className="fas fa-sync-alt" /> Refresh
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Customer</th><th>Vehicle</th><th>Pick-up</th><th>Dates</th><th>Payment</th><th>Total</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 && <tr><td colSpan="9" className="empty-cell">No bookings yet.</td></tr>}
                  {bookings.map((b, i) => (
                    <tr key={b.id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{b.customer_name || '—'}</strong>
                        <div className="muted">{b.customer_email || ''}</div>
                      </td>
                      <td><strong>{b.vehicle_name || b.vehicle}</strong></td>
                      <td>{b.pickup}</td>
                      <td>{formatDate(b.pickup_date)} → {formatDate(b.return_date)}</td>
                      <td>
                        <i className={`fas fa-${b.payment_method === 'card' ? 'credit-card' : 'money-bill-wave'}`} style={{ color: 'var(--gold-dark)' }} />{' '}
                        {b.payment_method === 'card' ? 'Card' : 'Cash'}
                      </td>
                      <td><strong>${b.total_amount || '—'}</strong></td>
                      <td><span className={`badge badge-${b.status} badge-neutral`}>{b.status}</span></td>
                      <td>
                        {b.status !== 'confirmed' && (
                          <button type="button" className="btn btn-sm" style={{ background: 'var(--green-soft)', color: 'var(--green)' }} onClick={() => updateStatus(b.id, 'confirmed')}>
                            <i className="fas fa-check" /> Confirm
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => updateStatus(b.id, 'cancelled')}>
                            <i className="fas fa-times" /> Cancel
                          </button>
                        )}
                        <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => deleteBooking(b.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'contacts' && (
          <div className="table-card">
            <div className="table-header">
              <h3>Contact Messages</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={loadContacts}>
                <i className="fas fa-sync-alt" /> Refresh
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Received</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {contacts.length === 0 && <tr><td colSpan="7" className="empty-cell">No messages yet.</td></tr>}
                  {contacts.map((c, i) => (
                    <tr key={c.id}>
                      <td>{i + 1}</td>
                      <td><strong>{c.name}</strong></td>
                      <td><a href={`mailto:${c.email}`}>{c.email}</a></td>
                      <td>{c.phone || '—'}</td>
                      <td style={{ maxWidth: 260, whiteSpace: 'normal' }}>{c.message}</td>
                      <td>{timeAgo(c.created_at)}</td>
                      <td>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteContact(c.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'fleet' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 24 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={loadFleet}>
                <i className="fas fa-sync-alt" /> Refresh
              </button>
              <button type="button" className="btn btn-navy btn-sm" onClick={() => { setEditCar(null); setModalOpen(true); }}>
                <i className="fas fa-plus" /> Add Car
              </button>
            </div>
            <div className="admin-fleet-grid">
              {fleet.length === 0 && <p className="muted" style={{ padding: 20 }}>No cars in fleet yet. Click "Add Car" to get started.</p>}
              {fleet.map((car) => (
                <div key={car.id} className="fleet-card">
                  <img src={car.image_url || FALLBACK_IMG} alt={`${car.make} ${car.model}`} onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                  <div className="fleet-card-body">
                    <span className="cat">{car.category}</span>
                    <h3>{car.year} {car.make} {car.model}</h3>
                    <div className="price">${car.price}/day</div>
                  </div>
                  <div className="fleet-card-actions">
                    <button type="button" className="btn btn-sm" style={{ background: 'var(--green-soft)', color: 'var(--green)' }} onClick={() => { setEditCar(car); setModalOpen(true); }}>
                      <i className="fas fa-edit" /> Edit
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteCar(car.id)}>
                      <i className="fas fa-trash" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {section === 'ratings' && (
          <div className="table-card">
            <div className="table-header">
              <h3>Customer Ratings</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={loadRatings}>
                <i className="fas fa-sync-alt" /> Refresh
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>#</th><th>Name</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {ratings.length === 0 && <tr><td colSpan="6" className="empty-cell">No ratings yet.</td></tr>}
                  {ratings.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td><strong>{r.name || 'Anonymous'}</strong></td>
                      <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                      <td style={{ maxWidth: 260, whiteSpace: 'normal' }}>{r.comment || '—'}</td>
                      <td>{timeAgo(r.created_at)}</td>
                      <td>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteRating(r.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'hosts' && (
          <div className="table-card">
            <div className="table-header">
              <h3>Pending Host Applications</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={loadHosts}>
                <i className="fas fa-sync-alt" /> Refresh
              </button>
            </div>
            <div style={{ padding: '4px 16px' }}>
              {hostRequests.length === 0 && <p className="muted">No pending host applications.</p>}
              {hostRequests.map((request) => {
                const profile = request.profiles || {};
                return (
                  <div key={request.id} className="admin-list-row">
                    <div>
                      <strong>{profile.full_name || 'Unnamed applicant'}</strong>
                      <div className="muted">
                        {request.email || 'No email'} · {request.phone || 'No phone'} · {request.location || 'No location'} · Applied {timeAgo(request.created_at)}
                      </div>
                      <div className="muted">License: {request.driver_license || 'Not provided'} · Terms accepted: {request.terms_accepted ? 'Yes' : 'No'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-sm" style={{ background: '#2ecc71', color: '#fff' }} onClick={() => approveHostRequest(request.id)}>
                        <i className="fas fa-check" /> Approve
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => rejectHostRequest(request.id)}>
                        <i className="fas fa-times" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="table-header" style={{ borderTop: '1px solid #eee' }}>
              <h3>Pending Host Car Listings</h3>
            </div>
            <div style={{ padding: '4px 16px 16px' }}>
              {pendingCars.length === 0 && <p className="muted">No pending listings.</p>}
              {pendingCars.map((c) => (
                <div key={c.id} className="admin-list-row">
                  <div>
                    <strong>{c.year} {c.make} {c.model}</strong> — ${c.price}/day
                    <div className="muted">{c.category}</div>
                  </div>
                  <button type="button" className="btn btn-sm" style={{ background: '#2ecc71', color: '#fff' }} onClick={() => approveCar(c.id)}>
                    <i className="fas fa-check" /> Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CarModal
        open={modalOpen}
        car={editCar}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadFleet(); }}
      />
    </div>
  );
}
