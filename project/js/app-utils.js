(function() {
  window.cssVar = function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  window.escHtml = function escHtml(v) {
    return String(v).replace(/[&<>\"']/g, c => (
      { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[c]
    ));
  };

  window.escAttr = function escAttr(v) {
    return String(v).replace(/&/g, "&amp;").replace(/\"/g, "&quot;");
  };

  window.getStateName = function getStateName(feature) {
    return feature?.properties?.name || feature?.id || "State";
  };

  window.visitData = function visitData() {
    return window.STATE_VISIT_DATA || {};
  };

  window.demogData = function demogData() {
    return window.STATE_DEMOGRAPHICS_DATA || {};
  };

  window.econData = function econData() {
    return window.STATE_ECONOMIC_DATA || {};
  };
})();
