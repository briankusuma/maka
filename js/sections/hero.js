export function initHero(root, { gsap }) {
  const hero = root.querySelector('[data-hero]');
  if (!hero) return;

  const figures = hero.querySelectorAll('[data-hero-figure]');
  const copy = hero.querySelector('[data-hero-copy]');
  const art = hero.querySelector('[data-hero-art]');

  // Entrance memakai wrapper; hover/parallax kelak memakai gambar di dalam.
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(root.querySelector('[data-header]'), {
      opacity: 0,
      y: -12,
      duration: 0.7,
    })
    .from(copy, { opacity: 0, y: 18, duration: 0.8 }, 0.15)
    .from(figures, {
      clipPath: 'inset(100% 0 0 0)',
      duration: 1.1,
      stagger: 0.12,
    }, 0.2)
    .from(art, { yPercent: 25, opacity: 0, duration: 1 }, 0.3);
}
