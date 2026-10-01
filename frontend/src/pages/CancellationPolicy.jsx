import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CancellationPolicy() {
  return (
    <>
      <Navbar />
      <main className="page-pad policy-page">
        <div className="policy-inner">
          <div className="policy-header">
            <h1>Cancellation &amp; Refund Policy</h1>
            <p>Last Updated: August 21, 2026</p>
          </div>

          <div className="policy-content">
            <div className="policy-highlight">
              <i className="fas fa-info-circle" />
              <div>
                <strong>The short version:</strong>
                <p>Cancellations may be subject to fees depending on how close to your pickup date you cancel. Contact us as early as possible if you need to cancel or change your reservation.</p>
              </div>
            </div>

            <h2>Cancellation by Customer</h2>
            <p>You may cancel your reservation by contacting ManuMan Mobility directly:</p>
            <ul>
              <li>Phone/Text: <a href="tel:2072450080">207-245-0080</a></li>
              <li>Email: <a href="mailto:Manumanmobility1@gmail.com">Manumanmobility1@gmail.com</a></li>
            </ul>
            <p>Cancellation fees may apply depending on how close the cancellation is to your scheduled pickup date. The applicable cancellation terms will be communicated at the time of booking.</p>

            <h2>No-Show Policy</h2>
            <p>If you fail to collect the vehicle at the agreed time without notifying ManuMan Mobility, your reservation may be treated as a no-show. In this case, you may not be entitled to a refund of any amounts already paid.</p>
            <p>If you are running late, please contact us immediately at <a href="tel:2072450080">207-245-0080</a> so we can make arrangements.</p>

            <h2>Refunds</h2>
            <p>Any applicable refund will be processed to the original payment method used at the time of booking. Refund processing times depend on your card issuer and may take several business days to appear on your statement.</p>
            <p>Security deposits, where collected, are refundable provided the vehicle is returned in the same condition as when it was collected, with no outstanding charges.</p>

            <h2>Cancellation by ManuMan Mobility</h2>
            <p>In rare circumstances, ManuMan Mobility may need to cancel a reservation due to vehicle unavailability or other unforeseen circumstances. In such cases, we will notify you as soon as possible and provide a full refund of any amounts paid.</p>

            <h2>Modifications to Your Reservation</h2>
            <p>If you need to change your pickup date, return date, or vehicle, please contact us as early as possible. Modifications are subject to vehicle availability and may affect your total price.</p>

            <h2>Extensions</h2>
            <p>If you need to extend your rental, contact us before your original return time. Extensions are subject to vehicle availability and will be charged at the applicable daily rate.</p>

            <div className="policy-contact-box">
              <h3>Questions about your reservation?</h3>
              <p>We're here to help. Contact us anytime:</p>
              <div className="policy-contact-actions">
                <a href="tel:2072450080" className="btn btn-primary">
                  <i className="fas fa-phone" /> 207-245-0080
                </a>
                <a href="mailto:Manumanmobility1@gmail.com" className="btn btn-ghost">
                  <i className="fas fa-envelope" /> Email Us
                </a>
              </div>
            </div>

            <p className="policy-terms-link">
              For full terms and conditions governing your rental, please review our <Link to="/#terms">Terms &amp; Conditions</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
