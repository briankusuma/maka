import { gsap } from '../core/animation.js';

export function initHeroPoses(root) {
  const cleanups = [...root.querySelectorAll('[data-pose-sequence]')]
    .map(container => initSequence(container));

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

function initSequence(container) {
  const frames = [...container.querySelectorAll('[data-pose-frame]')];
  if (frames.length < 2) return () => {};

  const events = new AbortController();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverOnly = container.dataset.poseSequence === 'hover';
  const accordionOnly = container.dataset.poseSequence === 'accordion';
  const accordionTrigger = container.closest('[data-testimonial]')?.querySelector('[data-testimonial-trigger]');
  let timeline = null;
  let visible = false;
  let hovered = false;

  function showFirstFrame() {
    timeline?.pause(0);
    gsap.set(frames, { opacity: 0 });
    gsap.set(frames[0], { opacity: 1 });
  }

  function syncPlayback() {
    if (!timeline) return;
    const active = accordionOnly
      ? accordionTrigger?.getAttribute('aria-expanded') === 'true'
      : !hoverOnly || hovered || container.matches(':focus-within');
    if (reducedMotion.matches || ((hoverOnly || accordionOnly) && !active)) {
      showFirstFrame();
    } else if (visible && !document.hidden && active) {
      timeline.play();
    } else {
      timeline.pause();
    }
  }

  // Satu timeline per komponen; seluruhnya memakai ticker GSAP bersama.
  async function prepare() {
    try {
      await Promise.all(frames.map(frame => frame.decode()));
      if (events.signal.aborted) return;
      timeline = gsap.timeline({ paused: true, repeat: -1 });
      const frameDuration = 0.6;
      frames.forEach((frame, index) => {
        const time = index * frameDuration;
        timeline.set(frames, { opacity: 0 }, time);
        timeline.set(frame, { opacity: 1 }, time);
      });
      timeline.to({}, { duration: frameDuration });
      syncPlayback();
    } catch {
      // Foto pertama tetap terlihat jika salah satu frame gagal dimuat.
    }
  }

  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    syncPlayback();
  });
  observer.observe(container);

  // Status accordion menentukan playback, bukan posisi pointer pada foto.
  const accordionObserver = new MutationObserver(syncPlayback);
  if (accordionOnly && accordionTrigger) {
    accordionObserver.observe(accordionTrigger, {
      attributes: true,
      attributeFilter: ['aria-expanded'],
    });
  }

  if (hoverOnly) {
    container.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovered = true;
      syncPlayback();
    }, { signal: events.signal });
    container.addEventListener('pointerleave', () => {
      hovered = false;
      syncPlayback();
    }, { signal: events.signal });
    container.addEventListener('focusin', syncPlayback, { signal: events.signal });
    container.addEventListener('focusout', () => {
      queueMicrotask(() => {
        if (!events.signal.aborted) syncPlayback();
      });
    }, { signal: events.signal });
  }

  document.addEventListener('visibilitychange', syncPlayback, { signal: events.signal });
  reducedMotion.addEventListener('change', syncPlayback, { signal: events.signal });
  void prepare();

  return () => {
    events.abort();
    observer.disconnect();
    accordionObserver.disconnect();
    timeline?.kill();
    gsap.set(frames, { clearProps: 'opacity' });
  };
}
