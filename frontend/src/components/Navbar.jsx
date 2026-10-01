import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authedFetch } from '../lib/api';
import { getAccessToken } from '../lib/supabaseClient';

// Determine the user's role (host/admin) to tailor the account menu.
export function useProfileRole(user) {
  const [role, setRole] = useState(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setRole(null);
      setPending(false);
      return undefined;
    }
    getAccessToken().then((token) => {
      if (!token || cancelled) return null;
      return authedFetch('/profile', token)
        .then((p) => {
          if (cancelled) return null;
          setRole(p.role || null);
          if (p.role !== 'host' && p.role !== 'admin') {
            return authedFetch('/host-request', token)
              .then((r) => setPending(r?.status === 'pending'))
              .catch(() => {});
          }
          return null;
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [user]);
  return { role, pending };
}

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { role, pending } = useProfileRole(user);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const initials = displayName.slice(0, 2).toUpperCase();

  const closeAll = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleSignOut = async () => {
    closeAll();
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeAll}>
          <img src="/images/websiteimage.png" alt="ManuMan Mobility" />
          <span>ManuMan</span>
        </Link>

        <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <li>
            <NavLink to="/#home" end onClick={closeAll}>
              <i className="fas fa-home" /> Home
            </NavLink>
          </li>
          <li>
            <a href="/#about" onClick={closeAll}>
              <i className="fas fa-circle-info" /> About us
            </a>
          </li>
          <li>
            <a href="/#fleet" onClick={closeAll}>
              <i className="fas fa-car" /> Our Fleet
            </a>
          </li>
          <li>
            <a href="/#how" onClick={closeAll}>
              <i className="fas fa-route" /> How It Works
            </a>
          </li>
          <li>
            <Link to="/airport-pickup" onClick={closeAll}>
              <i className="fas fa-plane" /> Airport
            </Link>
          </li>
          <li>
            <Link to="/faq" onClick={closeAll}>
              <i className="fas fa-question-circle" /> FAQ
            </Link>
          </li>
          <li>
            <a href="/#contact" onClick={closeAll}>
              <i className="fas fa-envelope" /> Contact
            </a>
          </li>
          <li>
            <Link to="/booking" className="btn btn-nav" onClick={closeAll}>
              <i className="fas fa-arrow-right" /> Book Now
            </Link>
          </li>

          {!user && (
            <li>
              <Link to="/login" className="btn btn-nav btn-nav-outline" onClick={closeAll}>
                Sign In
              </Link>
            </li>
          )}

          {user && (
            <li className="nav-user-wrap" ref={userMenuRef}>
              <button className="nav-user" onClick={() => setUserMenuOpen((v) => !v)}>
                <span className="avatar">{initials}</span>
                <span>{displayName}</span>
                <i className={`fas fa-chevron-${userMenuOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem' }} />
              </button>
              {userMenuOpen && (
                <div className="nav-dropdown">
                  <Link to="/my-bookings" onClick={closeAll}>
                    <i className="fas fa-calendar-check" /> My Bookings
                  </Link>
                  {(role === 'host' || role === 'admin') && (
                    <Link to="/host" onClick={closeAll}>
                      <i className="fas fa-car" /> Host Dashboard
                    </Link>
                  )}
                  {role !== 'host' && role !== 'admin' && (
                    <Link to="/#become-host" className={pending ? 'disabled' : ''} onClick={closeAll}>
                      <i className={`fas ${pending ? 'fa-clock' : 'fa-plus-circle'}`} />
                      {pending ? 'Host application pending' : 'Become a Host'}
                    </Link>
                  )}
                  <button onClick={handleSignOut}>
                    <i className="fas fa-sign-out-alt" /> Sign Out
                  </button>
                </div>
              )}
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
