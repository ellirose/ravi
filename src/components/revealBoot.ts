/**
 * Inline <head> script for the reveal system. It turns hidden reveal states on
 * before first paint, and turns them off again if React has not hydrated within
 * the timeout (slow network or blocked JS), so content is never left invisible.
 */
export const revealBootScript = `(function(){var d=document.documentElement;d.setAttribute("data-reveal-js","on");setTimeout(function(){if(!window.__revealReady)d.setAttribute("data-reveal-js","off")},3500)})();`;
