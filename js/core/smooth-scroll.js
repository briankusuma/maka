import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './animation.js';

// Class untuk resource yang memiliki state dan lifecycle.
export class SmoothScroll {
  constructor() {
    this.lenis = null;
    this.tick = (seconds) => this.lenis?.raf(seconds * 1000);
  }

  init() {
    if (this.lenis) return;

    this.lenis = new Lenis({
      autoRaf: false,
      anchors: true,
    });

    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(this.tick);
    gsap.ticker.lagSmoothing(0);
  }

  destroy() {
    if (!this.lenis) return;

    gsap.ticker.remove(this.tick);
    this.lenis.off('scroll', ScrollTrigger.update);
    this.lenis.destroy();
    this.lenis = null;
  }
}
