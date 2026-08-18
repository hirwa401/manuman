
let selectedCar = null;
let payMethod = 'card';
let currentUser = null;
let sbClient = null;
let stripeInstance = null;
let stripeCardElement = null;

// ── SUPABASE AUTH ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  sbClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateNavAuth();
  });
  sbClient.auth.getSession().then(({ data: { session } }) => {
    currentUser = session?.user || null;
    updateNavAuth();
  });
});

function updateNavAuth() {
  const authBtn = document.getElementById('navAuthBtn');
  const userMenu = document.getElementById('navUserMenu');
  const userName = document.getElementById('navUserName');
  const hostLink = document.getElementById('navHostLink');
  const becomeHostLink = document.getElementById('navBecomeHost');
  if (currentUser) {
    authBtn.style.display = 'none';
    userMenu.style.display = 'flex';
    const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    userName.textContent = name;
    // Check role
    getToken().then(token => fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } }))
      .then(r => r.json()).then(p => {
        if (p.role === 'host' || p.role === 'admin') {
          hostLink.style.display = 'block';
          becomeHostLink.style.display = 'none';
        }
      }).catch(() => {});
  } else {
    authBtn.style.display = 'list-item';
    userMenu.style.display = 'none';
  }
}

async function getToken() {
  const { data: { session } } = await sbClient.auth.getSession();
  return session?.access_token || '';
}

function openAuthModal(tab = 'login') {
  document.getElementById('authModal').style.display = 'flex';
  switchAuth(tab);
}
function closeAuthModal() { document.getElementById('authModal').style.display = 'none'; }
function switchAuth(tab) {
  document.getElementById('authLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('authSignup').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('authSuccess').style.display = 'none';
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  err.textContent = '';
  const { error } = await sbClient.auth.signInWithPassword({ email, password });
  if (error) { err.textContent = error.message; return; }
  closeAuthModal();
}

async function doSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const err = document.getElementById('signupError');
  err.textContent = '';
  if (!name) { err.textContent = 'Please enter your full name.'; return; }
  if (password.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
  const { error } = await sbClient.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (error) { err.textContent = error.message; return; }
  document.getElementById('authLogin').style.display = 'none';
  document.getElementById('authSignup').style.display = 'none';
  document.getElementById('authSuccess').style.display = 'block';
}

async function signOut() {
  await sbClient.auth.signOut();
  currentUser = null;
  updateNavAuth();
}

async function becomeHost() {
  if (!currentUser) { openAuthModal('login'); return; }
  const token = await getToken();
  const res = await fetch(`${API}/become-host`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  if (res.ok) {
    alert('🎉 You are now a host! Redirecting to your dashboard.');
    window.location.href = 'host.html';
  } else {
    const d = await res.json();
    alert(d.message);
  }
}

async function openMyBookings() {
  if (!currentUser) { openAuthModal('login'); return; }
  document.getElementById('myBookingsModal').style.display = 'flex';
  const list = document.getElementById('myBookingsList');
  list.innerHTML = '<p style="color:#888">Loading...</p>';
  const token = await getToken();
  const res = await fetch(`${API}/bookings/mine`, { headers: { Authorization: `Bearer ${token}` } });
  const bookings = await res.json();
  if (!bookings.length) { list.innerHTML = '<p style="color:#888;text-align:center">No bookings yet.</p>'; return; }
  list.innerHTML = bookings.map(b => `
    <div class="my-booking-card">
      <div class="my-booking-car">${b.vehicle_name}</div>
      <div class="my-booking-dates"><i class="fas fa-calendar"></i> ${b.pickup_date} → ${b.return_date}</div>
      <div class="my-booking-meta">
        <span class="booking-status status-${b.status}">${b.status}</span>
        <span>$${b.total_amount}</span>
      </div>
    </div>`).join('');
}

let pickupIsHQ = true;

function setPickupHQ() {
  pickupIsHQ = true;
  document.getElementById('pickupHQ').classList.add('active');
  document.getElementById('pickupCustom').classList.remove('active');
  document.getElementById('bPickup').style.display = 'none';
  document.getElementById('bPickup').value = '';
  updateSummary();
}

function setPickupCustom() {
  pickupIsHQ = false;
  document.getElementById('pickupCustom').classList.add('active');
  document.getElementById('pickupHQ').classList.remove('active');
  document.getElementById('bPickup').style.display = 'block';
  updateSummary();
}

// ── NAV ───────────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

window.addEventListener('scroll', () => {
  document.querySelector('.navbar').style.boxShadow =
    window.scrollY > 50 ? '0 2px 20px rgba(0,0,0,0.4)' : 'none';
});

// ── DATE DEFAULTS ─────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
document.querySelectorAll('input[type="date"]').forEach(i => i.setAttribute('min', today));

// ── FLEET ─────────────────────────────────────────────────
async function loadFleet(attempt = 1) {
  const grid = document.getElementById('carsGrid');
  grid.innerHTML = [1,2,3].map(() => `
    <div class="car-card skeleton">
      <div class="skel skel-img"></div>
      <div class="car-info">
        <div class="skel skel-title"></div>
        <div class="skel skel-line"></div>
        <div class="skel skel-line"></div>
        <div class="skel skel-btn"></div>
      </div>
    </div>`).join('');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API}/fleet`, { signal: controller.signal });
    clearTimeout(timeout);
    const fleet = await res.json();
    const select = document.getElementById('vehicleSelect');
    if (select) {
      select.innerHTML = '<option value="">Select a car</option>';
      fleet.forEach(car => {
        const opt = document.createElement('option');
        opt.value = car.id;
        opt.textContent = `${car.year} ${car.make} ${car.model}`;
        select.appendChild(opt);
      });
    }
    grid.innerHTML = fleet.map((car, i) => `
      <div class="car-card ${i === 1 ? 'featured' : ''}">
        <div class="car-badge">${car.category}</div>
        ${i === 1 ? '<div class="featured-tag">Most Popular</div>' : ''}
        <img src="${car.image_url || 'images/fleet-card.png'}" alt="${car.year} ${car.make} ${car.model}" onerror="this.src='images/fleet-card.png'" />
        <div class="car-info">
          <div class="car-title">
            <span class="car-year">${car.year}</span>
            <h3>${car.make} ${car.model}</h3>
          </div>
          <ul class="car-features">
            ${(car.features || []).map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('')}
          </ul>
          <div class="car-footer">
            <div class="car-price">From <strong>$${car.price}</strong>/day</div>
            <button class="btn-secondary" onclick='openBookingModal(${JSON.stringify(car)})'>Book Now</button>
          </div>
        </div>
      </div>`).join('');
  } catch {
    if (attempt < 3) {
      setTimeout(() => loadFleet(attempt + 1), 2000);
    } else {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Could not load fleet. Please call 207-245-0080.</p>';
    }
  }
}
loadFleet();

// ── BOOKING MODAL ─────────────────────────────────────────
let bookedRanges = [];
let calYear, calMonth;

async function openBookingModal(car) {
  selectedCar = car;
  document.getElementById('bCarName').textContent = `${car.year} ${car.make} ${car.model}`;
  document.getElementById('bCarBadge').textContent = car.category;
  document.getElementById('bCarPrice').textContent = `$${car.price}/day`;
  document.getElementById('bCarImg').innerHTML = `<img src="${car.image_url || 'images/fleet-card.png'}" onerror="this.src='images/fleet-card.png'" />`;

  pickupIsHQ = true;
  setPickupHQ();
  ['bPickup','bPickupDate','bReturnDate','bName','bEmail','bPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  // Reset Stripe card element for fresh mount next time
  if (stripeCardElement) {
    stripeCardElement.unmount();
    stripeCardElement = null;
    stripeInstance = null;
  }
  document.getElementById('bError').textContent = '';
  document.getElementById('bPayError').textContent = '';
  document.getElementById('bSummary').style.display = 'none';
  document.getElementById('bPickupDate').setAttribute('min', today);
  document.getElementById('bReturnDate').setAttribute('min', today);

  // Load availability
  bookedRanges = [];
  try {
    const res = await fetch(`${API}/bookings/availability/${car.id}`);
    bookedRanges = await res.json();
  } catch {}
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();

  showBStep(1);
  document.getElementById('bookingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
}

function isBooked(dateStr) {
  return bookedRanges.some(r => dateStr >= r.pickup_date && dateStr <= r.return_date);
}

function renderCalendar() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = `${months[calMonth]} ${calYear}`;
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  const pickupVal = document.getElementById('bPickupDate').value;
  const returnVal = document.getElementById('bReturnDate').value;
  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day cal-empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls = 'cal-day';
    if (dateStr < todayStr) cls += ' cal-past';
    else if (isBooked(dateStr)) cls += ' cal-booked';
    else if (dateStr === pickupVal) cls += ' cal-selected-start';
    else if (dateStr === returnVal) cls += ' cal-selected-end';
    else if (pickupVal && returnVal && dateStr > pickupVal && dateStr < returnVal) cls += ' cal-selected-range';
    else if (dateStr === todayStr) cls += ' cal-today';
    const clickable = !cls.includes('cal-past') && !cls.includes('cal-booked');
    html += `<div class="${cls}" ${clickable ? `onclick="calPickDate('${dateStr}')"` : ''}>${d}</div>`;
  }
  document.getElementById('calDays').innerHTML = html;
}

function calPickDate(dateStr) {
  const pickup = document.getElementById('bPickupDate');
  const ret = document.getElementById('bReturnDate');
  if (!pickup.value || (pickup.value && ret.value)) {
    pickup.value = dateStr;
    ret.value = '';
  } else if (dateStr <= pickup.value) {
    pickup.value = dateStr;
    ret.value = '';
  } else {
    ret.value = dateStr;
    updateSummary();
  }
  renderCalendar();
}

function calPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}
function calNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// Close on overlay click
document.getElementById('bookingModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeBookingModal();
});

function showBStep(n) {
  [1,2,3].forEach(i => document.getElementById(`bstep${i}`).style.display = i === n ? 'block' : 'none');
}

// Auto-calculate total when dates change
['bPickupDate','bReturnDate'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { updateSummary(); renderCalendar(); });
});

function updateSummary() {
  const p = document.getElementById('bPickupDate').value;
  const r = document.getElementById('bReturnDate').value;
  if (!p || !r || !selectedCar) return;
  const days = Math.ceil((new Date(r) - new Date(p)) / 86400000);
  if (days <= 0) return;
  const deliveryFee = pickupIsHQ ? 0 : 100;
  const base = days * Number(selectedCar.price);
  const discount = days > 7 ? Math.round(base * 0.10) : 0;
  const total = base - discount + deliveryFee;
  document.getElementById('bDays').textContent = `${days} day${days > 1 ? 's' : ''}${discount ? ' 🏷️ -10%' : ''}`;
  document.getElementById('bRate').textContent = `$${selectedCar.price}/day`;
  document.getElementById('bDeliveryRow').style.display = deliveryFee ? 'flex' : 'none';
  document.getElementById('bTotal').textContent = `$${total}`;
  document.getElementById('bSummary').style.display = 'block';
}

function goToPayment() {
  const pickup = pickupIsHQ ? 'Headquarters' : document.getElementById('bPickup').value.trim();
  const pickupDate = document.getElementById('bPickupDate').value;
  const returnDate = document.getElementById('bReturnDate').value;
  const name = document.getElementById('bName').value.trim();
  const email = document.getElementById('bEmail').value.trim();
  const err = document.getElementById('bError');

  if (!pickupIsHQ && !pickup) { err.textContent = 'Please enter a delivery address.'; return; }
  if (!pickupDate) { err.textContent = 'Please select a pick-up date.'; return; }
  if (!returnDate) { err.textContent = 'Please select a return date.'; return; }
  if (returnDate <= pickupDate) { err.textContent = 'Return date must be after pick-up date.'; return; }
  if (!name) { err.textContent = 'Please enter your full name.'; return; }
  if (!email || !email.includes('@')) { err.textContent = 'Please enter a valid email.'; return; }
  err.textContent = '';
  // Save booking draft and redirect to payment page
  const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000);
  if (days <= 0) { err.textContent = 'Return date must be after pick-up date.'; return; }
  const deliveryFee = pickupIsHQ ? 0 : 100;
  const base = days * Number(selectedCar.price);
  const discount = days > 7 ? Math.round(base * 0.10) : 0;
  const total = base - discount + deliveryFee;
  const draft = {
    pickup, pickupDate, returnDate, days,
    vehicle: selectedCar.id,
    vehicleName: `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`,
    customerName: name, customerEmail: email,
    customerPhone: document.getElementById('bPhone').value.trim(),
    paymentMethod: 'card', totalAmount: total, deliveryFee,
    userId: currentUser?.id || null
  };
  sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
  // Redirect to payment page
  window.location.href = 'payment.html';
}

function goBack() { showBStep(1); }

function selectPayMethod(method) {
  payMethod = method;
  document.getElementById('payCard').classList.toggle('active', method === 'card');
  document.getElementById('payCash').classList.toggle('active', method === 'cash');
  document.getElementById('cardFields').style.display = method === 'card' ? 'block' : 'none';
  document.getElementById('cashFields').style.display = method === 'cash' ? 'block' : 'none';
  if (method === 'card' && !stripeCardElement) {
    stripeInstance = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripeInstance.elements();
    stripeCardElement = elements.create('card', { style: { base: { fontSize: '16px', color: '#0d1b2a' } } });
    stripeCardElement.mount('#stripeCardElement');
    stripeCardElement.on('change', e => {
      document.getElementById('stripeCardError').textContent = e.error ? e.error.message : '';
    });
  }
}

async function submitBooking() {
  const err = document.getElementById('bPayError');
  err.textContent = '';

  const pickupDate = document.getElementById('bPickupDate').value;
  const returnDate = document.getElementById('bReturnDate').value;
  const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000);
  const pickup = pickupIsHQ ? 'Headquarters' : document.getElementById('bPickup').value.trim();
  const deliveryFee = pickupIsHQ ? 0 : 100;
  const base = days * Number(selectedCar.price);
  const discount = days > 7 ? Math.round(base * 0.10) : 0;
  const total = base - discount + deliveryFee;
  const name = document.getElementById('bName').value.trim();
  const email = document.getElementById('bEmail').value.trim();

  if (payMethod === 'card') {
    // 1. Create payment intent on backend
    let clientSecret;
    try {
      const piRes = await fetch(`${API}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          customerEmail: email,
          customerName: name,
          description: `${selectedCar.year} ${selectedCar.make} ${selectedCar.model} – ${pickupDate} to ${returnDate}`
        })
      });
      const piData = await piRes.json();
      if (!piRes.ok) { err.textContent = piData.message || 'Payment setup failed.'; return; }
      clientSecret = piData.clientSecret;
    } catch {
      err.textContent = 'Server offline. Please call 207-245-0080.';
      return;
    }

    // 2. Confirm card payment with Stripe
    const { error: stripeError, paymentIntent } = await stripeInstance.confirmCardPayment(clientSecret, {
      payment_method: { card: stripeCardElement, billing_details: { name, email } }
    });
    if (stripeError) { err.textContent = stripeError.message; return; }
    if (paymentIntent.status !== 'succeeded') { err.textContent = 'Payment was not completed.'; return; }
  }

  // 3. Save booking
  const payload = {
    pickup, pickupDate, returnDate,
    vehicle: selectedCar.id,
    vehicleName: `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`,
    customerName: name, customerEmail: email,
    customerPhone: document.getElementById('bPhone').value.trim(),
    paymentMethod: payMethod,
    totalAmount: total, deliveryFee,
    userId: currentUser?.id || null,
    status: payMethod === 'card' ? 'paid' : 'pending'
  };

  try {
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      document.getElementById('bSuccessName').textContent = name;
      document.getElementById('bSuccessEmail').textContent = email;
      document.getElementById('bSuccessDetails').innerHTML = `
        <div>🚗 <strong>${selectedCar.year} ${selectedCar.make} ${selectedCar.model}</strong></div>
        <div>📍 Pick-up: <strong>${payload.pickup}</strong></div>
        <div>📅 ${pickupDate} → ${returnDate} (${days} day${days > 1 ? 's' : ''})</div>
        <div>💳 Payment: <strong>${payMethod === 'card' ? 'Card – Paid' : 'Cash on Pickup'}</strong></div>
        <div>💰 Total: <strong>$${total}</strong>${discount ? ` <small style="color:#2ecc71">(10% weekly discount applied)</small>` : ''}</div>`;
      showBStep(3);
    } else {
      const r = await res.json();
      err.textContent = r.message || 'Something went wrong.';
    }
  } catch {
    err.textContent = 'Server offline. Please call 207-245-0080.';
  }
}

// ── HERO BOOKING FORM (quick search redirects to fleet) ───
const heroForm = document.getElementById('bookingForm');
if (heroForm) {
  heroForm.addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('fleet').scrollIntoView({ behavior: 'smooth' });
  });
}

// ── RATING ────────────────────────────────────────────────
let selectedRating = 0;
const stars = document.querySelectorAll('#starPicker .fa-star');
stars.forEach(star => {
  star.addEventListener('mouseover', () => highlightStars(+star.dataset.val));
  star.addEventListener('mouseout', () => highlightStars(selectedRating));
  star.addEventListener('click', () => {
    selectedRating = +star.dataset.val;
    document.getElementById('ratingVal').value = selectedRating;
    highlightStars(selectedRating);
  });
});
function highlightStars(val) {
  stars.forEach(s => s.classList.toggle('active', +s.dataset.val <= val));
}

document.getElementById('ratingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('ratingMsg');
  const rating = +document.getElementById('ratingVal').value;
  if (!rating) { msg.style.color = 'red'; msg.textContent = 'Please select a star rating.'; return; }
  try {
    const res = await fetch(`${API}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('ratingName').value.trim(),
        rating
      })
    });
    if (res.ok) {
      msg.style.color = 'green';
      msg.textContent = '✅ Thanks!';
      selectedRating = 0;
      highlightStars(0);
      document.getElementById('ratingName').value = '';
      document.getElementById('ratingVal').value = 0;
    } else { msg.style.color = 'red'; msg.textContent = '❌ Something went wrong.'; }
  } catch { msg.style.color = 'red'; msg.textContent = '❌ Server offline.'; }
});

// ── CONTACT FORM ──────────────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('contactMsg');
  const data = Object.fromEntries(new FormData(e.target));
  try {
    const res = await fetch(`${API}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      msg.style.color = 'green';
      msg.textContent = "✅ Message sent! We'll get back to you soon.";
      e.target.reset();
    } else {
      msg.style.color = 'red';
      msg.textContent = '❌ Something went wrong. Please try again.';
    }
  } catch {
    msg.style.color = 'red';
    msg.textContent = '❌ Server offline. Please call 207-245-0080.';
  }
});

// ===== Pre-start overlay behavior =====
function initPreStart() {
  const overlay = document.getElementById('preStartOverlay');
  if (!overlay) return;
  const seen = localStorage.getItem('seenPreStart');
  if (seen === '1') { overlay.style.display = 'none'; return; }
  overlay.style.display = 'flex';
  const startBtn = document.getElementById('startExperienceBtn');
  const viewBtn = document.getElementById('viewFleetBtn');
  const closeBtn = document.getElementById('prestartClose');
  const dont = document.getElementById('dontShowAgain');
  if (startBtn) startBtn.addEventListener('click', () => {
    if (dont && dont.checked) localStorage.setItem('seenPreStart','1');
    overlay.style.display = 'none';
    document.getElementById('fleet').scrollIntoView({ behavior: 'smooth' });
  });
  if (viewBtn) viewBtn.addEventListener('click', () => { overlay.style.display = 'none'; document.getElementById('fleet').scrollIntoView({ behavior: 'smooth' }); });
  if (closeBtn) closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });
}

document.addEventListener('DOMContentLoaded', initPreStart);
