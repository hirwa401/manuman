import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--navy)', padding: 24 }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--gold)' }}>404</div>
        <h1 style={{ margin: '10px 0' }}>Page not found</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </main>
  );
}
