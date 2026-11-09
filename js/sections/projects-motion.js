// Overlay dekoratif memiliki transform sendiri; Swiper tetap memiliki track.
export function initProjectsMotion(root, { gsap, requestRefresh, scroll }) {
  const button = root?.querySelector('[data-project-open="3"]');
  const source = button?.querySelector('img');
  if (!source) return () => {};

  const media = gsap.matchMedia();
  media.add('(min-width: 1440px) and (min-height: 720px)', () => {
    root.classList.add('projects--motion');
    const content = root.querySelector('.projects__content');
    const originalInert = content.inert;
    const events = new AbortController();
    let sceneTimeline;
    const overlay = document.createElement('div');
    overlay.className = 'projects__morph';
    overlay.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.className = 'projects__morph-image';
    image.src = source.currentSrc || source.src;
    image.alt = '';
    image.width = source.width;
    image.height = source.height;
    image.decoding = 'async';
    overlay.append(image);
    root.append(overlay);

    const services = root.querySelector('[data-services]');
    const firstYear = root.querySelector('.projects__year--2024');
    const secondYear = root.querySelector('.projects__year--2025');
    const metadata = secondYear.querySelectorAll('.projects__year-label, .project-card__caption, .project-card__type');
    const dividers = root.querySelector('.projects__dividers');
    const scene = { phase: 0 };
    const ease = gsap.parseEase('power2.inOut');
    let geometry;

    function renderMorph() {
      if (!geometry) return;
      // Satu progress mengendalikan mask dan gambar, termasuk setelah refresh.
      const shrink = ease(gsap.utils.clamp(0, 1, (scene.phase * 2.2 - 0.15) / 1));
      const move = ease(gsap.utils.clamp(0, 1, (scene.phase * 2.2 - 1.35) / 0.85));
      const width = gsap.utils.interpolate(geometry.width, geometry.targetWidth, shrink);
      const height = gsap.utils.interpolate(geometry.height, geometry.targetHeight, shrink);
      const x = geometry.centerX * shrink + (geometry.finalX - geometry.centerX) * move;
      const y = geometry.centerY * shrink + (geometry.finalY - geometry.centerY) * move;
      const right = geometry.width - x - width;
      const bottom = geometry.height - y - height;
      overlay.style.clipPath = `inset(${y}px ${right}px ${bottom}px ${x}px round ${290 * shrink}px)`;
      gsap.set(image, {
        xPercent: -50,
        yPercent: -50,
        x: geometry.x * move,
        y: geometry.y * move,
        scale: gsap.utils.interpolate(1, geometry.scale, shrink),
      });
    }

    function measure() {
      const bounds = root.getBoundingClientRect();
      const target = button.getBoundingClientRect();
      const width = root.clientWidth;
      const height = root.clientHeight;
      const x = target.left - bounds.left;
      const y = target.top - bounds.top;
      const centerX = (width - target.width) / 2;
      const centerY = (height - target.height) / 2;
      // Source ratio ditetapkan dari aset asli; object-fit kedua gambar sama.
      const naturalWidth = source.naturalWidth || 1199;
      const naturalHeight = source.naturalHeight || 898;
      const coverScale = Math.max(width / naturalWidth, height / naturalHeight);
      // Gambar utuh lebih besar dari mask; crop tidak ikut terpotong saat scale.
      image.style.width = `${naturalWidth * coverScale}px`;
      image.style.height = `${naturalHeight * coverScale}px`;
      const scale = Math.max(target.width / naturalWidth, target.height / naturalHeight)
        / coverScale;
      geometry = {
        width,
        height,
        targetWidth: target.width,
        targetHeight: target.height,
        centerX,
        centerY,
        finalX: x,
        finalY: y,
        x: x + target.width / 2 - width / 2,
        y: y + target.height / 2 - height / 2,
        scale,
      };
    }

    measure();
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${window.innerHeight * 1.8}`,
          pin: true,
          scrub: 0.45,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          onRefresh: renderMorph,
          onUpdate: self => { content.inert = self.progress < 0.96; },
        },
      });
      sceneTimeline = timeline;
      timeline
        .fromTo(scene, { phase: 0 }, {
          phase: 1,
          duration: 2.2,
          ease: 'none',
          onUpdate: renderMorph,
        }, 0)
        .fromTo([services, firstYear, dividers], { autoAlpha: 0, y: 24 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.07,
        }, 1.35)
        .fromTo(metadata, { autoAlpha: 0, y: 8 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.04,
        }, 1.95)
        .fromTo(button, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 2.2)
        .to(overlay, { autoAlpha: 0, duration: 0.08 }, 2.2)
        .to({}, { duration: 0.12 });
    }, root);
    renderMorph();
    content.inert = sceneTimeline.scrollTrigger.progress < 0.96;

    // Link layanan di footer menuju komposisi akhir, bukan bagian scene tersembunyi.
    root.ownerDocument.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#service-link-"]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = root.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const destination = sceneTimeline.scrollTrigger.end + 1;
      const complete = () => {
        sceneTimeline.progress(1);
        content.inert = false;
        target.focus({ preventScroll: true });
      };
      if (scroll?.lenis) {
        scroll.lenis.scrollTo(destination, { onComplete: complete });
      } else {
        window.scrollTo({ top: destination, behavior: 'instant' });
        complete();
      }
    }, { capture: true, signal: events.signal });

    requestRefresh();
    return () => {
      context.revert();
      events.abort();
      overlay.remove();
      root.classList.remove('projects--motion');
      content.inert = originalInert;
    };
  });

  // Layar kecil mempertahankan gallery drag tanpa pin panjang.
  media.add('(max-width: 1439px), (max-height: 719px)', () => {
    const context = gsap.context(() => {
      gsap.fromTo(button, { clipPath: 'inset(12% 0% 12% 0% round 290px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 290px)',
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      });
    }, root);
    return () => context.revert();
  });

  return () => media.revert();
}
