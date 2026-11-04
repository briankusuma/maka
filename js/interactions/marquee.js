export function initMarquee(root, { gsap }) {
  // Hook perilaku terpisah dari class styling BEM.
  const track = root.querySelector('[data-marquee-track]');
  if (!track) return;

  gsap.to(track, {
    xPercent: -50,
    duration: 24,
    ease: 'none',
    repeat: -1,
  });
}
