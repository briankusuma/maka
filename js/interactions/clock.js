export function initClock(root) {
  const clock = root.querySelector('[data-clock]');
  if (!clock) return () => {};

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const updateClock = () => {
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = formatter.format(now);
  };

  updateClock();
  // Jam berubah per menit; tidak perlu bekerja pada setiap frame animasi.
  const timer = window.setInterval(updateClock, 60_000);
  return () => window.clearInterval(timer);
}
