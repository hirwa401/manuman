import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FAQS = [
  {
    category: 'Eligibility',
    items: [
      {
        q: 'How old do I have to be to rent a vehicle?',
        a: 'You must be at least 21 years old to rent a vehicle from ManuMan Mobility. You must hold a valid driver\'s license appropriate for the vehicle you are renting.',
      },
      {
        q: 'What documents do I need?',
        a: 'You need a valid driver\'s license, a confirmed reservation, and a payment method. Your identity and driver\'s license are verified securely through Stripe Identity before payment.',
      },
      {
        q: 'Do you accept international driver\'s licenses?',
        a: 'Please contact us directly at 207-245-0080 or Manumanmobility1@gmail.com to discuss international license requirements before booking.',
      },
    ],
  },
  {
    category: 'Pricing & Payment',
    items: [
      {
        q: 'Are there any hidden fees?',
        a: 'No. We show you the full price breakdown before you pay — including the daily rate, number of days, delivery fee (if applicable), and total. What you see is what you pay.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) processed securely through Stripe. We do not store your card details.',
      },
      {
        q: 'Is there a security deposit?',
        a: 'A security deposit may be required and will be discussed at the time of booking or vehicle pickup. The deposit is fully refundable provided the vehicle is returned in the same condition.',
      },
      {
        q: 'Do you offer discounts for longer rentals?',
        a: 'Yes — rentals of 8 days or more receive a 10% discount automatically applied at checkout.',
      },
    ],
  },
  {
    category: 'Pickup & Delivery',
    items: [
      {
        q: 'How does airport pickup work?',
        a: 'We deliver directly to Portland International Jetport (PWM). After booking, contact us at 207-245-0080 with your flight details. We\'ll meet you at the designated pickup area. See our full Airport Pickup Guide for step-by-step instructions.',
      },
      {
        q: 'Can I choose another delivery location?',
        a: 'Yes. We offer delivery to custom locations for an additional $100 fee. Enter your delivery address during the booking process.',
      },
      {
        q: 'What happens if my flight is delayed?',
        a: 'No problem — we track flights for airport deliveries. Just call or text us at 207-245-0080 and we\'ll adjust your pickup time accordingly.',
      },
      {
        q: 'What happens during late-night pickups?',
        a: 'We accommodate late-night pickups. Please contact us in advance at 207-245-0080 to arrange the details.',
      },
    ],
  },
  {
    category: 'Mileage & Usage',
    items: [
      {
        q: 'Is mileage unlimited?',
        a: 'Mileage allowance varies by vehicle and rental package. Check the vehicle details page for specific mileage information. Where a limit applies, additional mileage is charged at the applicable rate.',
      },
      {
        q: 'Can I drive outside of Maine?',
        a: 'Please contact us before your rental if you plan to drive outside of Maine. Certain restrictions may apply.',
      },
    ],
  },
  {
    category: 'Cancellations & Changes',
    items: [
      {
        q: 'Can I cancel my reservation?',
        a: 'Yes. Cancellation fees may apply depending on how close the cancellation is to your scheduled pickup date. See our full Cancellation Policy for details.',
      },
      {
        q: 'Can I extend my rental?',
        a: 'Yes, subject to vehicle availability. Contact us before your original return time at 207-245-0080 to request an extension.',
      },
      {
        q: 'What happens if I return the vehicle late?',
        a: 'Late returns may result in additional charges at the applicable daily rate. Please contact us as soon as possible if you anticipate a late return.',
      },
    ],
  },
  {
    category: 'Accidents & Damage',
    items: [
      {
        q: 'What happens if I get into an accident?',
        a: 'Stop safely, contact emergency services if needed, then call ManuMan Mobility immediately at 207-245-0080. Do not admit liability or authorize repairs without consulting us first.',
      },
      {
        q: 'What happens if the vehicle breaks down?',
        a: 'Contact us immediately at 207-245-0080. Do not authorize major repairs without our prior approval, except where immediate action is necessary for safety.',
      },
      {
        q: 'What happens if I damage the vehicle?',
        a: 'You are responsible for damage caused during the rental period. Report any damage to us immediately. Your security deposit may be used to cover repair costs.',
      },
    ],
  },
  {
    category: 'Additional Drivers & Insurance',
    items: [
      {
        q: 'Can I add another driver?',
        a: 'Additional drivers must be approved by ManuMan Mobility before operating the vehicle. Contact us to arrange this.',
      },
      {
        q: 'Is insurance included?',
        a: 'You are responsible for maintaining your own auto insurance coverage. Please verify that your policy covers rental vehicles before booking. We recommend contacting your insurance provider.',
      },
    ],
  },
  {
    category: 'Identity & Privacy',
    items: [
      {
        q: 'Why do you need my driver\'s license?',
        a: 'Your driver\'s license is required to verify your eligibility to rent a vehicle. Verification is handled securely by Stripe Identity — ManuMan Mobility does not receive or store your license image.',
      },
      {
        q: 'How is my personal information handled?',
        a: 'Your information is collected only to process your reservation, verify your identity, and communicate with you about your rental. We do not sell your data. See our Privacy Policy for full details.',
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="faq-question"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} />
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
}

export default function FAQ() {
  return (
    <>
      <Navbar />
      <main className="page-pad faq-page">
        <div className="faq-inner">
          <div className="faq-header">
            <h1>Frequently Asked Questions</h1>
            <p>Everything you need to know about renting with ManuMan Mobility</p>
          </div>

          {FAQS.map((section) => (
            <div key={section.category} className="faq-section">
              <h2 className="faq-category">{section.category}</h2>
              <div className="faq-list">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}

          <div className="faq-cta">
            <h2>Still have questions?</h2>
            <p>We're happy to help. Call, text, or send us a message.</p>
            <div className="faq-cta-actions">
              <a href="tel:2072450080" className="btn btn-primary">
                <i className="fas fa-phone" /> Call 207-245-0080
              </a>
              <a href="mailto:Manumanmobility1@gmail.com" className="btn btn-ghost">
                <i className="fas fa-envelope" /> Email Us
              </a>
              <Link to="/cancellation-policy" className="btn btn-ghost">
                <i className="fas fa-undo" /> Cancellation Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
