import { gsap } from '../core/animation.js';

// Titik utama untuk revisi tempo preload dan perpindahan.
const timing = Object.freeze({
  progress: 0.6,
  travel: 4.2,
  navigation: 1.1,
  display: 1.5,
  assetTimeout: 8_000,
  recoveryTimeout: 16_000,
});

// Mengelola staging, aset kritis, dan handoff ke hero tanpa mengganti foto.
export class Preloader {
  constructor(root, { scroll, requestRefresh }) {
    this.root = root;
    this.scroll = scroll;
    this.requestRefresh = requestRefresh;
    this.overlay = root.querySelector('[data-preloader]');
    this.hero = root.querySelector('[data-hero]');
    this.photos = [];
    this.lockedElements = [];
    this.events = null;
    this.context = null;
    this.timeline = null;
    this.progressTween = null;
    this.progress = { value: 0 };
    this.completed = false;
  }

  init() {
    // Deep-link dan scroll yang dipulihkan browser langsung membuka konten.
    if (!this.overlay || !this.hero || window.scrollY > 0 || location.hash) return;
    this.events = new AbortController();
    this.overlay.hidden = false;
    document.documentElement.classList.add('is-preloading');
    this.scroll.lenis?.stop();

    for (const element of this.root.querySelectorAll('[data-header], main, footer')) {
      this.lockedElements.push({ element, inert: element.inert });
      element.inert = true;
    }

    this.context = gsap.context(() => this.stage());
    window.addEventListener('resize', () => this.finish(), {
      once: true,
      signal: this.events.signal,
    });
    // Pemulihan terakhir jika resource atau timeline gagal diselesaikan.
    this.watchdog = window.setTimeout(() => this.finish(), timing.recoveryTimeout);
    void this.loadCriticalAssets();
  }

  stage() {
    this.logo = this.overlay.querySelector('[data-preloader-logo]');
    this.navLogo = this.root.querySelector('[data-header-logo]');
    this.horizontal = this.overlay.querySelector('[data-preloader-horizontal]');
    this.vertical = this.overlay.querySelector('[data-preloader-vertical]');
    this.progressElement = this.overlay.querySelector('[data-preloader-progress]');
    this.navigation = [...this.root.querySelectorAll(
      '.site-header__brand, .navigation__item, .site-header__clock, .site-header__availability',
    )];
    this.display = this.hero.querySelector('[data-hero-wordmark] > [aria-hidden]');
    this.art = this.hero.querySelector('[data-hero-art]');
    this.copy = this.hero.querySelector('[data-hero-copy]');
    this.divider = this.hero.querySelector('.hero__divider');

    gsap.set(this.navigation, { autoAlpha: 0, y: -40 });
    gsap.set(this.navLogo, { autoAlpha: 0 });
    // Offset piksel yang sama menjaga dua layer wordmark tetap menyatu.
    const displayOffset = Math.max(
      this.display.getBoundingClientRect().height,
      this.art.getBoundingClientRect().height,
    ) * 1.1;
    gsap.set([this.display, this.art], { autoAlpha: 1, y: displayOffset });
    gsap.set(this.copy, { autoAlpha: 0, y: 28 });
    gsap.set(this.divider, { scaleX: 0, transformOrigin: 'left center' });

    const figures = [...this.hero.querySelectorAll('[data-hero-figure]')];
    const mobile = window.innerWidth < 768;
    const stageWidth = window.innerWidth * (mobile ? 0.42 : 520 / 1440);
    const heroRect = this.hero.getBoundingClientRect();
    const stageHeight = stageWidth * 360 / 520 + 18;
    const stageTop = Math.max(heroRect.top, Math.min(
      window.innerHeight * 308 / 848,
      heroRect.bottom - stageHeight,
    ));

    figures.forEach((figure, index) => {
      const originalStyle = figure.getAttribute('style');
      // Foto tetap di hero: layer depan/belakang tidak berubah saat handoff.
      const target = figure.getBoundingClientRect();
      figure.classList.add('preloader__figure');
      if (index === 0) figure.classList.add('preloader__figure--left');
      const left = window.innerWidth * (mobile ? (index === 0 ? 0.06 : 0.52) : (index === 0 ? 184 : 736) / 1440);
      gsap.set(figure, {
        x: left - target.left,
        y: stageTop - target.top,
        scale: stageWidth / target.width,
        transformOrigin: 'left top',
      });
      this.photos.push({ figure, originalStyle });
    });
  }

  renderProgress() {
    const value = this.progress.value;
    gsap.set(this.horizontal, { scaleX: value });
    gsap.set(this.vertical, { scaleY: value });
    this.progressElement.setAttribute('aria-valuenow', String(Math.round(value * 100)));
  }

  setProgress(value, onComplete) {
    this.progressTween?.kill();
    this.progressTween = gsap.to(this.progress, {
      value,
      duration: timing.progress,
      ease: 'power1.out',
      onUpdate: () => this.renderProgress(),
      onComplete,
    });
  }

  async loadCriticalAssets() {
    const images = this.photos.flatMap(({ figure }) => [...figure.querySelectorAll('img')]);
    images.push(this.logo.querySelector('img'), this.art.querySelector('img'));
    const jobs = images.map(image => image.decode());
    jobs.push(
      document.fonts.ready,
      document.fonts.load('800 468px "Bricolage Grotesque"'),
    );
    let finished = 0;
    const tracked = jobs.map(job => Promise.resolve(job).finally(() => {
      finished += 1;
      if (!this.completed) this.setProgress(finished / jobs.length);
    }));

    const result = await Promise.race([
      Promise.allSettled(tracked),
      new Promise(resolve => {
        this.assetTimeout = window.setTimeout(() => resolve(null), timing.assetTimeout);
      }),
    ]);
    window.clearTimeout(this.assetTimeout);
    if (this.completed) return;
    if (!result) {
      // Jangan menampilkan progres palsu 100% jika aset tidak siap.
      this.finish();
      return;
    }
    if (result.some(asset => asset.status === 'rejected')) {
      console.warn('MAKA preload: some critical assets failed; opening the page.');
      this.finish();
      return;
    }
    this.setProgress(1, () => this.transitionToHero());
  }

  transitionToHero() {
    if (this.completed) return;
    this.context.add(() => {
      const logoFrom = this.logo.getBoundingClientRect();
      const logoTo = this.navLogo.getBoundingClientRect();
      for (const { figure } of this.photos) {
        const current = figure.getBoundingClientRect();
        gsap.set(figure, { x: 0, y: 0, scale: 1 });
        const target = figure.getBoundingClientRect();
        gsap.set(figure, {
          x: current.left - target.left,
          y: current.top - target.top,
          scale: current.width / target.width,
        });
      }

      this.timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => this.finish(),
      });
      this.timeline
        .to(this.logo, {
          x: logoTo.left + logoTo.width / 2 - logoFrom.left - logoFrom.width / 2,
          y: logoTo.top + logoTo.height / 2 - logoFrom.top - logoFrom.height / 2,
          scale: logoTo.width / logoFrom.width,
          rotation: 360,
          duration: timing.travel,
        }, 0)
        .to(this.photos.map(photo => photo.figure), {
          x: 0,
          y: 0,
          scale: 1,
          duration: timing.travel,
          stagger: 0.12,
        }, 0.12)
        .to(this.overlay.querySelector('[data-preloader-backdrop]'), {
          opacity: 0,
          duration: 1.8,
        }, 1.6)
        .to([this.horizontal, this.vertical], {
          opacity: 0,
          duration: 0.9,
        }, 2.1)
        .to(this.navigation, {
          autoAlpha: 1,
          y: 0,
          duration: timing.navigation,
          stagger: 0.07,
          ease: 'power3.out',
        }, 2.8)
        .to(this.photos.map(photo => photo.figure.querySelector('figcaption')), {
          color: '#2a2a2a',
          duration: 1.1,
        }, 2.8)
        .to(this.copy, { autoAlpha: 1, y: 0, duration: 1.2 }, 3)
        .to([this.display, this.art], {
          y: 0,
          duration: timing.display,
          ease: 'power3.out',
        }, 3.25)
        .to(this.divider, { scaleX: 1, duration: 1.3 }, 3.15);
    });
  }

  finish() {
    if (this.completed) return;
    this.completed = true;
    window.clearTimeout(this.watchdog);
    window.clearTimeout(this.assetTimeout);
    this.events?.abort();
    this.progressTween?.kill();
    this.context?.revert();
    for (const { figure, originalStyle } of this.photos) {
      figure.classList.remove('preloader__figure', 'preloader__figure--left');
      if (originalStyle === null) figure.removeAttribute('style');
      else figure.setAttribute('style', originalStyle);
    }
    for (const { element, inert } of this.lockedElements) element.inert = inert;
    if (this.overlay) this.overlay.hidden = true;
    document.documentElement.classList.remove('is-preloading');
    this.scroll.lenis?.start();
    this.requestRefresh();
  }

  destroy() {
    this.finish();
  }
}
