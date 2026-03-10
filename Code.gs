/**
 * Apps Script entrypoints.
 *
 * Keep web-app entry functions in Code.gs so Apps Script deployments can
 * discover them quickly.
 */

function doPost(e) {
  var handler = createDoPostHandler();
  var headers = (e && e.headers) ? e.headers : {};
  var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
  var result = handler({ headers: headers, rawBody: rawBody });

  return ContentService
    .createTextOutput(JSON.stringify(result.body || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'slack-lms-webhook' }))
    .setMimeType(ContentService.MimeType.JSON);
}
