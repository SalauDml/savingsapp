// Exists purely to work around a Monzo-side limitation: Monzo's OAuth
// redirect_uri must be http(s), never a custom scheme like cait://. If we
// registered cait://auth/callback directly, Monzo's login-continuation
// email needs to embed a link to it somewhere - and its backend (Go's
// html/template) refuses to render a URL whose scheme isn't http/https/
// mailto, silently substituting the sentinel string "ZgotmplZ" instead of
// a real link. That's why the "log in" button in the magic-link email did
// nothing: there was never a real href there to click.
//
// This function IS the registered redirect_uri (a normal https:// URL, so
// Monzo is happy) - it just hands off to the app's real deep link from
// inside the browser, which is a completely different code path to an
// email template and isn't affected by the same restriction:
//
//   Monzo login email → https://.../oauth-redirect?code=...  (this file)
//                             → browser navigates → cait://auth/callback?code=...
//
// No Supabase client, no auth check, no secrets here - this only ever
// forwards a query string along, so there's nothing to authenticate. That's
// also why this function must be deployed with verify_jwt = false (see
// config.toml): the browser hits this via a plain top-level navigation
// (someone tapping a link/button), which can't attach an Authorization
// header the way supabase.functions.invoke() does elsewhere in this app.
// HTML-attribute escaping for the one untrusted value we embed in the page
// (see the comment on `target` below for why an attribute, not a <script>
// block, is what makes this safe).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

Deno.serve((req) => {
  const url = new URL(req.url)

  // This endpoint is public (verify_jwt = false) - reachable by anyone who
  // constructs a URL to it, not just by a genuine Monzo redirect. So every
  // incoming param is untrusted input, not "whatever Monzo happens to send
  // us". Only ever forward this fixed allowlist, and rebuild the query
  // string with URLSearchParams (which percent-encodes every value) rather
  // than passing the raw url.search straight through unexamined.
  const forwarded = new URLSearchParams()
  for (const key of ['code', 'state', 'error', 'error_description']) {
    const value = url.searchParams.get(key)
    if (value !== null) forwarded.set(key, value)
  }
  const target = `cait://auth/callback?${forwarded.toString()}`

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Reconnecting to CAIT</title>
<style>
  body {
    font-family: -apple-system, Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
    background: #fafafa;
    color: #111;
    gap: 18px;
    text-align: center;
    padding: 24px;
  }
  button {
    font-size: 17px;
    padding: 14px 28px;
    border-radius: 14px;
    border: none;
    background: #111;
    color: #fff;
  }
</style>
</head>
<body>
  <p>Almost done — tap below to jump back into CAIT.</p>
  <!-- target lives in an escaped attribute, not interpolated into a <script>
       block. JSON.stringify()-into-a-script-tag looks safe but isn't: it
       escapes for JS-string syntax, not for HTML parsing, and the browser's
       HTML parser runs first - a value containing "</script>" would close
       the tag early regardless of JSON escaping. An HTML-escaped attribute,
       read back via .dataset, isn't vulnerable to that. -->
  <button id="go" data-target="${escapeHtml(target)}">Continue to CAIT →</button>
  <script>
    var go = document.getElementById('go');
    var target = go.dataset.target;
    go.addEventListener('click', function () {
      window.location.href = target;
    });
    // Best-effort automatic attempt too - some mobile browsers allow a
    // same-load navigation to a custom scheme, most silently block it
    // without a real tap, which is exactly why the button above is the
    // actual, reliable path rather than a decorative fallback.
    window.location.href = target;
  </script>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
})
