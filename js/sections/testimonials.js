import { gsap } from '../core/animation.js';
import { initHoverCipher } from '../interactions/hover-cipher.js';

export class Testimonials {
  constructor(root, requestRefresh) {
    this.root = root;
    this.requestRefresh = requestRefresh;
    this.events = null;
    this.animations = new Map();
    this.hoverTimer = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }

  init() {
    if (!this.root || this.events) return;
    this.events = new AbortController();
    this.items = [...this.root.querySelectorAll('[data-testimonial]')];
    this.destroyCipher = initHoverCipher(this.root, {
      gsap,
      itemSelector: '[data-testimonial]',
      textSelector: '.testimonials__number, .testimonials__client, '
        + '.testimonials__field > span:not(.testimonials__field-label), '
        + '.testimonials__quotation, .testimonials__author',
    });

    // Sedikit jeda mencegah panel berganti saat pointer hanya melintas.
    let lastPosition = '';
    let hovered = null;
    this.root.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const position = `${event.clientX}:${event.clientY}`;
      if (position === lastPosition) return;
      lastPosition = position;
      const item = event.target.closest('[data-testimonial]');
      if (item === hovered) return;
      hovered = item;
      window.clearTimeout(this.hoverTimer);
      if (item) {
        this.hoverTimer = window.setTimeout(() => this.activate(item), 100);
      }
    }, { signal: this.events.signal });

    this.root.addEventListener('pointerleave', () => {
      window.clearTimeout(this.hoverTimer);
      hovered = null;
      lastPosition = '';
    }, { signal: this.events.signal });

    this.root.addEventListener('focusin', event => {
      const trigger = event.target.closest('[data-testimonial-trigger]');
      if (trigger) this.activate(trigger.closest('[data-testimonial]'));
    }, { signal: this.events.signal });

    this.root.addEventListener('click', event => {
      const collapse = event.target.closest('[data-testimonial-collapse]');
      if (collapse) {
        const item = collapse.closest('[data-testimonial]');
        item.querySelector('[data-testimonial-trigger]').focus();
        this.setOpen(item, false);
        return;
      }
      const trigger = event.target.closest('[data-testimonial-trigger]');
      if (!trigger) return;
      const selected = trigger.closest('[data-testimonial]');
      this.activate(selected);
    }, { signal: this.events.signal });

    this.root.addEventListener('keydown', event => {
      const index = this.items.findIndex(item => item.querySelector('[data-testimonial-trigger]') === event.target);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % this.items.length;
      if (event.key === 'ArrowUp') next = (index - 1 + this.items.length) % this.items.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = this.items.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      this.items[next].querySelector('[data-testimonial-trigger]').focus();
    }, { signal: this.events.signal });
  }

  activate(selected) {
    window.clearTimeout(this.hoverTimer);
    for (const item of this.items) this.setOpen(item, item === selected);
  }

  setOpen(item, open) {
    const panel = item.querySelector('[data-testimonial-panel]');
    const trigger = item.querySelector('[data-testimonial-trigger]');
    if ((trigger.getAttribute('aria-expanded') === 'true') === open) return;

    this.animations.get(item)?.kill();
    const labels = [...trigger.querySelectorAll('.testimonials__metadata > span')];
    const previousRects = labels.map(label => label.getBoundingClientRect());
    const fromHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    const wasHidden = panel.hidden;
    const inner = panel.querySelector('.testimonials__panel-inner');
    item.classList.toggle('testimonials__item--open', open);
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = false;
    panel.inert = !open;
    panel.setAttribute('aria-hidden', String(!open));
    panel.style.height = 'auto';
    const toHeight = open ? panel.scrollHeight : 0;

    const duration = this.reducedMotion.matches ? 0 : 0.7;
    const tween = gsap.timeline({
      onComplete: () => {
        panel.hidden = !open;
        panel.style.removeProperty('height');
        gsap.set([inner, ...labels], { clearProps: 'transform,opacity' });
        this.animations.delete(item);
        this.requestRefresh();
      },
    });
    tween.fromTo(panel, { height: fromHeight }, {
      height: toHeight,
      duration,
      ease: 'power2.inOut',
    }, 0);
    tween.fromTo(inner, {
      opacity: wasHidden ? 0 : gsap.getProperty(inner, 'opacity'),
      y: wasHidden ? 10 : gsap.getProperty(inner, 'y'),
    }, {
      opacity: open ? 1 : 0,
      y: open ? 0 : 6,
      duration: duration * 0.75,
      ease: 'power2.out',
    }, open ? duration * 0.15 : 0);

    // Interpolasi posisi metadata agar pergantian layout tidak meloncat.
    labels.forEach((label, index) => {
      gsap.set(label, { x: 0, y: 0 });
      const next = label.getBoundingClientRect();
      tween.fromTo(label, {
        x: previousRects[index].x - next.x,
        y: previousRects[index].y - next.y,
      }, { x: 0, y: 0, duration, ease: 'power2.inOut' }, 0);
    });
    this.animations.set(item, tween);
  }

  destroy() {
    this.destroyCipher?.();
    window.clearTimeout(this.hoverTimer);
    this.events?.abort();
    this.events = null;
    for (const tween of this.animations.values()) tween.kill();
    this.animations.clear();
    for (const item of this.items || []) {
      const panel = item.querySelector('[data-testimonial-panel]');
      panel.style.removeProperty('height');
      gsap.set(item.querySelectorAll('.testimonials__panel-inner, .testimonials__metadata > span'), {
        clearProps: 'transform,opacity',
      });
      panel.hidden = !item.classList.contains('testimonials__item--open');
    }
  }
}
