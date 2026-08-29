import { useEffect } from "react";
import type { ComponentProps } from "react";

export default function Script({ src, ...props }: ComponentProps<"script">) {
  useEffect(() => {
    if (!src) return;
    const script = document.createElement("script");
    script.src = src;
    Object.assign(script, props);
    document.body.appendChild(script);
    return () => script.remove();
  }, [src]);

  return null;
}
