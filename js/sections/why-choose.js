import { initIntroduction } from './introduction.js';

// Dua foto bergerak berurutan; seluruh decode mengikuti satu waktu scene.
export function initWhyChoose(root, services) {
  if (!root) return () => {};
  const { gsap, requestRefresh, scroll } = services;
  const media = gsap.matchMedia();

  media.add('(min-width: 1440px) and (min-height: 720px)', () => {
    root.classList.add('why-choose--motion');
    const content = root.querySelector('.why-choose__content');
    const originalInert = content.inert;
    const events = new AbortController();
    const intro = root.querySelector('.why-choose__intro-copy');
    const lines = root.querySelector('.why-choose__lines');
    const moreArrow = root.querySelector('.why-choose__more img');
    const figures = [...root.querySelectorAll('.why-choose__visual')];
    const state = { time: 0 };
    const ease = gsap.parseEase('power2.inOut');
    const progress = (start, duration) => gsap.utils.clamp(0, 1, (state.time - start) / duration);
    const ciphers = [...root.querySelectorAll('[data-why-cipher]')].map(element => {
      let start = 4.1;
      if (element.matches('.why-choose__title')) start = 2.8;
      if (element.matches('.why-choose__summary')) start = 3;
      if (element.matches('.why-choose__number')) start = 4.85;
      if (element.closest('.why-choose__more')) start = 4.5;
      if (element.matches('figcaption')) start = 3.5;
      if (element.closest('.why-choose__reason--second')) start += 0.12;
      return { start, cipher: initIntroduction(element, {
        ...services, manual: true, hover: false, preserveMarkup: true,
      }) };
    });

    const overlays = figures.map((figure, index) => {
      const source = figure.querySelector('img');
      const mask = document.createElement('div');
      mask.className = `why-choose__morph${index === 0 ? ' why-choose__morph--strategy' : ''}`;
      mask.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      image.className = 'why-choose__morph-image';
      image.src = source.currentSrc || source.src;
      image.alt = '';
      image.decoding = 'async';
      mask.append(image);
      root.append(mask);
      return { mask, image, source, figure, geometry: null };
    });
    let introPosition;

    function measure() {
      const bounds = root.getBoundingClientRect();
      const introBounds = intro.getBoundingClientRect();
      introPosition = {
        x: (root.clientWidth - introBounds.width) / 2
          - (introBounds.left - bounds.left - Number(gsap.getProperty(intro, 'x'))),
        y: (root.clientHeight - introBounds.height) / 2
          - (introBounds.top - bounds.top - Number(gsap.getProperty(intro, 'y'))),
      };
      for (const overlay of overlays) {
        const rect = overlay.figure.getBoundingClientRect();
        const width = root.clientWidth;
        const height = root.clientHeight;
        const naturalWidth = overlay.source.naturalWidth || 359;
        const naturalHeight = overlay.source.naturalHeight || 227;
        const cover = Math.max(width / naturalWidth, height / naturalHeight);
        overlay.image.style.width = `${naturalWidth * cover}px`;
        overlay.image.style.height = `${naturalHeight * cover}px`;
        overlay.geometry = {
          width, height,
          x: rect.left - bounds.left,
          y: rect.top - bounds.top,
          stageY: height * 319 / 848,
          targetWidth: rect.width,
          targetHeight: rect.height,
          scale: Math.max(rect.width / naturalWidth, rect.height / naturalHeight) / cover,
        };
      }
    }

    function render() {
      if (!introPosition) return;
      const descend = ease(progress(2.8, 0.7));
      const moveIntro = ease(progress(3.65, 0.7));
      gsap.set(intro, {
        x: introPosition.x * (1 - moveIntro),
        y: introPosition.y * (1 - moveIntro),
      });
      gsap.set(lines, { opacity: progress(2.6, 0.5) });
      gsap.set(moreArrow, { opacity: progress(4.5, 0.4) });
      for (const [index, overlay] of overlays.entries()) {
        const g = overlay.geometry;
        const shrink = ease(progress(index === 0 ? 0.15 : 1.5, 1));
        const width = gsap.utils.interpolate(g.width, g.targetWidth, shrink);
        const height = gsap.utils.interpolate(g.height, g.targetHeight, shrink);
        const x = g.x * shrink;
        const y = gsap.utils.interpolate(0, g.stageY, shrink) + (g.y - g.stageY) * descend;
        overlay.mask.style.clipPath = `inset(${y}px ${g.width - x - width}px ${g.height - y - height}px ${x}px)`;
        gsap.set(overlay.mask, {
          opacity: (index === 0 ? 1 : progress(1.3, 0.15)) * (1 - progress(3.5, 0.12)),
        });
        gsap.set(overlay.image, {
          xPercent: -50, yPercent: -50,
          x: x + width / 2 - g.width / 2,
          y: y + height / 2 - g.height / 2,
          scale: gsap.utils.interpolate(1, g.scale, shrink),
        });
        gsap.set(overlay.figure, { autoAlpha: progress(3.5, 0.12) });
      }
      for (const { cipher, start } of ciphers) cipher.render(progress(start, 0.75));
      content.inert = state.time < 5.6;
    }

    measure();
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${window.innerHeight * 2.5}`,
          pin: true,
          scrub: 0.45,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          onRefresh: render,
        },
      });
      timeline.fromTo(state, { time: 0 }, {
        time: 5.9, duration: 5.9, ease: 'none', onUpdate: render,
      });
      // Anchor Read more di footer/nav tetap dapat mencapai konten yang sudah terbuka.
      root.ownerDocument.addEventListener('click', event => {
        const link = event.target.closest('a[href="#why-strategy"]');
        if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const complete = () => {
          timeline.progress(1);
          content.inert = false;
          root.querySelector('#why-strategy').focus({ preventScroll: true });
        };
        if (scroll?.lenis) scroll.lenis.scrollTo(timeline.scrollTrigger.end + 1, { onComplete: complete });
        else {
          window.scrollTo({ top: timeline.scrollTrigger.end + 1, behavior: 'instant' });
          complete();
        }
      }, { capture: true, signal: events.signal });
    }, root);
    // Callback scroll di luar context tetap memiliki resource dan cleanup eksplisit.
    render();
    requestRefresh();
    return () => {
      events.abort();
      context.revert();
      for (const { cipher } of ciphers) cipher();
      gsap.set([intro, lines, moreArrow, ...figures], { clearProps: 'transform,opacity,visibility' });
      for (const { mask } of overlays) mask.remove();
      root.classList.remove('why-choose--motion');
      content.inert = originalInert;
    };
  });

  media.add('(max-width: 1439px), (max-height: 719px)', () => {
    const ciphers = [...root.querySelectorAll('[data-why-cipher]')].map(element => (
      initIntroduction(element, { ...services, preserveMarkup: true, hover: false })
    ));
    return () => { for (const destroy of ciphers) destroy(); };
  });
  return () => media.revert();
}
