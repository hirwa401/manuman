import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AirportPickup() {
  return (
    <>
      <Navbar />
      <main className="page-pad airport-page">
        <div className="airport-inner">
          <div className="airport-header">
            <div className="airport-icon"><i className="fas fa-plane-arrival" /></div>
            <h1>Airport Pickup &amp; Delivery</h1>
            <p>We bring the car to you — no shuttle, no waiting, no hassle.</p>
          </div>

          {/* Hero info bar */}
          <div className="airport-info-bar">
            <div className="airport-info-item">
              <i className="fas fa-map-marker-alt" />
              <div>
                <strong>Portland International Jetport</strong>
                <span>PWM — Portland, Maine</span>
              </div>
            </div>
            <div className="airport-info-item">
              <i className="fas fa-dollar-sign" />
              <div>
                <strong>Delivery Fee</strong>
                <span>Contact us for airport pricing</span>
              </div>
            </div>
            <div className="airport-info-item">
              <i className="fas fa-clock" />
              <div>
                <strong>Available</strong>
                <span>7 days a week</span>
              </div>
            </div>
            <div className="airport-info-item">
              <i className="fas fa-phone" />
              <div>
                <strong>Contact</strong>
                <a href="tel:2072450080">207-245-0080</a>
              </div>
            </div>
          </div>

          {/* Step by step */}
          <div className="airport-steps-section">
            <h2>How Airport Delivery Works</h2>
            <div className="airport-steps">
              <div className="airport-step">
                <div className="airport-step-num">1</div>
                <div className="airport-step-content">
                  <h3>Book Your Vehicle</h3>
                  <p>Choose your vehicle and dates on our booking page. Select "Custom Location" and enter Portland Jetport (PWM) as your delivery address, or contact us directly.</p>
                </div>
              </div>
              <div className="airport-step-connector"><i className="fas fa-chevron-down" /></div>

              <div className="airport-step">
                <div className="airport-step-num">2</div>
                <div className="airport-step-content">
                  <h3>Receive Confirmation</h3>
                  <p>After booking, you'll receive a confirmation with your reservation number. Save our number: <a href="tel:2072450080">207-245-0080</a>.</p>
                </div>
              </div>
              <div className="airport-step-connector"><i className="fas fa-chevron-down" /></div>

              <div className="airport-step">
                <div className="airport-step-num">3</div>
                <div className="airport-step-content">
                  <h3>Share Your Flight Details</h3>
                  <p>Call or text us with your flight number and estimated arrival time. We track flights so we can adjust for delays automatically.</p>
                </div>
              </div>
              <div className="airport-step-connector"><i className="fas fa-chevron-down" /></div>

              <div className="airport-step">
                <div className="airport-step-num">4</div>
                <div className="airport-step-content">
                  <h3>Arrive at Portland Jetport</h3>
                  <p>After landing, collect your luggage and head to the arrivals area. Text us when you've landed and we'll confirm the exact meeting spot.</p>
                </div>
              </div>
              <div className="airport-step-connector"><i className="fas fa-chevron-down" /></div>

              <div className="airport-step">
                <div className="airport-step-num">5</div>
                <div className="airport-step-content">
                  <h3>Meet ManuMan</h3>
                  <p>We'll meet you at the designated location with your vehicle ready. We'll do a quick vehicle walkthrough together.</p>
                </div>
              </div>
              <div className="airport-step-connector"><i className="fas fa-chevron-down" /></div>

              <div className="airport-step">
                <div className="airport-step-num">6</div>
                <div className="airport-step-content">
                  <h3>Verify Identity &amp; Sign</h3>
                  <p>Bring the same driver's license you used during online verification. We'll confirm your identity, sign the rental agreement, and hand over the keys.</p>
                </div>
              </div>
              <div className="airport-step-connector"><i className="fas fa-chevron-down" /></div>

              <div className="airport-step airport-step-final">
                <div className="airport-step-num"><i className="fas fa-car" /></div>
                <div className="airport-step-content">
                  <h3>Drive Away</h3>
                  <p>You're all set! Enjoy your trip in Maine. We'll be available by phone throughout your rental if you need anything.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="airport-faq">
            <h2>Common Questions</h2>
            <div className="airport-faq-grid">
              <div className="airport-faq-item">
                <h3><i className="fas fa-plane" /> What if my flight is delayed?</h3>
                <p>We track flights for airport deliveries. If your flight is delayed, we'll adjust automatically. Just call or text us if there are any major changes.</p>
              </div>
              <div className="airport-faq-item">
                <h3><i className="fas fa-moon" /> What about late-night arrivals?</h3>
                <p>We accommodate late-night pickups. Contact us in advance at <a href="tel:2072450080">207-245-0080</a> to arrange the details for your arrival time.</p>
              </div>
              <div className="airport-faq-item">
                <h3><i className="fas fa-map-marker-alt" /> Where exactly do we meet?</h3>
                <p>We'll confirm the exact meeting spot when you contact us with your flight details. Typically we meet at the arrivals pickup area at Portland Jetport.</p>
              </div>
              <div className="airport-faq-item">
                <h3><i className="fas fa-undo" /> How does return work?</h3>
                <p>Contact us to arrange vehicle return. We can pick up from the airport or another agreed location. Return details will be confirmed at the time of pickup.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="airport-cta">
            <h2>Ready to book your airport delivery?</h2>
            <p>Reserve your vehicle online or call us to arrange your airport pickup directly.</p>
            <div className="airport-cta-actions">
              <Link to="/booking" className="btn btn-primary btn-lg">
                <i className="fas fa-calendar-check" /> Book Now
              </Link>
              <a href="tel:2072450080" className="btn btn-ghost btn-lg">
                <i className="fas fa-phone" /> Call 207-245-0080
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
