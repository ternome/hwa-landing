// video — hero video autoplay + cross-fade from keyart poster
// Video autoplay + sound toggle + cross-fade from keyart poster
const video = document.querySelector('.hero__video');
if (video) {
  video.volume = 0.1; // 10% — gentle ambient when unmuted
  // Fade in once frames actually start rendering (no flash, no snap)
  video.addEventListener('playing', () => video.classList.add('is-ready'), { once: true });
  // Safety net: if autoplay is gated, reveal anyway after 4s so we don't sit on a frozen poster forever
  setTimeout(() => video.classList.add('is-ready'), 4000);
  video.play().catch(() => {});
}
