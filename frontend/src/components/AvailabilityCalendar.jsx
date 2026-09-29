import { useMemo, useState } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Month-view calendar: shows booked days from real bookings and lets the
// user pick a pickup/return range. Replaces the old DOM-rendered calendar.
export default function AvailabilityCalendar({ bookedRanges = [], pickupDate, returnDate, onPick }) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const todayStr = isoDate(now);

  const cells = useMemo(() => {
    const firstDay = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < firstDay; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push(isoDate(new Date(view.year, view.month, d)));
    }
    return list;
  }, [view]);

  const isBooked = (dateStr) => bookedRanges.some((r) => dateStr >= r.pickup_date && dateStr <= r.return_date);

  const move = (delta) => {
    setView(({ year, month }) => {
      const m = month + delta;
      if (m < 0) return { year: year - 1, month: 11 };
      if (m > 11) return { year: year + 1, month: 0 };
      return { year, month: m };
    });
  };

  return (
    <div className="avail-calendar">
      <div className="avail-cal-nav">
        <button type="button" aria-label="Previous month" onClick={() => move(-1)}>
          <i className="fas fa-chevron-left" />
        </button>
        <span>{MONTHS[view.month]} {view.year}</span>
        <button type="button" aria-label="Next month" onClick={() => move(1)}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>
      <div className="avail-cal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
      </div>
      <div className="avail-cal-days">
        {cells.map((dateStr, idx) => {
          if (!dateStr) return <div key={`empty-${idx}`} className="cal-day cal-empty" />;
          const dayNum = Number(dateStr.slice(-2));
          let cls = 'cal-day';
          if (dateStr < todayStr) cls += ' cal-past';
          else if (isBooked(dateStr)) cls += ' cal-booked';
          else if (dateStr === pickupDate) cls += ' cal-selected-start';
          else if (dateStr === returnDate) cls += ' cal-selected-end';
          else if (pickupDate && returnDate && dateStr > pickupDate && dateStr < returnDate) cls += ' cal-selected-range';
          else if (dateStr === todayStr) cls += ' cal-today';
          const clickable = !cls.includes('cal-past') && !cls.includes('cal-booked');
          return (
            <div
              key={dateStr}
              className={cls}
              onClick={clickable ? () => onPick(dateStr) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(dateStr); } } : undefined}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
      <div className="avail-cal-legend">
        <span><i className="leg-dot leg-avail" /> Available</span>
        <span><i className="leg-dot leg-booked" /> Booked</span>
        <span><i className="leg-dot leg-selected" /> Selected</span>
      </div>
    </div>
  );
}
