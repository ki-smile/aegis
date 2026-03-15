/* AEGIS Architecture Diagram Animation
   Animates DARM → MMM → CDM pipeline SVG on the landing page.
   8-step cycle using requestAnimationFrame.
   Respects prefers-reduced-motion. */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var nodes = {
      darm: document.getElementById('node-darm'),
      mmm: document.getElementById('node-mmm'),
      cdm: document.getElementById('node-cdm')
    };
    var arrows = {
      a1: document.getElementById('arrow-1'),
      a2: document.getElementById('arrow-2'),
      a3: document.getElementById('arrow-3')
    };
    var badge = document.getElementById('decision-badge');
    var feedback = document.getElementById('feedback-arrow');

    // Check all elements exist
    if (!nodes.darm || !nodes.mmm || !nodes.cdm) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Show final state without animation if reduced motion preferred
    if (reducedMotion) {
      setOpacity(nodes.darm, 1);
      setOpacity(nodes.mmm, 1);
      setOpacity(nodes.cdm, 1);
      if (arrows.a1) setOpacity(arrows.a1, 1);
      if (arrows.a2) setOpacity(arrows.a2, 1);
      if (arrows.a3) setOpacity(arrows.a3, 1);
      if (badge) setOpacity(badge, 1);
      if (feedback) setOpacity(feedback, 1);
      return;
    }

    // Animation config
    var STEP_DURATION = 600; // ms per step
    var PAUSE = 1500;        // ms pause at end
    var TOTAL_STEPS = 8;
    var totalCycle = STEP_DURATION * TOTAL_STEPS + PAUSE;

    // Initial state — all faded
    var allElements = [nodes.darm, nodes.mmm, nodes.cdm, arrows.a1, arrows.a2, arrows.a3, badge, feedback].filter(Boolean);
    allElements.forEach(function (el) { setOpacity(el, 0.15); });

    var startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = (timestamp - startTime) % totalCycle;
      var step = Math.floor(elapsed / STEP_DURATION);

      // Reset all
      allElements.forEach(function (el) { setOpacity(el, 0.15); });

      // Progressive reveal based on step
      if (step >= 0) setOpacity(nodes.darm, 1);
      if (step >= 1 && arrows.a1) setOpacity(arrows.a1, 1);
      if (step >= 2) setOpacity(nodes.mmm, 1);
      if (step >= 3 && arrows.a2) setOpacity(arrows.a2, 1);
      if (step >= 4) setOpacity(nodes.cdm, 1);
      if (step >= 5 && arrows.a3) setOpacity(arrows.a3, 1);
      if (step >= 6 && badge) setOpacity(badge, 1);
      if (step >= 7 && feedback) setOpacity(feedback, 1);

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  });

  function setOpacity(el, val) {
    if (el) el.style.opacity = val;
    if (el) el.style.transition = 'opacity 0.3s ease';
  }
})();
