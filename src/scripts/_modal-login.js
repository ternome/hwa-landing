// modal-login — login modal email->code, magic code 123123 redirects to game
// Modal control
const modal = document.getElementById('loginModal');
const emailInput = document.getElementById('emailInput');
const emailError = document.getElementById('emailError');
const getCodeBtn = document.getElementById('getCodeBtn');
const sentEmail = document.getElementById('sentEmail');
const stages = modal.querySelectorAll('.stage');
const codeInputs = modal.querySelectorAll('.modal__code-input');
const codeError = document.getElementById('codeError');
const resendBtn = document.getElementById('resendBtn');

let resendTimer = null;

function clearEmailError() {
  emailInput.classList.remove('is-error');
  emailError.textContent = '';
}

function clearCodeError() {
  codeInputs.forEach(i => i.classList.remove('is-error'));
  codeError.textContent = '';
}

function openModal() {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  clearEmailError();
  clearCodeError();
  setTimeout(() => emailInput.focus(), 300);
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  showStage('email');
  clearEmailError();
  clearCodeError();
  if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
}

function showStage(name) {
  stages.forEach(s => s.classList.toggle('is-active', s.dataset.stage === name));
}

function startResendCountdown() {
  let s = 16;
  const baseLabel = resendBtn.dataset.resendLabel || 'Resend email';
  resendBtn.disabled = true;
  resendBtn.textContent = `${baseLabel} (${s}s)`;
  if (resendTimer) clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    s -= 1;
    if (s <= 0) {
      clearInterval(resendTimer);
      resendTimer = null;
      resendBtn.disabled = false;
      resendBtn.textContent = baseLabel;
    } else {
      resendBtn.textContent = `${baseLabel} (${s}s)`;
    }
  }, 1000);
}

// Open triggers — PLAY NOW also fires click-feedback sound
const btnSound = new Audio('assets/button-feedback.mp3');
btnSound.preload = 'auto';
btnSound.volume = 0.65;
document.querySelector('.btn-play').addEventListener('click', (e) => {
  e.preventDefault();
  // Only play click feedback when global sound toggle is on (video unmuted)
  if (video && !video.muted) {
    try { btnSound.currentTime = 0; btnSound.play().catch(() => {}); } catch (_) {}
  }
  openModal();
});
document.querySelector('.btn-enter').addEventListener('click', (e) => { e.preventDefault(); openModal(); });

// Close triggers
modal.querySelector('[data-modal-close]').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

// Back to email stage
modal.querySelector('[data-stage-back]').addEventListener('click', () => { clearCodeError(); showStage('email'); });

// Email submit
function submitEmail() {
  const v = emailInput.value.trim();
  if (!v) {
    emailInput.classList.add('is-error');
    emailError.textContent = emailError.dataset.errorEmpty;
    emailInput.focus();
    return;
  }
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (!validEmail) {
    emailInput.classList.add('is-error');
    emailError.textContent = emailError.dataset.errorInvalid;
    emailInput.focus();
    return;
  }
  clearEmailError();
  clearCodeError();
  sentEmail.textContent = v;
  showStage('code');
  setTimeout(() => codeInputs[0].focus(), 200);
  startResendCountdown();
}
getCodeBtn.addEventListener('click', submitEmail);
emailInput.addEventListener('input', clearEmailError);
emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitEmail(); });
emailInput.addEventListener('paste', (e) => {
  const pasted = (e.clipboardData.getData('text') || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pasted)) {
    setTimeout(submitEmail, 150);
  }
});

// 6-digit code input behavior
function tryRedeem() {
  const code = Array.from(codeInputs).map(i => i.value).join('');
  if (code.length !== 6) return;
  if (code === '123123') {
    window.location.href = 'https://hero-wars-alliance.com/';
  } else {
    codeInputs.forEach(i => i.classList.add('is-error'));
    codeError.textContent = codeError.dataset.errorCode;
  }
}
codeInputs.forEach((input, i) => {
  input.addEventListener('input', (e) => {
    const v = e.target.value.replace(/\D/g, '');
    e.target.value = v.slice(0, 1);
    clearCodeError();
    if (e.target.value && i < codeInputs.length - 1) codeInputs[i + 1].focus();
    tryRedeem();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) codeInputs[i - 1].focus();
    if (e.key === 'ArrowLeft' && i > 0) codeInputs[i - 1].focus();
    if (e.key === 'ArrowRight' && i < codeInputs.length - 1) codeInputs[i + 1].focus();
  });
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    digits.split('').forEach((d, idx) => { if (codeInputs[idx]) codeInputs[idx].value = d; });
    const next = Math.min(digits.length, codeInputs.length - 1);
    codeInputs[next].focus();
    tryRedeem();
  });
});

resendBtn.addEventListener('click', () => { if (!resendBtn.disabled) startResendCountdown(); });
