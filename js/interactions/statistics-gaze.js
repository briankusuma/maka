import { gsap } from '../core/animation.js';

// Dua layer memakai crop yang sama; hanya opacity layer gaze yang berubah.
export function initStatisticsGaze(root) {
  const section = root.querySelector('[data-statistics]');
  const button = section?.querySelector('.statistics__contact');
  const image = section?.querySelector('[data-statistics-gaze]');
  if (!button || !image) return () => {};

  const events = new AbortController();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let hovered = false;
  let ready = false;
  let decoding = null;
  let tween = null;
  const counters = [...section.querySelectorAll('[data-count]')];
  const originalLabels = counters.map(counter => counter.parentElement.getAttribute('aria-label'));

  function updateCounters(active) {
    const offset = active ? 1 : 0;
    section.dataset.countOffset = String(offset);
    counters.forEach((counter, index) => {
      const base = Number(counter.dataset.count);
      const current = Number(counter.dataset.countCurrent ?? base);
      counter.querySelector('[data-count-value]').textContent = String(current + offset);
      const label = originalLabels[index];
      if (label) {
        counter.parentElement.setAttribute('aria-label', label.replace(String(base), String(base + offset)));
      }
    });
  }

  function animate() {
    if (events.signal.aborted) return;
    const active = hovered || button.matches(':focus-visible');
    updateCounters(active);
    tween?.kill();
    tween = gsap.to(image, {
      opacity: active && ready ? 1 : 0,
      duration: reducedMotion.matches ? 0 : active ? 0.65 : 0.8,
      ease: 'sine.inOut',
      overwrite: 'auto',
    });
  }

  async function prepare() {
    if (!decoding) {
      decoding = image.decode().then(() => {
        ready = true;
      }).catch(() => {
        // Jika aset gagal, background default tetap terlihat penuh.
        ready = false;
      });
    }
    await decoding;
    animate();
  }

  // Decode sebelum tombol terlihat agar hover pertama tidak menunggu gambar.
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      void prepare();
      observer.disconnect();
    }
  }, { rootMargin: '500px' });
  observer.observe(section);

  button.addEventListener('pointerenter', event => {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    hovered = true;
    animate();
    void prepare();
  }, { signal: events.signal });

  button.addEventListener('pointerleave', () => {
    hovered = false;
    animate();
  }, { signal: events.signal });

  button.addEventListener('focus', () => {
    animate();
    void prepare();
  }, { signal: events.signal });
  button.addEventListener('blur', animate, { signal: events.signal });
  reducedMotion.addEventListener('change', animate, { signal: events.signal });
  finePointer.addEventListener('change', () => {
    hovered = false;
    animate();
  }, { signal: events.signal });

  return () => {
    events.abort();
    observer.disconnect();
    tween?.kill();
    updateCounters(false);
    delete section.dataset.countOffset;
    image.style.removeProperty('opacity');
  };
}
