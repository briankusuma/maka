export function initStatistics(root, { gsap }) {
  const section = root.querySelector('[data-statistics]');
  if (!section) return;

  const counters = section.querySelectorAll('[data-count]');
  const cleanups = [];

  // Konteks GSAP pemanggil memiliki tween/trigger, termasuk saat HMR.
  for (const counter of counters) {
    const finalValue = Number(counter.dataset.count);
    const state = { value: 0 };
    const output = counter.querySelector('[data-count-value]');
    if (!output) continue;

    // Count-up memiliki nilai dasar; gaze hanya menambahkan offset hover.
    function render(value) {
      counter.dataset.countCurrent = String(value);
      output.textContent = String(value + Number(section.dataset.countOffset || 0));
    }

    const tween = gsap.to(state, {
      value: finalValue,
      duration: 1.6,
      ease: 'power2.out',
      snap: { value: 1 },
      scrollTrigger: {
        trigger: counter,
        start: 'top 95%',
        once: true,
      },
      onUpdate() {
        render(state.value);
      },
      onComplete() {
        render(finalValue);
      },
    });

    // DOM text bukan properti tween, jadi pulihkan secara eksplisit.
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
      render(finalValue);
      delete counter.dataset.countCurrent;
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
