let hideTimer = null;

export function showToast(message, { sticky = false, duration = 2200 } = {}) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.hidden = false;
  if (hideTimer) clearTimeout(hideTimer);
  if (!sticky) {
    hideTimer = setTimeout(hideToast, duration);
  }
}

export function hideToast() {
  const el = document.getElementById("toast");
  el.hidden = true;
}
