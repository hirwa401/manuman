import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import GalleryModal from '../components/GalleryModal';
import MyBookingsModal from '../components/MyBookingsModal';
import HostApplicationModal from '../components/HostApplicationModal';
import useReveal from '../hooks/useReveal';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMG = '/images/fleet-card.png';

function Section({ id, children, className = '' }) {
  const [ref, cls] = useReveal();
  return (
    <section id={id} ref={ref} className={`${className} ${cls}`}>
      {children}
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [fleet, setFleet] = useState(null);
  const [fleetError, setFleetError] = useState('');
  const [galleryCar, setGalleryCar] = useState(null);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [hostOpen, setHostOpen] = useState(false);

  const [ratingVal, setRatingVal] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingName, setRatingName] = useState('');
  const [ratingMsg, setRatingMsg] = useState(null);

  const [contact, setContact] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactMsg, setContactMsg] = useState(null);
  const [contactBusy, setContactBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/fleet')
      .then((data) => { if (!cancelled) setFleet(data); })
      .catch((e) => { if (!cancelled) setFleetError(e.message); });
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep links: /#my-bookings and /#become-host open their modals.
  useEffect(() => {
    if (window.location.hash === '#my-bookings') {
      if (user) setBookingsOpen(true);
    } else if (window.location.hash === '#become-host') {
      if (user) setHostOpen(true);
    }
  }, [user]);

  const submitRating = async (e) => {
    e.preventDefault();
    if (!ratingVal) { setRatingMsg({ ok: false, text: 'Please select a star rating.' }); return; }
    try {
      await apiFetch('/ratings', {
        method: 'POST',
        body: JSON.stringify({ name: ratingName.trim(), rating: ratingVal }),
      });
      setRatingMsg({ ok: true, text: '✅ Thanks!' });
      setRatingVal(0);
      setRatingName('');
    } catch (err) {
      setRatingMsg({ ok: false, text: `❌ ${err.message || 'Something went wrong.'}` });
    }
  };

  const submitContact = async (e) => {
    e.preventDefault();
    setContactBusy(true);
    try {
      const results = await Promise.allSettled([
        fetch('https://formspree.io/f/mwlkjdev', {
          method: 'POST',
          body: new FormData(e.target),
          headers: { Accept: 'application/json' },
        }),
        apiFetch('/contact', { method: 'POST', body: JSON.stringify(contact) }),
      ]);
      const emailSent = results[0].status === 'fulfilled' && results[0].value.ok;
      const adminSaved = results[1].status === 'fulfilled';
      if (emailSent && adminSaved) {
        setContactMsg({ ok: true, text: "✅ Message sent! We'll get back to you soon." });
        setContact({ name: '', email: '', phone: '', message: '' });
      } else if (emailSent) {
        setContactMsg({ warn: true, ok: false, text: '✅ Email sent, but the admin dashboard could not save a copy.' });
      } else if (adminSaved) {
        setContactMsg({ warn: true, ok: false, text: '✅ Saved in the admin dashboard, but the email could not be sent.' });
      } else {
        setContactMsg({ ok: false, text: '❌ Something went wrong. Please try again.' });
      }
    } catch {
      setContactMsg({ ok: false, text: '❌ Server offline. Please call 207-245-0080.' });
    } finally {
      setContactBusy(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section id="home" className="hero">
        <div className="hero-bg">
          <img src="/images/hero-car.jpg" alt="ManuMan Fleet" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <h1 className="anim-fade-up">
            Reliable Cars.<br /><span>Exceptional Experiences.</span>
          </h1>
          <p className="anim-fade-up" style={{ animationDelay: '0.1s' }}>
            Portland, Maine's trusted car rental — clean vehicles, on-time delivery, and 5-star service every time.
          </p>
          <div className="hero-actions anim-fade-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/booking" className="btn btn-primary btn-lg">Reserve Your Car</Link>
            <a href="#fleet" className="btn btn-outline btn-lg hero-outline">View Our Fleet</a>
          </div>
          <div className="hero-stats anim-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="hero-stat"><strong>5★</strong><span>Turo Rating</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><strong>100+</strong><span>Happy Customers</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><strong>3</strong><span>Vehicles Available</span></div>
          </div>
        </div>
        <a className="hero-scroll-hint" href="#about" aria-label="Scroll down">
          <i className="fas fa-chevron-down" />
        </a>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar">
        <div className="trust-item"><i className="fas fa-plane" /><span>Airport Delivery</span></div>
        <div className="trust-item"><i className="fas fa-shield-alt" /><span>Clean &amp; Maintained</span></div>
        <div className="trust-item"><i className="fas fa-clock" /><span>On Time. Every Time.</span></div>
        <div className="trust-item"><i className="fas fa-user-tie" /><span>Exceptional Service</span></div>
        <div className="trust-item"><i className="fas fa-star" /><span>5-Star Turo Host</span></div>
      </div>

      {/* ABOUT */}
      <Section id="about" className="about">
        <div className="about-inner">
          <div className="about-text">
            <div className="about-label">Who We Are</div>
            <h2>Built on Trust.<br />Driven by Service.</h2>
            <p className="about-lead">
              ManuMan Mobility was founded with one simple belief — renting a car should feel as good as the trip itself.
              Based in Portland, Maine, we are a locally owned and operated car rental service committed to making every
              journey smooth, affordable, and stress-free.
            </p>
            <p className="about-body">
              We started because we saw a gap in the market — big rental companies that treat customers like numbers.
              We do things differently. Every vehicle in our fleet is personally maintained, thoroughly cleaned, and
              delivered on time. We know your time matters, and we show up for it.
            </p>
            <Link to="/booking" className="btn btn-primary" style={{ marginTop: 8 }}>Book Now</Link>
          </div>
          <div className="about-cards">
            <div className="about-card">
              <div className="about-card-icon"><i className="fas fa-bullseye" /></div>
              <h3>Our Mission</h3>
              <p>To provide Portland, Maine with reliable, affordable, and professional car rental experiences — delivered with honesty, care, and a personal touch that big companies can't offer.</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon"><i className="fas fa-eye" /></div>
              <h3>Our Vision</h3>
              <p>To become Maine's most trusted local car rental brand — known not just for our vehicles, but for the relationships we build and the communities we serve.</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon"><i className="fas fa-hands-helping" /></div>
              <h3>Our Goal</h3>
              <p>To make every customer feel like a priority — from the moment they book to the moment they return the keys. No hidden fees, no surprises, just great service.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* FLEET */}
      <Section id="fleet" className="fleet">
        <div className="section-header">
          <h2>Our Fleet</h2>
          <p>Choose the perfect vehicle for your trip</p>
        </div>
        {fleetError && (
          <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>
            Could not load fleet. Please call 207-245-0080.
          </p>
        )}
        <div className="cars-grid">
          {!fleet && !fleetError && [1, 2, 3].map((n) => (
            <div key={n} className="car-card skeleton">
              <div className="skel skel-img" />
              <div className="car-info">
                <div className="skel skel-title" />
                <div className="skel skel-line" />
                <div className="skel skel-line" />
                <div className="skel skel-btn" />
              </div>
            </div>
          ))}
          {fleet && fleet.map((car, i) => (
            <CarCard key={car.id} car={car} index={i} onOpenGallery={setGalleryCar} />
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" className="how-it-works">
        <div className="section-header light">
          <h2>How It Works</h2>
        <p>Renting a car has never been easier</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-icon"><i className="fas fa-search" /></div>
            <h3>1. Choose Your Car</h3>
            <p>Browse our fleet and pick the vehicle that fits your needs and budget.</p>
          </div>
          <div className="step-arrow"><i className="fas fa-chevron-right" /></div>
          <div className="step">
            <div className="step-icon"><i className="fas fa-calendar-alt" /></div>
            <h3>2. Book Online</h3>
            <p>Select your dates, verify your license securely, and confirm your reservation.</p>
          </div>
          <div className="step-arrow"><i className="fas fa-chevron-right" /></div>
          <div className="step">
            <div className="step-icon"><i className="fas fa-id-card" /></div>
            <h3>3. Verify &amp; Pay</h3>
            <p>Your driver's license is verified by Stripe. Pay securely — no hidden fees.</p>
          </div>
          <div className="step-arrow"><i className="fas fa-chevron-right" /></div>
          <div className="step">
            <div className="step-icon"><i className="fas fa-car" /></div>
            <h3>4. Pick Up &amp; Go</h3>
            <p>We deliver to Portland Airport or your preferred location — on time, every time.</p>
          </div>
        </div>
      </Section>

      {/* WHY US */}
      <Section id="why" className="why-us">
        <div className="section-header">
          <h2>Why Choose ManuMan Mobility?</h2>
          <p>Portland, Maine's most trusted car rental service</p>
        </div>
        <div className="why-grid">
          <div className="why-card">
            <i className="fas fa-star" />
            <h3>5-Star Turo Host</h3>
            <p>Consistently rated 5 stars by our customers on Turo.</p>
          </div>
          <div className="why-card">
            <i className="fas fa-plane" />
            <h3>Airport Delivery</h3>
            <p>We bring the car to Portland Jetport — no shuttle needed.</p>
          </div>
          <div className="why-card">
            <i className="fas fa-shield-alt" />
            <h3>Clean &amp; Safe</h3>
            <p>Every vehicle is thoroughly cleaned and inspected before each rental.</p>
          </div>
          <div className="why-card">
            <i className="fas fa-dollar-sign" />
            <h3>Best Value</h3>
            <p>Competitive rates with no hidden fees. What you see is what you pay.</p>
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="testimonials">
        <div className="section-header light">
          <h2>What Our Customers Say</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>"Amazing experience! The car was spotless and delivered right to the airport. Will definitely rent again."</p>
            <span>— Sarah M., Portland</span>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>"Best car rental in Maine. The RAV4 was perfect for our family road trip. Super professional service."</p>
            <span>— James T., Boston</span>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>"Reliable, affordable, and on time. The Cruze was exactly what I needed for my business trip."</p>
            <span>— Linda K., Augusta</span>
          </div>
        </div>
      </Section>

      {/* RATING */}
      <Section id="rate" className="rating-section">
        <form className="rating-form" onSubmit={submitRating}>
          <span className="rating-label">Enjoyed your ride? Rate us</span>
          <div className="star-picker" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <i
                key={n}
                className={`fas fa-star ${(hoverRating || ratingVal) >= n ? 'active' : ''}`}
                onMouseEnter={() => setHoverRating(n)}
                onClick={() => setRatingVal(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRatingVal(n); } }}
              />
            ))}
          </div>
          <input
            type="text"
            value={ratingName}
            onChange={(e) => setRatingName(e.target.value)}
            placeholder="Your name (optional)"
          />
          <button type="submit" className="btn btn-rating">Submit</button>
          <div className={`form-msg ${ratingMsg ? (ratingMsg.ok ? 'ok' : 'err') : ''}`}>{ratingMsg?.text}</div>
        </form>
      </Section>

      {/* AIRPORT PICKUP */}
      <Section id="airport" className="airport-section">
        <div className="airport-section-inner">
          <div className="airport-section-text">
            <div className="about-label">Portland Jetport · PWM</div>
            <h2>We Deliver to the Airport</h2>
            <p>Flying into Portland? Skip the rental counter. We bring your vehicle directly to Portland International Jetport — no shuttle, no waiting.</p>
            <ul className="airport-section-list">
              <li><i className="fas fa-check-circle" /> We track your flight for delays</li>
              <li><i className="fas fa-check-circle" /> Meet you at arrivals</li>
              <li><i className="fas fa-check-circle" /> Available 7 days a week</li>
              <li><i className="fas fa-check-circle" /> Late-night pickups available</li>
            </ul>
            <Link to="/airport-pickup" className="btn btn-primary" style={{ marginTop: 16 }}>Airport Pickup Guide</Link>
          </div>
          <div className="airport-section-visual">
            <div className="airport-visual-card">
              <i className="fas fa-plane-arrival" />
              <div>
                <strong>Portland Jetport (PWM)</strong>
                <span>Portland, Maine</span>
              </div>
            </div>
            <div className="airport-steps-mini">
              {['Book online','Share flight details','We track your flight','Meet at arrivals','Drive away'].map((s, i) => (
                <div key={s} className="airport-step-mini">
                  <span className="airport-step-mini-num">{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ TEASER */}
      <Section className="faq-teaser">
        <div className="section-header light">
          <h2>Common Questions</h2>
          <p>Quick answers to what customers ask most</p>
        </div>
        <div className="faq-teaser-grid">
          {[
            { q: 'How old do I need to be?', a: 'You must be at least 21 years old with a valid driver\'s license.' },
            { q: 'Is there a security deposit?', a: 'A refundable security deposit may be required. Details are discussed at booking.' },
            { q: 'What if my flight is delayed?', a: 'We track flights for airport deliveries and adjust automatically. Just call us.' },
            { q: 'Are there hidden fees?', a: 'No. We show the full price breakdown before you pay. What you see is what you pay.' },
          ].map((item) => (
            <div key={item.q} className="faq-teaser-item">
              <h3><i className="fas fa-question-circle" /> {item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/faq" className="btn btn-primary">View All FAQs</Link>
        </div>
      </Section>

      {/* CONTACT */}
      <Section id="contact" className="contact">
        <div className="section-header">
          <h2>Get In Touch</h2>
          <p>We're here to help — call, email, or send us a message</p>
        </div>
        <div className="contact-wrapper">
          <div className="contact-info">
            <div className="contact-item">
              <i className="fas fa-phone" />
              <div>
                <strong>Call or Text Anytime</strong>
                <a href="tel:2072450080">207-245-0080</a>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope" />
              <div>
                <strong>Email Us</strong>
                <a href="mailto:Manumanmobility1@gmail.com">Manumanmobility1@gmail.com</a>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-map-marker-alt" />
              <div>
                <strong>Location</strong>
                <span>Portland, Maine</span>
              </div>
            </div>
            <div className="contact-item">
              <i className="fab fa-instagram" />
              <div>
                <strong>Instagram</strong>
                <a href="https://instagram.com/manumanmobility" target="_blank" rel="noopener noreferrer">@manumanmobility</a>
              </div>
            </div>
            <div className="contact-item">
              <i className="fab fa-facebook" />
              <div>
                <strong>Facebook</strong>
                <a href="https://facebook.com/manumanmobility" target="_blank" rel="noopener noreferrer">ManuMan Mobility</a>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={submitContact}>
            <input type="text" name="name" placeholder="Your Name" required value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
            <input type="email" name="email" placeholder="Your Email" required value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
            <input type="tel" name="phone" placeholder="Your Phone (optional)" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
            <textarea name="message" rows="4" placeholder="Your Message" required value={contact.message} onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))} />
            <button type="submit" className="btn btn-primary" disabled={contactBusy}>Send Message</button>
            <div className={`form-msg ${contactMsg ? (contactMsg.ok ? 'ok' : contactMsg.warn ? 'warn' : 'err') : ''}`}>{contactMsg?.text}</div>
          </form>
        </div>
      </Section>

      <Footer />

      {/* MODALS */}
      <GalleryModal open={!!galleryCar} onClose={() => setGalleryCar(null)} car={galleryCar} />
      <MyBookingsModal open={bookingsOpen} onClose={() => setBookingsOpen(false)} />
      <HostApplicationModal open={hostOpen} onClose={() => setHostOpen(false)} />
    </>
  );
}
