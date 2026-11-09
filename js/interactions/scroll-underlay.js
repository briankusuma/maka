// Mask section membuka surface yang bergerak lebih lambat dari scroll halaman.
export function initScrollUnderlay(root, { gsap, requestRefresh, surfaceSelector }) {
  const surface = root?.querySelector(surfaceSelector);
  if (!surface) return () => {};

  const context = gsap.context(() => {
    gsap.fromTo(surface, {
      y: () => -Math.min(
        root.offsetHeight * 0.3,
        window.innerHeight * (window.innerWidth < 768 ? 0.12 : 0.3),
      ),
    }, {
      y: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top bottom',
        // Footer tinggi harus terbuka penuh sebelum konten atas lewat viewport.
        end: () => root.offsetHeight > window.innerHeight ? 'top top' : 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }, root);

  requestRefresh();
  return () => context.revert();
}
