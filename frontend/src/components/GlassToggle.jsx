/* Runtime glass-intensity toggle.
   Levels write a `data-glass` attribute on <html>; global.css maps each
   level to different blur-tier token values, so the whole theme reacts
   from one attribute. "off" removes blur entirely (solid fills). */

const KEY = 'manuman.glass';
export const GLASS_LEVELS = ['off', 'low', 'normal', 'high'];
const DEFAULT_LEVEL = 'normal';

export function getGlassLevel() {
  try {
    const v = localStorage.getItem(KEY);
    return GLASS_LEVELS.includes(v) ? v : DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL;
  }
}

export function setGlassLevel(level) {
  if (!GLASS_LEVELS.includes(level)) return;
  try {
    localStorage.setItem(KEY, level);
  } catch {
    /* private mode etc. — attribute still applied below */
  }
  applyGlassLevel(level);
}

export function applyGlassLevel(level) {
  if (!GLASS_LEVELS.includes(level)) return;
  document.documentElement.setAttribute('data-glass', level);
}

export default function GlassToggle() {
  return (
    <div className="glass-toggle" role="group" aria-label="Glass intensity">
      <i className="fas fa-droplet glass-toggle-icon" aria-hidden="true" />
      {GLASS_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          className={`glass-toggle-btn ${getGlassLevel() === level ? 'active' : ''}`}
          data-level={level}
          aria-pressed={getGlassLevel() === level}
          onClick={(e) => {
            setGlassLevel(level);
            const group = e.currentTarget.parentElement;
            group.querySelectorAll('.glass-toggle-btn').forEach((b) => {
              const on = b.dataset.level === level;
              b.classList.toggle('active', on);
              b.setAttribute('aria-pressed', String(on));
            });
          }}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
