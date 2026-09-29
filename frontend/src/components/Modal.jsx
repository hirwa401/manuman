import useModal from '../hooks/useModal';

// Shared modal shell: overlay click, Escape key, and body scroll lock.
export default function Modal({ open, onClose, children, maxWidth = 560 }) {
  useModal(open, onClose);
  return (
    <div
      className={`modal-overlay ${open ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth }}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <i className="fas fa-times" />
        </button>
        {children}
      </div>
    </div>
  );
}
