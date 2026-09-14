// Payment-page state: these references are filled when Stripe Elements is initialized.
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
  draft.idempotencyKey = draft.idempotencyKey || crypto.randomUUID();
  sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="bmodal-header">
      <div class="bmodal-car-img">${draft.vehicleImage ? `<img src="${draft.vehicleImage}" alt="${draft.vehicleName}"/>` : ''}</div>
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
        body: JSON.stringify({
          pickup: draft.pickup,
          pickupDate: draft.pickupDate,
          returnDate: draft.returnDate,
          vehicle: draft.vehicle,
          customerEmail: draft.customerEmail,
          customerName: draft.customerName,
          customerPhone: draft.customerPhone,
          driverLicense: draft.driverLicense,
          driverLicenseImage: draft.driverLicenseImage,
          termsAccepted: draft.termsAccepted,
          userId: draft.userId,
          idempotencyKey: draft.idempotencyKey
        })
      });
      const data = await res.json();
      if (!res.ok) { msg.style.color = 'red'; msg.textContent = data.message || 'Payment setup failed'; document.getElementById('checkoutPay').disabled = false; return; }
      const clientSecret = data.clientSecret;
      const { error, paymentIntent } = await stripePay.confirmCardPayment(clientSecret, { payment_method: { card: stripeCard, billing_details: { name: draft.customerName, email: draft.customerEmail } } });
      if (error) { msg.style.color = 'red'; msg.textContent = error.message; document.getElementById('checkoutPay').disabled = false; return; }
      if (paymentIntent.status !== 'succeeded') { msg.style.color = 'red'; msg.textContent = 'Payment not completed'; document.getElementById('checkoutPay').disabled = false; return; }
      // Finalize the pending booking created by the payment-intent endpoint.
      const bookingRes = await fetch(`${API}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
      });
      if (bookingRes.ok) {
        sessionStorage.removeItem('pendingBooking');
        msg.style.color = 'green';
        msg.textContent = 'Payment successful! Booking confirmed.';
        setTimeout(() => window.location.href = 'index.html', 2000);
      } else {
        msg.style.color = '#9a6700';
        msg.textContent = 'Payment received. Your booking is being finalized.';
        setTimeout(() => window.location.href = 'index.html', 2500);
      }
    } catch (e) {
      msg.style.color = 'red'; msg.textContent = 'Server error. Try again later.'; document.getElementById('checkoutPay').disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initPaymentPage);
