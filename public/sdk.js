// FloatFish OAuth popup SDK.
// Usage on a third-party site:
//   <script src="https://floatfish.vercel.app/sdk.js"></script>
//   <script>
//     FloatFish.signIn({
//       clientId: "key_abc123",
//       redirectUri: "https://yoursite.com/floatfish-callback",
//       scope: "identify",
//       onSuccess: ({ code, state }) => {
//         // POST { code } to your own backend; it exchanges at /api/oauth/token.
//       },
//       onError: (err) => console.error(err),
//     });
//   </script>
//
// The popup redirects to redirectUri with ?code=&state= in the URL. Your
// callback page must call window.opener.postMessage({ source:"floatfish", code, state }, "*")
// then window.close().

(function () {
  var ORIGIN = (document.currentScript && new URL(document.currentScript.src).origin) || "";

  function randState() {
    var a = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.from(a).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function signIn(opts) {
    opts = opts || {};
    if (!opts.clientId || !opts.redirectUri) {
      throw new Error("FloatFish.signIn: clientId and redirectUri are required");
    }
    var state = opts.state || randState();
    var url = ORIGIN + "/api/oauth/authorize"
      + "?client_id=" + encodeURIComponent(opts.clientId)
      + "&redirect_uri=" + encodeURIComponent(opts.redirectUri)
      + "&response_type=code"
      + "&scope=" + encodeURIComponent(opts.scope || "identify")
      + "&state=" + encodeURIComponent(state);

    var w = 460, h = 640;
    var left = (window.screen.width - w) / 2;
    var top = (window.screen.height - h) / 2;
    var popup = window.open(
      url,
      "floatfish-oauth",
      "width=" + w + ",height=" + h + ",left=" + left + ",top=" + top + ",noopener=no,noreferrer=no"
    );
    if (!popup) {
      opts.onError && opts.onError(new Error("popup_blocked"));
      return;
    }

    function onMsg(e) {
      var d = e && e.data;
      if (!d || d.source !== "floatfish") return;
      if (d.state && d.state !== state) {
        opts.onError && opts.onError(new Error("state_mismatch"));
      } else if (d.error) {
        opts.onError && opts.onError(new Error(d.error));
      } else if (d.code) {
        opts.onSuccess && opts.onSuccess({ code: d.code, state: d.state });
      }
      window.removeEventListener("message", onMsg);
      try { popup.close(); } catch (_) {}
    }
    window.addEventListener("message", onMsg);

    // Watchdog: user may close the popup without finishing.
    var iv = setInterval(function () {
      if (popup.closed) {
        clearInterval(iv);
        window.removeEventListener("message", onMsg);
      }
    }, 500);
  }

  window.FloatFish = { signIn: signIn, _origin: ORIGIN };
})();
