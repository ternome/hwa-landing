// online-counter — players-online counter (pulse + fluctuating number)
// Live "players online" counter — small fluctuations with slight upward drift
(() => {
  const fmt = n => n.toLocaleString('en-US').replace(/,/g, ' ');
  const els = document.querySelectorAll('.players__count');
  if (!els.length) return;
  let count = 253434;
  const MIN = 251000, MAX = 256500;

  function tick() {
    // Mostly +/- 1-6, occasionally a bigger jump
    const big = Math.random() < 0.12;
    const range = big ? 18 : 6;
    const delta = Math.round((Math.random() - 0.45) * range * 2);
    const newCount = Math.max(MIN, Math.min(MAX, count + delta));
    const dir = newCount > count ? 'up' : newCount < count ? 'down' : null;
    count = newCount;
    const text = fmt(count);
    els.forEach(el => {
      el.textContent = text;
      el.classList.remove('is-flash-up', 'is-flash-down');
      if (dir) {
        // Force reflow so animation re-triggers
        void el.offsetWidth;
        el.classList.add('is-flash-' + dir);
        setTimeout(() => el.classList.remove('is-flash-up', 'is-flash-down'), 360);
      }
    });
    setTimeout(tick, 600 + Math.random() * 900);
  }
  setTimeout(tick, 900);
})();
