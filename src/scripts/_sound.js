// sound — sound toggle (reads soundToggle.dataset.labelUnmute/labelMute)
const soundToggle = document.getElementById('soundToggle');
if (video && soundToggle) {
  let isMuted = true; // browsers require muted for autoplay; user unmutes explicitly
  function applySound() {
    video.muted = isMuted;
    if (!isMuted) video.volume = 0.1;
    soundToggle.classList.toggle('is-muted', isMuted);
    const labelUnmute = soundToggle.dataset.labelUnmute || 'Unmute sound';
    const labelMute   = soundToggle.dataset.labelMute   || 'Mute sound';
    soundToggle.setAttribute('aria-label', isMuted ? labelUnmute : labelMute);
    soundToggle.title = isMuted ? labelUnmute : labelMute;
  }
  applySound();
  soundToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    applySound();
  });
}
