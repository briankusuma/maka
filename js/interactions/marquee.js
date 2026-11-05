export function initMarquee(root, { gsap }) {
  // Hook perilaku terpisah dari class styling BEM.
  for (const track of root.querySelectorAll('[data-marquee-track]')) {
    gsap.to(track, {
      xPercent: -50,
      duration: 24,
      ease: 'none',
      repeat: -1,
    });
  }
}
