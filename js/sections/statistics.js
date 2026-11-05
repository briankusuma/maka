export function initStatistics(root, { gsap }) {
  const section = root.querySelector('[data-statistics]');
  if (!section) return;

  const counters = section.querySelectorAll('[data-count]');
  const cleanups = [];

  // Konteks GSAP pemanggil memiliki tween/trigger, termasuk saat HMR.
  for (const counter of counters) {
    const finalValue = Number(counter.dataset.count);
    const state = { value: 0 };
    const finalText = String(finalValue);
    const output = counter.querySelector('[data-count-value]');
    if (!output) continue;

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
        output.textContent = String(state.value);
      },
      onComplete() {
        output.textContent = finalText;
      },
    });

    // DOM text bukan properti tween, jadi pulihkan secara eksplisit.
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
      output.textContent = finalText;
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
