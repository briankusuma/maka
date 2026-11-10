import { gsap, ScrollTrigger, motion } from './animation.js';
import { SmoothScroll } from './smooth-scroll.js';
import { initReveals } from '../interactions/reveal.js';
import { initMarquee } from '../interactions/marquee.js';
import { Preloader } from '../sections/preloader.js';
import { initClock } from '../interactions/clock.js';
import { initStatistics } from '../sections/statistics.js';
import { Projects } from '../sections/projects.js';
import { Testimonials } from '../sections/testimonials.js';
import { initStatisticsGaze } from '../interactions/statistics-gaze.js';
import { initHeroPoses } from '../interactions/hero-poses.js';
import { initIntroduction } from '../sections/introduction.js';
import { initSplashCursor } from '../interactions/splash-cursor.js';
import { initHoverCipher } from '../interactions/hover-cipher.js';
import { initScrollUnderlay } from '../interactions/scroll-underlay.js';
import { initProjectsMotion } from '../sections/projects-motion.js';
import { initHeroScroll } from '../sections/hero-scroll.js';
import { initWhyChoose } from '../sections/why-choose.js';

export class LandingPage {
  constructor(root) {
    this.root = root;
    this.media = null;
    this.events = null;
    this.destroyClock = null;
    this.projects = null;
    this.testimonials = null;
    this.destroyStatisticsGaze = null;
    this.destroyHeroPoses = null;
    this.destroySplashCursor = null;
    this.destroyLinkCipher = null;
    this.refreshPending = false;
    this.requestRefresh = this.requestRefresh.bind(this);
    this.flushRefresh = this.flushRefresh.bind(this);
  }

  init() {
    if (this.events) return;

    const events = new AbortController();
    this.events = events;
    this.destroyClock = initClock(this.root);
    this.destroyHeroPoses = initHeroPoses(this.root);
    this.destroyStatisticsGaze = initStatisticsGaze(this.root);
    this.destroySplashCursor = initSplashCursor(this.root, { gsap });
    this.destroyLinkCipher = initHoverCipher(this.root, {
      gsap,
      itemSelector: '[data-cipher-link]',
    });
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

      const services = { gsap, motion, ScrollTrigger, requestRefresh: this.requestRefresh };
      const preloader = new Preloader(this.root, {
        scroll,
        requestRefresh: this.requestRefresh,
      });
      preloader.init();
      const destroyHeroScroll = initHeroScroll(this.root.querySelector('[data-hero]'), {
        gsap,
        header: this.root.querySelector('[data-header]'),
      });
      initReveals(this.root, services);
      initMarquee(this.root, services);
      const destroyStatistics = initStatistics(this.root, services);
      const destroyProjectsMotion = initProjectsMotion(this.root.querySelector('[data-projects]'), {
        gsap,
        requestRefresh: this.requestRefresh,
        scroll,
      });
      const destroyWhyChoose = initWhyChoose(this.root.querySelector('[data-why-choose]'), {
        gsap, ScrollTrigger, requestRefresh: this.requestRefresh, scroll,
      });
      const destroyIntroduction = initIntroduction(
        this.root.querySelector('[data-cipher-reveal]'),
        { gsap, ScrollTrigger, requestRefresh: this.requestRefresh },
      );
      const statisticsCiphers = [...this.root.querySelectorAll('[data-statistics-cipher]')]
        .map(element => initIntroduction(element, {
          gsap,
          ScrollTrigger,
          requestRefresh: this.requestRefresh,
          preserveMarkup: true,
          hover: false,
        }));
      const destroyFooter = initScrollUnderlay(this.root.querySelector('[data-footer]'), {
        gsap,
        requestRefresh: this.requestRefresh,
        surfaceSelector: '[data-footer-surface]',
      });
      const destroyStatisticsUnderlay = initScrollUnderlay(this.root.querySelector('[data-statistics]'), {
        gsap,
        requestRefresh: this.requestRefresh,
        surfaceSelector: '[data-statistics-surface]',
      });

      // matchMedia me-revert tween/trigger; cleanup menghentikan Lenis.
      return () => {
        preloader.destroy();
        destroyHeroScroll();
        destroyProjectsMotion();
        destroyWhyChoose();
        destroyFooter();
        destroyStatisticsUnderlay();
        destroyIntroduction();
        for (const destroyCipher of statisticsCiphers) destroyCipher();
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
    this.destroyLinkCipher?.();
    this.destroyLinkCipher = null;
    this.destroySplashCursor?.();
    this.destroySplashCursor = null;
    this.destroyHeroPoses?.();
    this.destroyHeroPoses = null;
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
