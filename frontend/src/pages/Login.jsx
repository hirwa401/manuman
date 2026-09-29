import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sb } from '../lib/supabaseClient';

const PERKS = [
  { icon: 'fa-calendar-check', text: 'View and manage your bookings' },
  { icon: 'fa-bolt', text: 'Faster checkout on your next rental' },
  { icon: 'fa-star', text: 'Exclusive member rates' },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in? go home.
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/', { replace: true });
    });
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    const { error: authError } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }
    navigate('/', { replace: true });
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
          <h1>Welcome<br />back to<br /><span>the road.</span></h1>
          <p>Portland, Maine's most trusted car rental. Sign in to manage your bookings and hit the road.</p>
          <div className="auth-perks">
            {PERKS.map((p) => (
              <div key={p.icon} className="auth-perk"><i className={`fas ${p.icon}`} /> {p.text}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-header">
          <h2>Sign In</h2>
          <p>Enter your credentials to access your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="bform-group" style={{ marginBottom: 16 }}>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          <div className="bform-group" style={{ marginBottom: 8 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <a href="#forgot" onClick={(e) => e.preventDefault()} style={{ color: 'var(--gold-dark)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? <><i className="fas fa-spinner fa-spin" /> Signing in...</> : <><i className="fas fa-sign-in-alt" /> Sign In</>}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account? <Link to="/signup">Create one free</Link>
        </div>
      </div>
    </div>
  );
}
