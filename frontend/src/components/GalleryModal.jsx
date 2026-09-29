import { useEffect, useState } from 'react';
import Modal from './Modal';

// Interior gallery viewer with thumbnail strip + arrow-key navigation.
export default function GalleryModal({ open, onClose, car }) {
  const [index, setIndex] = useState(0);

  const images = [];
  if (car?.image_url) images.push(car.image_url);
  if (Array.isArray(car?.interior_images)) images.push(...car.interior_images);
  const unique = [...new Set(images)];

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, car]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % unique.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + unique.length) % unique.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, unique.length]);

  return (
    <Modal open={open && unique.length > 0} onClose={onClose} maxWidth={820}>
      <div className="gallery-main">
        <img src={unique[index]} alt={`${car?.year} ${car?.make} ${car?.model}`} />
        <div className="gallery-caption">{car?.year} {car?.make} {car?.model}</div>
        {unique.length > 1 && (
          <div className="gallery-nav">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIndex((i) => (i - 1 + unique.length) % unique.length)}>
              <i className="fas fa-chevron-left" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIndex((i) => (i + 1) % unique.length)}>
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}
      </div>
      <div className="gallery-thumbs">
        {unique.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </Modal>
  );
}
