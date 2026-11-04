import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const motion = Object.freeze({
  duration: 0.8,
  ease: 'power3.out',
  revealDistance: 32,
});
