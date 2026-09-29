import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function IdentityComplete() {
  const [message, setMessage] = useState('Stripe is securely reviewing your document and selfie. This usually takes less than a minute.');
  const [showRetry, setShowRetry] = useState(false);

  const check = useCallback(async () => {
    const stored = sessionStorage.getItem('pendingBooking');
    let draft = null;
    try { draft = stored ? JSON.parse(stored) : null; } catch { draft = null; }

    if (!draft?.identityVerificationSessionId || !draft?.identityProof) {
      setMessage('No verification session was found. Please start your booking again.');
      setShowRetry(false);
      return;
    }
    setMessage('Checking your verification status…');
    setShowRetry(false);
    try {
      const result = await apiFetch(
        `/identity/verification-sessions/${encodeURIComponent(draft.identityVerificationSessionId)}?email=${encodeURIComponent(draft.customerEmail)}`,
        { headers: { 'X-Identity-Proof': draft.identityProof } }
      );
      if (result.status === 'verified') {
        setMessage('License verified. Taking you to secure payment…');
        setTimeout(() => { window.location.replace('/payment'); }, 700);
        return;
      }
      if (result.status === 'processing') {
        setMessage('Your document is still being checked. Please wait a moment, then check again.');
      } else {
        setMessage('Your verification needs more information. Return to booking and start the secure verification again.');
      }
    } catch (e) {
      setMessage(e.message || 'Could not check your verification.');
    }
    setShowRetry(true);
  }, []);

  useEffect(() => { check(); }, [check]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div className="page-card" style={{ maxWidth: 560, width: '100%', textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: '2.5rem', color: 'var(--gold)' }}>🛡️</div>
        <h1 style={{ color: 'var(--navy)', margin: '16px 0 8px', fontSize: '1.6rem' }}>Checking your license</h1>
        <p style={{ color: '#666', lineHeight: 1.6 }}>{message}</p>
        {showRetry && (
          <button type="button" className="btn btn-primary" style={{ margin: '18px auto 0' }} onClick={check}>
            Check again
          </button>
        )}
        <Link to="/booking" style={{ display: 'block', marginTop: 18, color: 'var(--navy)', fontWeight: 600 }}>
          Return to booking
        </Link>
      </div>
    </main>
  );
}
