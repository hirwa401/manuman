import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GalleryModal from '../components/GalleryModal';
import { apiFetch } from '../lib/api';

const FALLBACK_IMG = '/images/fleet-card.png';

function SpecItem({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="spec-item">
      <i className={`fas ${icon}`} />
      <div>
        <span className="spec-label">{label}</span>
        <span className="spec-value">{value}</span>
      </div>
    </div>
  );
}

export default function Vehicle() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [error, setError] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/fleet')
      .then((fleet) => {
        if (cancelled) return null;
        const found = fleet.find((item) => String(item.id) === String(id));
        if (!found) throw new Error('Vehicle not found');
        setCar(found);
        document.title = `${found.year} ${found.make} ${found.model} — ManuMan Mobility`;
        return null;
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'Vehicle unavailable'); });
    return () => { cancelled = true; };
  }, [id]);

  const allImages = car
    ? [car.image_url, ...(car.interior_images || [])].filter(Boolean)
    : [];

  return (
    <>
      <Navbar />
      <main className="page-pad vehicle-page">
        {error ? (
          <div className="vehicle-error">
            <i className="fas fa-car-crash" />
            <h1>{error}</h1>
            <p>We could not load this vehicle right now.</p>
            <Link to="/#fleet" className="btn btn-primary">Back to Fleet</Link>
          </div>
        ) : !car ? (
          <div className="vehicle-loading">
            <i className="fas fa-spinner fa-spin" />
            <p>Loading vehicle details...</p>
          </div>
        ) : (
          <div className="vehicle-page-inner">
            <Link to="/#fleet" className="vehicle-back">
              <i className="fas fa-arrow-left" /> Back to fleet
            </Link>

            <div className="vehicle-layout">
              {/* LEFT: Gallery */}
              <div className="vehicle-gallery-col">
                <div className="vehicle-main-img" onClick={() => setGalleryOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setGalleryOpen(true); }} aria-label="Open photo gallery">
                  <img
                    src={allImages[activeImg] || FALLBACK_IMG}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                  <div className="gallery-open-hint"><i className="fas fa-expand" /> View Gallery</div>
                </div>
                {allImages.length > 1 && (
                  <div className="vehicle-thumbs">
                    {allImages.slice(0, 4).map((img, i) => (
                      <button
                        key={img}
                        type="button"
                        className={`vehicle-thumb ${i === activeImg ? 'active' : ''}`}
                        onClick={() => setActiveImg(i)}
                        aria-label={`Photo ${i + 1}`}
                      >
                        <img src={img} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                      </button>
                    ))}
                    {allImages.length > 4 && (
                      <button
                        type="button"
                        className="vehicle-thumb vehicle-thumb-more"
                        onClick={() => setGalleryOpen(true)}
                        aria-label="View all photos"
                      >
                        <img src={allImages[4]} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                        <span>+{allImages.length - 4}<br />more</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT: Info */}
              <div className="vehicle-info-col">
                <div className="vehicle-badges">
                  <span className="vehicle-detail-badge">{car.category || 'Vehicle'}</span>
                  {car.available !== false && <span className="badge badge-confirmed">Available</span>}
                </div>
                <span className="vehicle-detail-year">{car.year}</span>
                <h1 className="vehicle-title">{car.make} {car.model}</h1>

                <div className="vehicle-price-block">
                  <span className="vehicle-price-from">From</span>
                  <strong className="vehicle-price-amount">${car.price}</strong>
                  <span className="vehicle-price-unit">/day</span>
                </div>

                {/* Specs grid */}
                {(car.seats || car.doors || car.transmission || car.fuel_type || car.mpg || car.mileage) && (
                  <div className="vehicle-specs-grid">
                    <SpecItem icon="fa-users" label="Seats" value={car.seats ? `${car.seats} seats` : null} />
                    <SpecItem icon="fa-door-open" label="Doors" value={car.doors ? `${car.doors} doors` : null} />
                    <SpecItem icon="fa-cog" label="Transmission" value={car.transmission} />
                    <SpecItem icon="fa-gas-pump" label="Fuel" value={car.fuel_type} />
                    <SpecItem icon="fa-tachometer-alt" label="MPG" value={car.mpg ? `${car.mpg} mpg` : null} />
                    <SpecItem icon="fa-road" label="Mileage" value={car.mileage ? `${Number(car.mileage).toLocaleString()} mi` : null} />
                    <SpecItem icon="fa-suitcase" label="Luggage" value={car.luggage_capacity} />
                  </div>
                )}

                <hr className="vehicle-rule" />

                {/* Features */}
                {(car.features || []).length > 0 && (
                  <>
                    <h2 className="vehicle-section-title">Features</h2>
                    <ul className="vehicle-features-list">
                      {car.features.map((f) => (
                        <li key={f}><i className="fas fa-check-circle" /><span>{f}</span></li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Pricing details */}
                <div className="vehicle-pricing-info">
                  <h2 className="vehicle-section-title">Pricing &amp; Policies</h2>
                  <div className="vehicle-policy-grid">
                    <div className="vehicle-policy-item">
                      <i className="fas fa-route" />
                      <div>
                        <strong>Mileage</strong>
                        <span>{car.mileage_allowance || 'Unlimited mileage included'}</span>
                      </div>
                    </div>
                    {car.extra_mile_price && (
                      <div className="vehicle-policy-item">
                        <i className="fas fa-plus-circle" />
                        <div>
                          <strong>Extra Miles</strong>
                          <span>${car.extra_mile_price}/mile over limit</span>
                        </div>
                      </div>
                    )}
                    <div className="vehicle-policy-item">
                      <i className="fas fa-shield-alt" />
                      <div>
                        <strong>Security Deposit</strong>
                        <span>{car.deposit ? `$${car.deposit} (refundable)` : 'Discussed at booking'}</span>
                      </div>
                    </div>
                    <div className="vehicle-policy-item">
                      <i className="fas fa-plane" />
                      <div>
                        <strong>Airport Delivery</strong>
                        <span>Portland Jetport (PWM) — contact us</span>
                      </div>
                    </div>
                    <div className="vehicle-policy-item">
                      <i className="fas fa-map-marker-alt" />
                      <div>
                        <strong>Custom Delivery</strong>
                        <span>+$100 to your location</span>
                      </div>
                    </div>
                    <div className="vehicle-policy-item">
                      <i className="fas fa-undo" />
                      <div>
                        <strong>Cancellation</strong>
                        <span>{car.cancellation_policy || 'See our cancellation policy'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rental rules */}
                <div className="vehicle-rules-box">
                  <i className="fas fa-info-circle" />
                  <div>
                    <strong>Rental Requirements</strong>
                    <ul>
                      <li>Must be 21+ years old</li>
                      <li>Valid driver's license required</li>
                      <li>Identity verified via Stripe</li>
                      <li>Agree to Terms &amp; Conditions</li>
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="vehicle-cta">
                  <Link to={`/booking?car=${car.id}`} className="btn btn-primary btn-lg vehicle-book-btn">
                    <i className="fas fa-calendar-check" /> Book This Vehicle
                  </Link>
                  <Link to="/airport-pickup" className="btn btn-ghost">
                    <i className="fas fa-plane" /> Airport Pickup Info
                  </Link>
                </div>

                <div className="vehicle-secure-note">
                  <i className="fas fa-lock" /> Secure booking · Stripe-verified identity · No hidden fees
                </div>
              </div>
            </div>

            {/* Existing damage disclosure */}
            {car.damage_notes && (
              <div className="vehicle-damage-notice">
                <i className="fas fa-exclamation-triangle" />
                <div>
                  <strong>Existing Damage Disclosure</strong>
                  <p>{car.damage_notes}</p>
                </div>
              </div>
            )}

            {/* Protection info */}
            <div className="vehicle-protection-section">
              <h2>Protection &amp; Insurance</h2>
              <div className="protection-grid">
                <div className="protection-card">
                  <i className="fas fa-shield-alt" />
                  <h3>Stripe Identity Verification</h3>
                  <p>Every renter's driver's license is verified by Stripe before payment. Your information is handled securely and never stored by ManuMan Mobility.</p>
                </div>
                <div className="protection-card">
                  <i className="fas fa-car-crash" />
                  <h3>Your Own Insurance</h3>
                  <p>You are responsible for maintaining your own auto insurance coverage. Please verify your policy covers rental vehicles before booking.</p>
                </div>
                <div className="protection-card">
                  <i className="fas fa-lock" />
                  <h3>Secure Payment</h3>
                  <p>All payments are processed securely through Stripe. We never store your card details. Your security deposit is clearly disclosed before checkout.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <GalleryModal open={galleryOpen} onClose={() => setGalleryOpen(false)} car={car} />
    </>
  );
}
