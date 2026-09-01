let stripePay = null;
let stripeCard = null;

async function initPaymentPage() {
  const pending = sessionStorage.getItem('pendingBooking');
  const msg = document.getElementById('checkoutMsg');
  if (!pending) {
    document.getElementById('checkoutSummary').innerHTML = '<p style="color:#888">No booking found. Please start a booking from the home page.</p>';
    document.getElementById('checkoutPay').disabled = true;
    return;
  }
  const draft = JSON.parse(pending);
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="bmodal-header">
      <div class="bmodal-car-img"><img src="images/fleet-card.png"/></div>
      <div>
        <div class="bmodal-car-badge">${draft.vehicleName}</div>
        <h3>${draft.vehicleName}</h3>
        <div class="bmodal-price">$${draft.totalAmount}</div>
      </div>
    </div>
    <div style="margin-top:12px">
      <div class="bsummary-row"><span>Pick-up</span><strong>${draft.pickup} · ${draft.pickupDate}</strong></div>
      <div class="bsummary-row"><span>Return</span><strong>${draft.returnDate}</strong></div>
      <div class="bsummary-row total"><span>Total</span><strong>$${draft.totalAmount}</strong></div>
    </div>`;

  stripePay = Stripe(STRIPE_PUBLISHABLE_KEY);
  const elements = stripePay.elements();
  stripeCard = elements.create('card', { style: { base: { fontSize: '16px', color: '#0d1b2a' } } });
  stripeCard.mount('#stripeCardElement');
  stripeCard.on('change', e => document.getElementById('stripeCardError').textContent = e.error ? e.error.message : '');

  document.getElementById('checkoutBack').addEventListener('click', () => { window.location.href = 'index.html'; });
  document.getElementById('checkoutPay').addEventListener('click', async () => {
    msg.textContent = '';
    document.getElementById('checkoutPay').disabled = true;
    try {
      // Create payment intent on backend
      const res = await fetch(`${API}/create-payment-intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: draft.totalAmount, customerEmail: draft.customerEmail, customerName: draft.customerName, description: draft.vehicleName })
      });
      const data = await res.json();
      if (!res.ok) { msg.style.color = 'red'; msg.textContent = data.message || 'Payment setup failed'; document.getElementById('checkoutPay').disabled = false; return; }
      const clientSecret = data.clientSecret;
      const { error, paymentIntent } = await stripePay.confirmCardPayment(clientSecret, { payment_method: { card: stripeCard, billing_details: { name: draft.customerName, email: draft.customerEmail } } });
      if (error) { msg.style.color = 'red'; msg.textContent = error.message; document.getElementById('checkoutPay').disabled = false; return; }
      if (paymentIntent.status !== 'succeeded') { msg.style.color = 'red'; msg.textContent = 'Payment not completed'; document.getElementById('checkoutPay').disabled = false; return; }
      // Save booking to server
      const bookingRes = await fetch(`${API}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, paymentMethod: 'card', totalAmount: draft.totalAmount, status: 'paid', driverLicenseImage: draft.driverLicenseImage || '' }) });
      if (bookingRes.ok) {
        sessionStorage.removeItem('pendingBooking');
        msg.style.color = 'green';
        msg.textContent = 'Payment successful! Booking confirmed.';
        setTimeout(() => window.location.href = 'index.html', 2000);
      } else {
        const jr = await bookingRes.json();
        msg.style.color = 'red'; msg.textContent = jr.message || 'Failed to save booking'; document.getElementById('checkoutPay').disabled = false;
      }
    } catch (e) {
      msg.style.color = 'red'; msg.textContent = 'Server error. Try again later.'; document.getElementById('checkoutPay').disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initPaymentPage);
