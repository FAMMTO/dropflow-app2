"use client";

import Script from "next/script";

export function BotsonicWidget() {
  const token =
    process.env.NEXT_PUBLIC_BOTSONIC_TOKEN ||
    "27997401-c91d-4764-88f7-bef13b121db2";
  const baseUrl =
    process.env.NEXT_PUBLIC_BOTSONIC_SERVICE_URL ||
    "https://api-bot.writesonic.com";

  if (!token) return null;

  const scriptContent = `
    (function (w, d, s, o, f, js, fjs) {
      w["botsonic_widget"] = o;
      w[o] =
        w[o] ||
        function () {
          (w[o].q = w[o].q || []).push(arguments);
        };
      (js = d.createElement(s)), (fjs = d.getElementsByTagName(s)[0]);
      js.id = o;
      js.src = f;
      js.async = 1;
      fjs.parentNode.insertBefore(js, fjs);
    })(window, document, "script", "Botsonic", "https://widget.botsonic.com/CDN/botsonic.min.js");
    Botsonic("init", {
      serviceBaseUrl: "${baseUrl}",
      token: "${token}",
    });
  `;

  return (
    <Script
      id="botsonic-widget"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
