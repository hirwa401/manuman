// Nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// Set min date to today
const today = new Date().toISOString().split('T')[0];
document.querySelectorAll('input[type="date"]').forEach(input => input.setAttribute('min', today));

// Load fleet from API
async function loadFleet() {
  try {
    const res = await fetch('http://localhost:5000/api/fleet');
    const fleet = await res.json();
    const grid = document.getElementById('carsGrid');
    const select = document.getElementById('vehicleSelect');
    select.innerHTML = '<option value="">Select a car</option>';
    grid.innerHTML = fleet.map((car, i) => `
      <div class="car-card ${i === 1 ? 'featured' : ''}">
        <div class="car-badge">${car.category}</div>
        ${i === 1 ? '<div class="featured-tag">Most Popular</div>' : ''}
        <img src="${car.imageUrl || 'images/fleet-card.png'}" alt="${car.year} ${car.make} ${car.model}" />
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
            <a href="#booking" class="btn-secondary">Book Now</a>
          </div>
        </div>
      </div>`).join('');
    fleet.forEach(car => {
      const opt = document.createElement('option');
      opt.value = car._id;
      opt.textContent = `${car.year} ${car.make} ${car.model}`;
      select.appendChild(opt);
    });
  } catch {
    document.getElementById('carsGrid').innerHTML = '<p style="text-align:center;color:#888;padding:40px">Could not load fleet. Is the server running?</p>';
  }
}
loadFleet();

// Booking form
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  if (data.returnDate < data.pickupDate) {
    alert('Return date must be after pick-up date.');
    return;
  }
  try {
    const res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      alert('✅ Booking request received! We will contact you shortly.');
      e.target.reset();
    } else {
      alert('Error: ' + (result.message || 'Something went wrong.'));
    }
  } catch {
    alert('Could not connect to server. Please call us at 207-245-0080.');
  }
});

// Contact form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('contactMsg');
  const data = Object.fromEntries(new FormData(e.target));
  try {
    const res = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      msg.textContent = '✅ Message sent! We\'ll get back to you soon.';
      e.target.reset();
    } else {
      msg.textContent = '❌ Something went wrong. Please try again.';
      msg.style.color = 'red';
    }
  } catch {
    msg.textContent = '❌ Server offline. Please call 207-245-0080.';
    msg.style.color = 'red';
  }
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  document.querySelector('.navbar').style.boxShadow =
    window.scrollY > 50 ? '0 2px 20px rgba(0,0,0,0.4)' : 'none';
});
