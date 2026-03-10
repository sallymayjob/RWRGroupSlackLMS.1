/**
 * Apps Script compatible crypto helpers.
 */
function hmacSha256Hex(secret, message) {
  const raw = Utilities.computeHmacSha256Signature(String(message || ''), String(secret || ''));
  return raw.map(function(b) {
    const v = b < 0 ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function secureCompare(a, b) {
  const left = String(a || '');
  const right = String(b || '');

  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return mismatch === 0;
}
