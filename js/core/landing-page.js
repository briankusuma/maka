import { gsap, ScrollTrigger, motion } from './animation.js';
import { SmoothScroll } from './smooth-scroll.js';
import { initReveals } from '../interactions/reveal.js';
import { initMarquee } from '../interactions/marquee.js';
import { initHero } from '../sections/hero.js';
import { initClock } from '../interactions/clock.js';
import { initStatistics } from '../sections/statistics.js';
import { Projects } from '../sections/projects.js';
import { Testimonials } from '../sections/testimonials.js';
import { initStatisticsGaze } from '../interactions/statistics-gaze.js';

export class LandingPage {
  constructor(root) {
    this.root = root;
    this.media = null;
    this.events = null;
    this.destroyClock = null;
    this.projects = null;
    this.testimonials = null;
    this.destroyStatisticsGaze = null;
    this.refreshPending = false;
    this.requestRefresh = this.requestRefresh.bind(this);
    this.flushRefresh = this.flushRefresh.bind(this);
  }

  init() {
    if (this.events) return;

    const events = new AbortController();
    this.events = events;
    this.destroyClock = initClock(this.root);
    this.destroyStatisticsGaze = initStatisticsGaze(this.root);
    this.projects = new Projects(
      this.root.querySelector('[data-projects]'),
      this.requestRefresh,
    );
    this.projects.init();
    this.testimonials = new Testimonials(
      this.root.querySelector('[data-testimonials]'),
      this.requestRefresh,
    );
    this.testimonials.init();
    this.media = gsap.matchMedia();

    this.media.add('(prefers-reduced-motion: no-preference)', () => {
      const scroll = new SmoothScroll();
      scroll.init();

      const services = { gsap, motion };
      initHero(this.root, services);
      initReveals(this.root, services);
      initMarquee(this.root, services);
      const destroyStatistics = initStatistics(this.root, services);

      // matchMedia me-revert tween/trigger; cleanup menghentikan Lenis.
      return () => {
        destroyStatistics?.();
        scroll.destroy();
      };
    });

    // Event-driven: tidak ada polling untuk menunggu halaman selesai.
    if (document.readyState === 'complete') {
      this.requestRefresh();
    } else {
      window.addEventListener('load', this.requestRefresh, {
        once: true,
        signal: events.signal,
      });
    }

    // Async tidak menghalangi hero; signal melindungi callback lama saat HMR.
    void this.refreshAfterFonts(events.signal);
  }

  async refreshAfterFonts(signal) {
    await document.fonts.ready;
    if (!signal.aborted) this.requestRefresh();
  }

  requestRefresh() {
    if (!this.events || this.refreshPending) return;

    this.refreshPending = true;
    // Sekali pada ticker bersama, bukan loop RAF kedua.
    gsap.ticker.add(this.flushRefresh, true);
  }

  flushRefresh() {
    this.refreshPending = false;
    if (this.events) ScrollTrigger.refresh();
  }

  destroy() {
    this.destroyStatisticsGaze?.();
    this.destroyStatisticsGaze = null;
    this.testimonials?.destroy();
    this.testimonials = null;
    this.projects?.destroy();
    this.projects = null;
    this.destroyClock?.();
    this.destroyClock = null;
    this.events?.abort();
    this.events = null;
    gsap.ticker.remove(this.flushRefresh);
    this.refreshPending = false;
    this.media?.revert();
    this.media = null;
  }
}
