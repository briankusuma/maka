// Tween sinkron dimiliki context matchMedia milik pemanggil.
export function initReveals(root, { gsap, motion }) {
  const elements = root.querySelectorAll('[data-reveal]');

  for (const element of elements) {
    gsap.from(element, {
      y: motion.revealDistance,
      opacity: 0,
      duration: motion.duration,
      ease: motion.ease,
      scrollTrigger: {
        trigger: element,
        start: 'top 92%',
        once: true,
      },
    });
  }
}
