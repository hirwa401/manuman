// Nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// Set min date to today for date inputs
const today = new Date().toISOString().split('T')[0];
document.querySelectorAll('input[type="date"]').forEach(input => input.setAttribute('min', today));

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
