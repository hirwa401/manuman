import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Vehicle from './pages/Vehicle';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import IdentityComplete from './pages/IdentityComplete';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Host from './pages/Host';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import GlassToggle from './components/GlassToggle';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <GlassToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vehicle/:id" element={<Vehicle />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/identity-complete" element={<IdentityComplete />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/host" element={<Host />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
