import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src="/images/websiteimage.png" alt="ManuMan Mobility" />
          <p>
            Reliable Cars. Exceptional Experiences.
            <br />
            Portland, Maine
          </p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/#fleet">Our Fleet</Link></li>
            <li><Link to="/#how">How It Works</Link></li>
            <li><Link to="/#why">Why Us</Link></li>
            <li><Link to="/#contact">Contact</Link></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <p><i className="fas fa-phone" /> 207-245-0080</p>
          <p><i className="fas fa-envelope" /> Manumanmobility1@gmail.com</p>
          <p><i className="fas fa-map-marker-alt" /> Portland, Maine</p>
          <div className="footer-socials" aria-label="Follow ManuMan Mobility">
            <a href="https://instagram.com/manumanmobility" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fab fa-instagram" />
            </a>
            <a href="https://facebook.com/manumanmobility" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className="fab fa-facebook" />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 ManuMan Mobility. All rights reserved.</p>
      </div>
    </footer>
  );
}
