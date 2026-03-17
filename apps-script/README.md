# Google Sheets Setup

1. Create a new Google Sheet.
2. Open `Extensions` -> `Apps Script`.
3. Replace the default script with the contents of `Code.gs`.
4. In Apps Script, click `Deploy` -> `New deployment`.
5. Choose `Web app`.
6. Set:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. Deploy and authorize access.
8. Copy the web app URL.
9. Paste that URL into `window.APP_CONFIG.responseWebhookUrl` in `/index.html`.
10. If you update `Code.gs` later, redeploy the web app so the new version is live.

The site will POST JSON like:

```json
{
  "app": "state-data-explorer",
  "type": "study_attempt",
  "submittedAt": "2026-03-16T23:00:00.000Z",
  "page": "https://your-site.github.io/...",
  "payload": {
    "id": 123,
    "at": "2026-03-16T23:00:00.000Z",
    "name": "Traveler",
    "gender": "female",
    "correct": 4,
    "total": 5,
    "avgConf": 4.2,
    "avgTime": 12.3,
    "totalTimeMs": 61500,
    "fastestMap": "Visitors",
    "hardestReasons": ["Questions were confusing"],
    "entries": []
  }
}
```

The script writes to two tabs:

- `Responses` for completed Map Study submissions
- `AvatarMatches` for state-match avatar placements
