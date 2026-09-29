import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { authedFetch } from '../lib/api';
import { getAccessToken } from '../lib/supabaseClient';

// "Become a Host" application modal.
export default function HostApplicationModal({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ driverLicense: '', phone: '', location: '', termsAccepted: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: key === 'termsAccepted' ? e.target.checked : e.target.value }));

  const submit = async () => {
    setError('');
    if (!form.driverLicense.trim() || !form.phone.trim() || !form.location.trim() || !form.termsAccepted) {
      setError('Complete all fields and agree to the Host Terms and Policy.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      await authedFetch('/become-host', token, {
        method: 'POST',
        body: JSON.stringify({
          driverLicense: form.driverLicense.trim(),
          phone: form.phone.trim(),
          location: form.location.trim(),
          termsAccepted: true,
        }),
      });
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'Could not submit your host application.');
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    onClose();
    // Reload so the navbar role state refreshes after a successful application.
    if (success) navigate(0);
  };

  return (
    <Modal open={open} onClose={close} maxWidth={560}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <img src="/images/websiteimage.png" alt="logo" style={{ height: 42, borderRadius: 8 }} />
      </div>
      {!success ? (
        <>
          <h3 style={{ color: 'var(--navy)' }}>Apply to Become a Host</h3>
          <p className="muted" style={{ margin: '6px 0 18px' }}>
            Your application will be reviewed by ManuMan Mobility before host access is granted.
          </p>
          <div className="bform-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="bform-group">
              <label>Driver's License Number</label>
              <input value={form.driverLicense} onChange={set('driverLicense')} autoComplete="off" placeholder="Enter your license number" />
            </div>
            <div className="bform-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="207-000-0000" />
            </div>
            <div className="bform-group">
              <label>Location</label>
              <input value={form.location} onChange={set('location')} autoComplete="street-address" placeholder="City, State" />
            </div>
          </div>
          <label className="terms-checkbox" style={{ margin: '14px 0' }}>
            <input type="checkbox" checked={form.termsAccepted} onChange={set('termsAccepted')} />
            <span>
              I agree to the{' '}
              <a href="#host-policy" onClick={(e) => { e.preventDefault(); setShowPolicy((v) => !v); }}>Host Terms and Policy</a>
              , including providing accurate information and maintaining safe, legal rental vehicles.
            </span>
          </label>
          {showPolicy && (
            <div className="terms-policy" style={{ maxHeight: 150, marginBottom: 14 }}>
              <h4>Host Terms and Policy</h4>
              <p>
                Hosts must provide accurate identity and contact information, maintain safe and legally compliant vehicles,
                and follow all applicable rental, insurance, and safety requirements. ManuMan Mobility may reject or remove a
                host who provides false information or violates these requirements.
              </p>
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button type="button" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting} onClick={submit}>
            {submitting ? <><i className="fas fa-spinner fa-spin" /> Submitting...</> : 'Submit for Review'}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '2.4rem', color: 'var(--gold)' }}><i className="fas fa-clock" /></div>
          <h3 style={{ color: 'var(--navy)', margin: '12px 0 8px' }}>Application Submitted</h3>
          <p className="muted">Your application is pending admin review. You will receive host access after approval.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={close}>Done</button>
        </div>
      )}
    </Modal>
  );
}
