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

  window.getAppConfig = function getAppConfig() {
    const cfg = window.APP_CONFIG || {};
    return {
      responseWebhookUrl: typeof cfg.responseWebhookUrl === "string" ? cfg.responseWebhookUrl.trim() : "",
      responseWebhookAuth: typeof cfg.responseWebhookAuth === "string" ? cfg.responseWebhookAuth.trim() : ""
    };
  };

  window.submitAppResponse = async function submitAppResponse(type, payload) {
    const cfg = window.getAppConfig();
    if (!cfg.responseWebhookUrl) {
      return { ok: false, skipped: true, reason: "missing-endpoint" };
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (cfg.responseWebhookAuth) headers["Authorization"] = cfg.responseWebhookAuth;

    const response = await fetch(cfg.responseWebhookUrl, {
      method: "POST",
      mode: "cors",
      headers: headers,
      body: JSON.stringify({
        app: "state-data-explorer",
        type: type,
        submittedAt: new Date().toISOString(),
        page: window.location.href,
        payload: payload
      })
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      const message = data && typeof data.error === "string"
        ? data.error
        : "Request failed with status " + response.status;
      throw new Error(message);
    }

    return { ok: true, skipped: false, data: data };
  };
})();
