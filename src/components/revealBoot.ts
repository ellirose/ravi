/**
 * Inline <head> script, runs before first paint.
 *  - Reveal system: turns hidden reveal states on, and off again if React has
 *    not hydrated within 3.5s (slow network / blocked JS) so content never
 *    stays invisible.
 *  - Intro: marks <html data-intro="playing"> so the intro overlay covers the
 *    page from the first frame (skipped for deep links like /#works). If the
 *    intro never starts (JS failed), it is dismissed after 8s.
 */
export const revealBootScript = `(function(){var d=document.documentElement;d.setAttribute("data-reveal-js","on");setTimeout(function(){if(!window.__revealReady)d.setAttribute("data-reveal-js","off")},3500);if(location.hash.length<2){d.setAttribute("data-intro","playing");try{history.scrollRestoration="manual"}catch(e){}window.scrollTo(0,0);setTimeout(function(){if(!window.__introStarted&&d.getAttribute("data-intro")==="playing")d.setAttribute("data-intro","done")},8000)}})();`;
