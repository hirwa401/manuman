import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMG = '/images/fleet-card.png';

// Fleet card used on the home grid. Clicking opens the vehicle details page.
export default function CarCard({ car, index = 0, onOpenGallery }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const features = car.features || [];
  const featured = index === 1;

  const openDetails = () => navigate(`/vehicle/${car.id}`);

  return (
    <div
      className={`car-card ${featured ? 'featured' : ''}`}
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetails(); } }}
    >
      <div className="car-badge">{car.category}</div>
      {featured && <div className="featured-tag">Most Popular</div>}
      <div className="car-image-wrap">
        <img
          src={car.image_url || FALLBACK_IMG}
          alt={`${car.year} ${car.make} ${car.model}`}
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
        {(car.interior_images || []).length > 0 && onOpenGallery && (
          <button
            type="button"
            className="interior-gallery-btn"
            onClick={(e) => { e.stopPropagation(); onOpenGallery(car); }}
          >
            <i className="fas fa-images" /> Interior
          </button>
        )}
      </div>
      <div className="car-info">
        <div className="car-title">
          <span className="car-year">{car.year}</span>
          <h3>{car.make} {car.model}</h3>
        </div>
        <ul className={`car-features ${expanded ? 'is-expanded' : ''}`}>
          {features.map((f) => (
            <li key={f} className={features.indexOf(f) >= 3 ? 'feature-extra' : ''}>
              <i className="fas fa-check-circle" /> {f}
            </li>
          ))}
        </ul>
        {features.length > 3 && (
          <button
            type="button"
            className="view-features-btn"
            aria-expanded={expanded}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          >
            {expanded ? 'View less' : 'View more'} <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`} />
          </button>
        )}
        <div className="car-footer">
          <div className="car-price">From <strong>${car.price}</strong>/day</div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/booking?car=${car.id}`); }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
