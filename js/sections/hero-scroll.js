// Wrapper scroll terpisah dari target entrance preloader dan sequence foto.
export function initHeroScroll(root, { gsap, header }) {
  const surface = root?.querySelector('[data-hero-surface]');
  if (!surface) return () => {};

  const context = gsap.context(() => {
    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    timeline.fromTo(surface, { y: 0 }, {
      y: () => root.offsetHeight * (window.innerWidth < 768 ? 0.15 : 0.4),
      duration: 1,
    }, 0);
    if (header) {
      timeline.fromTo(header, { y: 0 }, {
        y: () => Math.min(root.offsetHeight * 0.3, window.innerHeight * 0.3),
        duration: 1,
      }, 0);
    }
  }, root);

  return () => context.revert();
}
