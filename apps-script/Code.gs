function doPost(e) {
  try {
    var body = parseRequestBody_(e);
    if (body.type === "avatar_match") {
      appendAvatarMatch_(body);
    } else {
      appendStudyResponse_(body);
    }

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

function appendStudyResponse_(body) {
  var sheet = getOrCreateSheet_("Responses", [
    "received_at",
    "app",
    "type",
    "submitted_at",
    "page",
    "response_id",
    "response_at",
    "name",
    "gender",
    "correct",
    "total",
    "avg_conf",
    "avg_time",
    "total_time_ms",
    "fastest_map",
    "hardest_reasons",
    "entries_json"
  ]);
  var payload = body && body.payload ? body.payload : {};
  var entries = Array.isArray(payload.entries) ? payload.entries : [];

  sheet.appendRow([
    new Date(),
    body.app || "",
    body.type || "",
    body.submittedAt || "",
    body.page || "",
    payload.id || "",
    payload.at || "",
    payload.name || "",
    payload.gender || "",
    payload.correct || "",
    payload.total || "",
    payload.avgConf || "",
    payload.avgTime || "",
    payload.totalTimeMs || "",
    payload.fastestMap || "",
    Array.isArray(payload.hardestReasons) ? payload.hardestReasons.join(" | ") : "",
    JSON.stringify(entries)
  ]);
}

function appendAvatarMatch_(body) {
  var sheet = getOrCreateSheet_("AvatarMatches", [
    "received_at",
    "app",
    "type",
    "submitted_at",
    "page",
    "match_id",
    "match_at",
    "person_name",
    "state_name",
    "avatar_key",
    "source",
    "map_key"
  ]);
  var payload = body && body.payload ? body.payload : {};

  sheet.appendRow([
    new Date(),
    body.app || "",
    body.type || "",
    body.submittedAt || "",
    body.page || "",
    payload.id || "",
    payload.at || "",
    payload.personName || "",
    payload.stateName || "",
    payload.avatarKey || "",
    payload.source || "",
    payload.mapKey || ""
  ]);
}

function getOrCreateSheet_(sheetName, headers) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing POST body");
  }
  return JSON.parse(e.postData.contents);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
