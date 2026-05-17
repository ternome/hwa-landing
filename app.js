const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const video = document.querySelector('.hero__video');
if (video) {
  video.play().catch(() => {});
}
