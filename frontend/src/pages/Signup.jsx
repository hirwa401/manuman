import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sb } from '../lib/supabaseClient';

const PERKS = [
  { icon: 'fa-car', text: 'Access our full fleet instantly' },
  { icon: 'fa-history', text: 'Track all your rental history' },
  { icon: 'fa-plane', text: 'Airport delivery, no hassle' },
];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', terms: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/', { replace: true });
    });
  }, [navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: key === 'terms' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!form.terms) { setError('You must agree to the terms and conditions.'); return; }

    setBusy(true);
    const { error: authError } = await sb.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.name.trim() } },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }
    setDone(true);
  };

  return (
    <div className="auth-split">
      <Link to="/" className="back-home"><i className="fas fa-arrow-left" /> Back to Home</Link>

      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <img src="/images/websiteimage.png" alt="ManuMan Mobility" />
            <span>ManuMan Mobility</span>
          </div>
          <h1>Start your<br />journey<br /><span>today.</span></h1>
          <p>Join ManuMan Mobility and get access to Portland's best car rental experience — fast, reliable, and always on time.</p>
          <div className="auth-perks">
            {PERKS.map((p) => (
              <div key={p.icon} className="auth-perk"><i className={`fas ${p.icon}`} /> {p.text}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        {!done ? (
          <>
            <div className="auth-right-header">
              <h2>Create Account</h2>
              <p>It's free and takes less than a minute</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={submit}>
              <div className="bform-group" style={{ marginBottom: 16 }}>
                <label>Full Name</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="John Doe" autoComplete="name" />
              </div>
              <div className="bform-group" style={{ marginBottom: 16 }}>
                <label>Email Address</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" autoComplete="email" />
              </div>
              <div className="bform-group" style={{ marginBottom: 16 }}>
                <label>Password</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" autoComplete="new-password" />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={busy}>
                {busy ? <><i className="fas fa-spinner fa-spin" /> Creating account...</> : <><i className="fas fa-user-plus" /> Create Account</>}
              </button>

              <div className="auth-terms-row">
                <label className="terms-checkbox">
                  <input type="checkbox" checked={form.terms} onChange={set('terms')} />
                  <span>I agree to the terms and conditions.</span>
                </label>
              </div>
            </form>

            <div className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3.2rem', color: 'var(--green)' }}><i className="fas fa-check-circle" /></div>
            <h3 style={{ color: 'var(--navy)', margin: '14px 0 10px', fontSize: '1.4rem' }}>Check your email!</h3>
            <p style={{ color: '#666', fontSize: '0.92rem', lineHeight: 1.6 }}>
              We sent a confirmation link to your email address.<br />
              Click it to activate your account, then sign in.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 20 }}>Go to Sign In →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
