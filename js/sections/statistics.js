import { initIntroduction } from './introduction.js';

export function initStatistics(root, services) {
  const { gsap } = services;
  const section = root.querySelector('[data-statistics]');
  if (!section) return;

  const counters = section.querySelectorAll('[data-count]');
  const cleanups = [];

  // Konteks GSAP pemanggil memiliki tween/trigger, termasuk saat HMR.
  for (const counter of counters) {
    const finalValue = Number(counter.dataset.count);
    const state = { progress: 0 };
    const output = counter.querySelector('[data-count-value]');
    if (!output) continue;

    const plus = counter.nextElementSibling;
    counter.dataset.countCurrent = String(finalValue);
    counter.dataset.countScrambling = 'true';
    const cipher = initIntroduction(output, { ...services, manual: true, hover: false });
    gsap.set(plus, { opacity: 0 });

    // Saat entry selesai, kepemilikan digit diserahkan kembali ke gaze.
    function showFinal() {
      cipher();
      delete counter.dataset.countScrambling;
      output.textContent = String(finalValue + Number(section.dataset.countOffset || 0));
      gsap.set(plus, { clearProps: 'opacity' });
    }

    const tween = gsap.to(state, {
      progress: 1,
      duration: 1.4,
      ease: 'none',
      scrollTrigger: {
        trigger: counter,
        start: 'top 85%',
        once: true,
      },
      onUpdate() {
        cipher.render(state.progress);
        gsap.set(plus, { opacity: Math.min(1, state.progress * 5) });
      },
      onComplete() {
        showFinal();
      },
    });

    // DOM text bukan properti tween, jadi pulihkan secara eksplisit.
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
      showFinal();
      delete counter.dataset.countCurrent;
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
