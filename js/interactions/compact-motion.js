// Native scroll dan reveal singkat untuk tablet/mobile, tanpa split-text atau pin.
export function initCompactMotion(root, { gsap }) {
  const context = gsap.context(() => {
    const elements = root.querySelectorAll(
      '[data-reveal], [data-cipher-reveal], [data-statistics-cipher], '
      + '[data-why-cipher], .statistics__number',
    );
    for (const element of elements) {
      gsap.fromTo(element, { opacity: 0, y: 12 }, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 94%', once: true },
      });
    }
  }, root);
  return () => context.revert();
}
