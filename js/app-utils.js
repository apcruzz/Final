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
      supabaseUrl: typeof cfg.supabaseUrl === "string" ? cfg.supabaseUrl.trim().replace(/\/+$/, "") : "",
      supabaseAnonKey: typeof cfg.supabaseAnonKey === "string" ? cfg.supabaseAnonKey.trim() : "",
      responseWebhookUrl: typeof cfg.responseWebhookUrl === "string" ? cfg.responseWebhookUrl.trim() : "",
      responseWebhookAuth: typeof cfg.responseWebhookAuth === "string" ? cfg.responseWebhookAuth.trim() : ""
    };
  };

  function submitViaHiddenForm(url, requestBody) {
    return new Promise(function(resolve, reject) {
      try {
        const targetName = "app-script-target-" + Date.now() + "-" + Math.random().toString(36).slice(2);
        const iframe = document.createElement("iframe");
        iframe.name = targetName;
        iframe.style.display = "none";

        const form = document.createElement("form");
        form.method = "POST";
        form.action = url;
        form.target = targetName;
        form.style.display = "none";
        form.enctype = "application/x-www-form-urlencoded";

        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "payload_json";
        input.value = requestBody;
        form.appendChild(input);

        document.body.appendChild(iframe);
        document.body.appendChild(form);
        form.submit();

        window.setTimeout(function() {
          form.remove();
          iframe.remove();
          resolve({ ok: true, skipped: false, submitted: true });
        }, 1200);
      } catch (err) {
        reject(err);
      }
    });
  }

  window.submitAppResponse = async function submitAppResponse(type, payload) {
    const cfg = window.getAppConfig();
    if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
      const table = type === "avatar_match" ? "avatar_matches" : "study_responses";
      const row = type === "avatar_match"
        ? {
            match_id: String(payload.id || ""),
            match_at: payload.at || new Date().toISOString(),
            person_name: payload.personName || "",
            state_name: payload.stateName || "",
            avatar_key: payload.avatarKey || "default",
            source: payload.source || "",
            map_key: payload.mapKey || "",
            app: "state-data-explorer",
            page: window.location.href
          }
        : {
            response_id: String(payload.id || ""),
            response_at: payload.at || new Date().toISOString(),
            name: payload.name || "",
            gender: payload.gender || "",
            correct: Number(payload.correct || 0),
            total: Number(payload.total || 0),
            avg_conf: Number(payload.avgConf || 0),
            avg_time: Number(payload.avgTime || 0),
            total_time_ms: Number(payload.totalTimeMs || 0),
            fastest_map: payload.fastestMap || "",
            hardest_reasons: Array.isArray(payload.hardestReasons) ? payload.hardestReasons : [],
            entries_json: Array.isArray(payload.entries) ? payload.entries : [],
            app: "state-data-explorer",
            page: window.location.href
          };

      const response = await fetch(cfg.supabaseUrl + "/rest/v1/" + table, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "apikey": cfg.supabaseAnonKey,
          "Authorization": "Bearer " + cfg.supabaseAnonKey,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(row)
      });

      if (!response.ok) {
        let message = "Supabase request failed with status " + response.status;
        try {
          const data = await response.json();
          if (data && typeof data.message === "string") message = data.message;
          else if (data && typeof data.error === "string") message = data.error;
        } catch (_) {}
        throw new Error(message);
      }

      return { ok: true, skipped: false, backend: "supabase" };
    }

    if (!cfg.responseWebhookUrl) {
      return { ok: false, skipped: true, reason: "missing-backend" };
    }

    const requestBody = JSON.stringify({
      app: "state-data-explorer",
      type: type,
      submittedAt: new Date().toISOString(),
      page: window.location.href,
      payload: payload
    });
    const isGoogleAppsScript = /script\.google\.com\/macros\/s\//.test(cfg.responseWebhookUrl);

    if (isGoogleAppsScript) {
      return submitViaHiddenForm(cfg.responseWebhookUrl, requestBody);
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
      body: requestBody
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
