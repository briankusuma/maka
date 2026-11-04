import { LandingPage } from './js/core/landing-page.js';

// Entry point: lifecycle saja, detail fitur berada di folder js/.
const landingPage = new LandingPage(document);
landingPage.init();

if (import.meta.hot) {
  import.meta.hot.dispose(() => landingPage.destroy());
}
