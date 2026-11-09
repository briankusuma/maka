// Disclosure tunggal: hover mouse, fokus keyboard, atau tap mengaktifkan kategori.
export function initServices(root) {
  const list = root?.querySelector('[data-services]');
  if (!list) return () => {};

  const events = new AbortController();
  const items = [...list.querySelectorAll('[data-service]')];
  const initialItem = items[0];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sequences = new Map();
  const labels = new Map(items.map(item => [item,
    [...item.querySelectorAll('.projects__specialties > li')].map(element => ({
      element,
      text: element.textContent,
    })),
  ]));

  function stopScramble(item) {
    sequences.get(item)?.kill();
    sequences.delete(item);
    for (const { element, text } of labels.get(item)) element.textContent = text;
  }

  function scrambleMenu(item) {
    if (reducedMotion.matches) return;
    stopScramble(item);
    const timeline = gsap.timeline({ onComplete: () => stopScramble(item) });
    sequences.set(item, timeline);
    labels.get(item).forEach(({ element, text }, index) => {
      const state = { progress: 0 };
      let lastFrame = -1;
      timeline.to(state, {
        progress: 1,
        duration: 0.5,
        ease: 'none',
        onUpdate: () => {
          const frame = Math.floor(state.progress * 10);
          if (frame === lastFrame) return;
          lastFrame = frame;
          element.textContent = [...text].map((character, characterIndex) => {
            const locked = state.progress >= 0.25 + characterIndex / text.length * 0.75;
            if (locked || !/[a-z]/i.test(character)) return character;
            let alphabet = /[iljtfr]/i.test(character) ? 'iljtfr'
              : /[mw]/i.test(character) ? 'mw' : 'aceosuvxz';
            if (/[A-Z]/.test(character)) alphabet = alphabet.toUpperCase();
            return alphabet[Math.floor(Math.random() * alphabet.length)];
          }).join('');
        },
        onComplete: () => { element.textContent = text; },
      }, index * 0.3);
    });
  }

  // Panel keluar dari alur layout sehingga tidak menggeser judul.
  // CSS menangani transisi; hidden akan memutus animasi fade-out.
  for (const item of items) {
    item.querySelector('.projects__specialties').hidden = false;
  }

  function activate(selected) {
    for (const item of items) {
      const active = item === selected;
      if (!active) stopScramble(item);
      item.classList.toggle('projects__service--active', active);
      item.querySelector('[data-service-trigger]').setAttribute('aria-expanded', String(active));
      const panel = item.querySelector('.projects__specialties');
      panel.setAttribute('aria-hidden', String(!active));
      panel.inert = !active;
    }
  }

  activate(initialItem);

  for (const item of items) {
    item.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') {
        activate(item);
        scrambleMenu(item);
      }
    }, { signal: events.signal });

    item.addEventListener('focusin', () => {
      activate(item);
      scrambleMenu(item);
    }, { signal: events.signal });
    item.querySelector('[data-service-trigger]').addEventListener('click', () => {
      activate(item);
    }, { signal: events.signal });
  }

  reducedMotion.addEventListener('change', () => {
    for (const item of items) stopScramble(item);
  }, { signal: events.signal });

  // Pertahankan kategori terakhir agar kontennya bisa dibaca setelah hover.
  return () => {
    events.abort();
    for (const item of items) stopScramble(item);
    activate(initialItem);
  };
}
import { gsap } from '../core/animation.js';

