// modal-trailer — YouTube trailer modal (eyebrow [data-open-trailer] opens it)
// ── Trailer modal (YouTube) ─────────────────────────────────────
const trailerModal = document.getElementById('trailerModal');
const trailerFrame = document.getElementById('trailerFrame');
const TRAILER_ID = 'aUljHX1XmY0';

function openTrailer() {
  if (!trailerModal) return;
  trailerFrame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + TRAILER_ID + '?autoplay=1&rel=0&modestbranding=1" title="Season 32 trailer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
  trailerModal.classList.add('is-open');
  trailerModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeTrailer() {
  if (!trailerModal) return;
  trailerFrame.innerHTML = '';
  trailerModal.classList.remove('is-open');
  trailerModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
document.querySelectorAll('[data-open-trailer]').forEach(el => {
  el.addEventListener('click', (e) => { e.preventDefault(); openTrailer(); });
});
trailerModal.addEventListener('click', (e) => {
  if (e.target === trailerModal || e.target.matches('[data-close-trailer]')) closeTrailer();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && trailerModal.classList.contains('is-open')) closeTrailer();
});
