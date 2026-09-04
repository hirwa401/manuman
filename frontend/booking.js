const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://manuman-api.vercel.app/api';

let selectedCar = null;
let pickupIsHQ = true;
let bookedRanges = [];
let calYear, calMonth;
const today = new Date().toISOString().split('T')[0];

// ── FLEET ─────────────────────────────────────────────────
async function loadFleet() {
  const grid = document.getElementById('carSelectGrid');
  try {
    const res = await fetch(`${API_URL}/fleet`);
    const fleet = await res.json();
    if (!fleet.length) { grid.innerHTML = '<p style="color:#aaa">No vehicles available right now.</p>'; return; }
    grid.innerHTML = fleet.map(car => `
      <div class="car-select-card" id="car-${car.id}" onclick="selectCar(${JSON.stringify(car).replace(/"/g,'&quot;')})">
        <img src="${car.image_url || 'images/fleet-card.png'}" alt="${car.year} ${car.make} ${car.model}" onerror="this.src='images/fleet-card.png'"/>
        <div class="car-select-info">
          <h4>${car.year} ${car.make} ${car.model}</h4>
          <span>$${car.price}/day</span>
        </div>
      </div>`).join('');
  } catch {
    grid.innerHTML = '<p style="color:#e74c3c">Could not load fleet. Please call 207-245-0080.</p>';
  }
}

async function selectCar(car) {
  selectedCar = car;
  document.querySelectorAll('.car-select-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`car-${car.id}`)?.classList.add('selected');
  bookedRanges = [];
  try {
    const res = await fetch(`${API_URL}/bookings/availability/${car.id}`);
    bookedRanges = await res.json();
  } catch {}
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
  updateSummary();
}

// ── PICKUP ────────────────────────────────────────────────
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

// ── CALENDAR ──────────────────────────────────────────────
function isBooked(dateStr) {
  return bookedRanges.some(r => dateStr >= r.pickup_date && dateStr <= r.return_date);
}

function renderCalendar() {
  if (!document.getElementById('calDays')) return;
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
    pickup.value = dateStr; ret.value = '';
  } else if (dateStr <= pickup.value) {
    pickup.value = dateStr; ret.value = '';
  } else {
    ret.value = dateStr; updateSummary();
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

// ── SUMMARY ───────────────────────────────────────────────
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
  document.getElementById('sumVehicle').textContent = `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`;
  document.getElementById('sumDays').textContent = `${days} day${days > 1 ? 's' : ''}${discount ? ' 🏷️ -10%' : ''}`;
  document.getElementById('sumRate').textContent = `$${selectedCar.price}/day`;
  document.getElementById('sumDeliveryRow').style.display = deliveryFee ? 'flex' : 'none';
  document.getElementById('sumTotal').textContent = `$${total}`;
  document.getElementById('summaryCard').style.display = 'block';
}

function toggleTerms() {
  alert('Please scroll down to read the full Terms & Conditions on our home page.');
}

// ── SUBMIT ────────────────────────────────────────────────
async function submitBookingPage() {
  const err = document.getElementById('bPageError');
  const btn = document.getElementById('bPageSubmit');
  err.textContent = '';

  if (!selectedCar) { err.textContent = 'Please select a vehicle.'; return; }
  const pickup = pickupIsHQ ? 'Headquarters' : document.getElementById('bPickup').value.trim();
  const pickupDate = document.getElementById('bPickupDate').value;
  const returnDate = document.getElementById('bReturnDate').value;
  const name = document.getElementById('bName').value.trim();
  const email = document.getElementById('bEmail').value.trim();
  const phone = document.getElementById('bPhone').value.trim();
  const driverLicense = document.getElementById('bDriverLicense').value.trim();
  const driverLicenseFile = document.getElementById('bDriverLicenseImage')?.files?.[0] || null;
  const termsAccepted = document.getElementById('bTermsAccepted').checked;

  if (!pickupIsHQ && !pickup) { err.textContent = 'Please enter a delivery address.'; return; }
  if (!pickupDate) { err.textContent = 'Please select a pick-up date.'; return; }
  if (!returnDate) { err.textContent = 'Please select a return date.'; return; }
  if (returnDate <= pickupDate) { err.textContent = 'Return date must be after pick-up date.'; return; }
  if (!name) { err.textContent = 'Please enter your full name.'; return; }
  if (!email || !email.includes('@')) { err.textContent = 'Please enter a valid email.'; return; }
  if (!driverLicense) { err.textContent = "Please enter your driver's license number."; return; }
  if (!driverLicenseFile) { err.textContent = "Please upload a photo of your driver's license."; return; }
  if (!termsAccepted) { err.textContent = 'Please agree to the Terms & Conditions.'; return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

  try {
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': driverLicenseFile.type || 'image/jpeg' },
      body: await driverLicenseFile.arrayBuffer()
    });
    const uploadData = await res.json();
    if (!res.ok || !uploadData.url) throw new Error(uploadData.message || 'License photo upload failed.');

    const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000);
    const deliveryFee = pickupIsHQ ? 0 : 100;
    const base = days * Number(selectedCar.price);
    const discount = days > 7 ? Math.round(base * 0.10) : 0;
    const total = base - discount + deliveryFee;

    const draft = {
      pickup, pickupDate, returnDate, days,
      vehicle: selectedCar.id,
      vehicleName: `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`,
      customerName: name, customerEmail: email, customerPhone: phone,
      driverLicense, driverLicenseImage: uploadData.url,
      termsAccepted: true,
      paymentMethod: 'card',
      totalAmount: total, deliveryFee,
      userId: null
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
    window.location.href = 'payment.html';
  } catch (e) {
    err.textContent = e.message || 'Something went wrong. Please try again.';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-lock"></i> Continue to Payment';
  }
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="date"]').forEach(i => i.setAttribute('min', today));
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
  loadFleet();

  // Pre-select car if passed via URL param
  const params = new URLSearchParams(window.location.search);
  const carId = params.get('car');
  if (carId) {
    fetch(`${API_URL}/fleet`).then(r => r.json()).then(fleet => {
      const car = fleet.find(c => c.id === carId);
      if (car) selectCar(car);
    }).catch(() => {});
  }
});
