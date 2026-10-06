"use client";

import { useEffect, useRef } from "react";

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
};

export default function Turnstile({ siteKey, onToken }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widgetId: string | undefined;

    const render = () => {
      const turnstile = (window as any).turnstile;
      if (ref.current && turnstile?.render) {
        widgetId = turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
        });
      }
    };

    if ((window as any).turnstile?.render) {
      render();
    } else {
      const existing = document.getElementById("turnstile-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        script.onload = render;
        document.body.appendChild(script);
      }
    }

    return () => {
      const turnstile = (window as any).turnstile;
      if (widgetId && turnstile?.remove) turnstile.remove(widgetId);
    };
  }, [siteKey, onToken]);

  return <div ref={ref} />;
}
