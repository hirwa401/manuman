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
            <li><Link to="/airport-pickup">Airport Pickup</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/#contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4>Policies</h4>
          <ul>
            <li><Link to="/cancellation-policy">Cancellation Policy</Link></li>
            <li><a href="/#terms">Terms &amp; Conditions</a></li>
            <li><a href="/#privacy">Privacy Policy</a></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <p><i className="fas fa-phone" /> <a href="tel:2072450080">207-245-0080</a></p>
          <p><i className="fas fa-envelope" /> <a href="mailto:Manumanmobility1@gmail.com">Manumanmobility1@gmail.com</a></p>
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
        <p>&copy; {new Date().getFullYear()} ManuMan Mobility. All rights reserved. &nbsp;·&nbsp; <Link to="/cancellation-policy">Cancellation Policy</Link> &nbsp;·&nbsp; <Link to="/faq">FAQ</Link></p>
      </div>
    </footer>
  );
}
