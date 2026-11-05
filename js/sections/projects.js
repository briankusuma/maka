import Swiper from 'swiper';
import { A11y, FreeMode, Keyboard, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/a11y';
import { initServices } from '../interactions/services.js';

// Satu instance per section. Swiper memiliki track; CSS memiliki hover gambar.
export class Projects {
  constructor(root, requestRefresh) {
    this.root = root;
    this.requestRefresh = requestRefresh;
    this.swiper = null;
    this.events = null;
    this.index = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }

  init() {
    if (!this.root || this.events) return;
    this.events = new AbortController();
    const { signal } = this.events;
    this.destroyServices = initServices(this.root);
    const slider = this.root.querySelector('[data-project-slider]');
    const controls = this.root.querySelector('[data-project-controls]');
    this.dialog = this.root.querySelector('[data-project-dialog]');
    this.cards = [...this.root.querySelectorAll('[data-project-card]')];

    this.swiper = new Swiper(slider, {
      modules: [A11y, FreeMode, Keyboard, Navigation],
      slidesPerView: 'auto',
      spaceBetween: 32,
      speed: this.reducedMotion.matches ? 0 : 600,
      freeMode: { enabled: true, momentum: !this.reducedMotion.matches },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: {
        prevEl: this.root.querySelector('[data-project-prev]'),
        nextEl: this.root.querySelector('[data-project-next]'),
      },
      breakpoints: { 1200: { spaceBetween: 156 } },
      grabCursor: true,
      watchOverflow: true,
      a11y: { containerRoleDescriptionMessage: 'Project gallery' },
      on: {
        init: swiper => { controls.hidden = swiper.isLocked; },
        lock: () => { controls.hidden = true; this.requestRefresh(); },
        unlock: () => { controls.hidden = false; this.requestRefresh(); },
      },
    });

    this.root.addEventListener('click', event => {
      const trigger = event.target.closest('[data-project-open]');
      if (!trigger || !this.swiper.allowClick) return;
      this.index = Number(trigger.dataset.projectOpen);
      this.updateViewer();
      this.dialog.showModal();
    }, { signal });

    this.root.querySelector('[data-project-close]').addEventListener('click', () => {
      this.dialog.close();
    }, { signal });

    for (const [selector, step] of [['[data-viewer-prev]', -1], ['[data-viewer-next]', 1]]) {
      this.root.querySelector(selector).addEventListener('click', () => {
        this.index = (this.index + step + this.cards.length) % this.cards.length;
        this.updateViewer();
      }, { signal });
    }

    this.dialog.addEventListener('click', event => {
      if (event.target !== this.dialog) return;
      const rect = this.dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        this.dialog.close();
      }
    }, { signal });

    this.reducedMotion.addEventListener('change', () => {
      this.swiper.params.speed = this.reducedMotion.matches ? 0 : 600;
      this.swiper.params.freeMode.momentum = !this.reducedMotion.matches;
    }, { signal });
  }

  updateViewer() {
    const card = this.cards[this.index];
    const image = card.querySelector('img');
    const preview = this.root.querySelector('[data-project-preview]');
    preview.src = image.currentSrc || image.src;
    preview.alt = image.alt;
    this.root.querySelector('[data-project-title]').textContent = card.querySelector('.project-card__caption span').textContent;
    this.root.querySelector('[data-project-description]').textContent = card.querySelector('.project-card__type').textContent;
  }

  destroy() {
    this.destroyServices?.();
    this.events?.abort();
    this.events = null;
    this.dialog?.close();
    this.swiper?.destroy(true, true);
    this.swiper = null;
  }
}
