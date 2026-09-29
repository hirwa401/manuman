import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GalleryModal from '../components/GalleryModal';
import { apiFetch } from '../lib/api';

const FALLBACK_IMG = '/images/fleet-card.png';

export default function Vehicle() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [error, setError] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/fleet')
      .then((fleet) => {
        if (cancelled) return null;
        const found = fleet.find((item) => String(item.id) === String(id));
        if (!found) throw new Error('Vehicle not found');
        setCar(found);
        document.title = `${found.year} ${found.make} ${found.model} - ManuMan Mobility`;
        return null;
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'Vehicle unavailable'); });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <Navbar />
      <main className="page-pad">
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <h1 style={{ color: 'var(--navy)', marginBottom: 10 }}>{error}</h1>
              <p style={{ color: '#888', marginBottom: 24 }}>We could not load this vehicle right now.</p>
              <Link to="/#fleet" className="btn btn-primary">Back to Fleet</Link>
            </div>
          ) : !car ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.6rem' }} /> Loading vehicle details...
            </div>
          ) : (
            <>
              <Link to="/#fleet" className="vehicle-back">
                <i className="fas fa-arrow-left" /> Back to fleet
              </Link>
              <article className="vehicle-detail-layout">
                <div className="vehicle-detail-media">
                  <img
                    src={car.image_url || FALLBACK_IMG}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    onClick={() => setGalleryOpen(true)}
                    style={{ cursor: 'pointer' }}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                </div>
                <div className="vehicle-detail-info">
                  <span className="vehicle-detail-badge">{car.category || 'Vehicle'}</span>
                  <span className="vehicle-detail-year">{car.year}</span>
                  <h1>{car.make} {car.model}</h1>
                  <div className="vehicle-detail-price">From <strong>${car.price}</strong>/day</div>
                  <hr className="vehicle-detail-rule" />
                  <h2>Vehicle features</h2>
                  <ul className="vehicle-detail-features">
                    {(car.features || []).length === 0
                      ? <li>No additional features listed.</li>
                      : car.features.map((feature) => (
                        <li key={feature}><i className="fas fa-check-circle" /><span>{feature}</span></li>
                      ))}
                  </ul>
                  {(car.interior_images || []).length > 0 && (
                    <div className="vehicle-gallery" aria-label="Interior images">
                      {car.interior_images.map((img) => (
                        <img key={img} src={img} alt={`${car.make} ${car.model} interior`} onClick={() => setGalleryOpen(true)} />
                      ))}
                    </div>
                  )}
                  <div className="vehicle-detail-actions">
                    <Link to={`/booking?car=${car.id}`} className="btn btn-primary">Book Now</Link>
                    <Link to="/login" className="btn vehicle-signin">Sign In</Link>
                  </div>
                </div>
              </article>
            </>
          )}
        </div>
      </main>
      <Footer />
      <GalleryModal open={galleryOpen} onClose={() => setGalleryOpen(false)} car={car} />
    </>
  );
}
